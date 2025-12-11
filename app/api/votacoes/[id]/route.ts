/**
 * API Route para gerenciar uma votação específica.
 * 
 * GET: Busca uma votação com suas opções
 * PUT: Atualiza uma votação
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buscarVotacaoCompleta } from '@/lib/db';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

const atualizarVotacaoSchema = z.object({
  titulo: z.string().min(1).optional(),
  descricao: z.string().optional(),
  data_inicio: z.string().datetime().optional(),
  data_fim: z.string().datetime().optional(),
  status: z.enum(['rascunho', 'aberta', 'encerrada']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const votacaoCompleta = await buscarVotacaoCompleta(id);

    if (!votacaoCompleta) {
      return NextResponse.json({ error: 'Votação não encontrada' }, { status: 404 });
    }

    return NextResponse.json(votacaoCompleta);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar votação' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff e conselho podem atualizar votações
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const dados = atualizarVotacaoSchema.parse(body);

    // Valida datas se ambas foram fornecidas
    if (dados.data_inicio && dados.data_fim) {
      const dataInicio = new Date(dados.data_inicio);
      const dataFim = new Date(dados.data_fim);

      if (dataFim <= dataInicio) {
        return NextResponse.json(
          { error: 'Data de término deve ser posterior à data de início' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseServer
      .from('votacoes')
      .update({
        ...dados,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Erro ao atualizar votação' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar votação' },
      { status: 500 }
    );
  }
}

