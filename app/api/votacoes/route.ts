/**
 * API Route para gerenciar votações.
 * 
 * GET: Lista todas as votações
 * POST: Cria uma nova votação
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema de validação
const criarVotacaoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.enum(['escolha_unica', 'multipla_escolha']),
  modo_auditoria: z.enum(['anonimo', 'rastreado']),
  mostrar_parcial: z.boolean().optional().default(false),
  // Aceita formato datetime-local (YYYY-MM-DDTHH:mm) ou datetime ISO completo
  data_inicio: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Data de início inválida' }
  ),
  data_fim: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Data de término inválida' }
  ),
  opcoes: z.array(z.string().min(1, 'Opção não pode ser vazia')).min(2, 'Deve ter pelo menos 2 opções'),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const votacoes = await prisma.votacao.findMany({
      include: {
        criadoPorUser: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formata resposta para manter compatibilidade
    const votacoesFormatadas = votacoes.map((v) => ({
      ...v,
      criado_por: v.criadoPor,
      data_inicio: v.dataInicio,
      data_fim: v.dataFim,
      modo_auditoria: v.modoAuditoria,
      mostrar_parcial: v.mostrarParcial,
      created_at: v.createdAt,
      updated_at: v.updatedAt,
      criado_por_user: v.criadoPorUser,
    }));

    return NextResponse.json(votacoesFormatadas);
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

    // Cria a votação com opções em uma transação
    const votacao = await prisma.votacao.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao || null,
        tipo: dados.tipo,
        modoAuditoria: dados.modo_auditoria,
        mostrarParcial: dados.mostrar_parcial ?? false,
        criadoPor: session.user!.id,
        dataInicio: new Date(dados.data_inicio),
        dataFim: new Date(dados.data_fim),
        status: 'rascunho',
        opcoes: {
          create: dados.opcoes.map((texto, index) => ({
            texto,
            ordem: index,
          })),
        },
      },
      include: {
        opcoes: true,
      },
    });

    // Formata resposta para manter compatibilidade
    const votacaoFormatada = {
      ...votacao,
      criado_por: votacao.criadoPor,
      data_inicio: votacao.dataInicio,
      data_fim: votacao.dataFim,
      modo_auditoria: votacao.modoAuditoria,
      mostrar_parcial: votacao.mostrarParcial,
      created_at: votacao.createdAt,
      updated_at: votacao.updatedAt,
    };

    return NextResponse.json(votacaoFormatada, { status: 201 });
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

