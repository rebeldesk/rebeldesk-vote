/**
 * API Route para gerenciar votações.
 * 
 * GET: Lista todas as votações
 * POST: Cria uma nova votação
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

// Schema de validação
const criarVotacaoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.enum(['escolha_unica', 'multipla_escolha']),
  modo_auditoria: z.enum(['anonimo', 'rastreado']),
  data_inicio: z.string().datetime(),
  data_fim: z.string().datetime(),
  opcoes: z.array(z.string().min(1, 'Opção não pode ser vazia')).min(2, 'Deve ter pelo menos 2 opções'),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('votacoes')
      .select(`
        *,
        criado_por_user:users!votacoes_criado_por_fkey (
          id,
          nome,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar votações' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Apenas staff e conselho podem criar votações
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const dados = criarVotacaoSchema.parse(body);

    // Valida datas
    const dataInicio = new Date(dados.data_inicio);
    const dataFim = new Date(dados.data_fim);

    if (dataFim <= dataInicio) {
      return NextResponse.json(
        { error: 'Data de término deve ser posterior à data de início' },
        { status: 400 }
      );
    }

    // Cria a votação
    const { data: votacao, error: errorVotacao } = await supabaseServer
      .from('votacoes')
      .insert({
        titulo: dados.titulo,
        descricao: dados.descricao || null,
        tipo: dados.tipo,
        modo_auditoria: dados.modo_auditoria,
        criado_por: session.user!.id,
        data_inicio: dados.data_inicio,
        data_fim: dados.data_fim,
        status: 'rascunho',
      })
      .select()
      .single();

    if (errorVotacao || !votacao) {
      return NextResponse.json(
        { error: errorVotacao?.message || 'Erro ao criar votação' },
        { status: 500 }
      );
    }

    // Cria as opções
    const opcoes = dados.opcoes.map((texto, index) => ({
      votacao_id: votacao.id,
      texto,
      ordem: index,
    }));

    const { error: errorOpcoes } = await supabaseServer
      .from('opcoes_votacao')
      .insert(opcoes);

    if (errorOpcoes) {
      // Rollback: exclui a votação se falhar ao criar opções
      await supabaseServer.from('votacoes').delete().eq('id', votacao.id);
      return NextResponse.json(
        { error: 'Erro ao criar opções de votação' },
        { status: 500 }
      );
    }

    return NextResponse.json(votacao, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar votação' },
      { status: 500 }
    );
  }
}

