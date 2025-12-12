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
import { prisma } from '@/lib/prisma';

const atualizarVotacaoSchema = z.object({
  titulo: z.string().min(1).optional(),
  descricao: z.string().optional(),
  // Aceita formato datetime-local (YYYY-MM-DDTHH:mm) ou datetime ISO completo
  data_inicio: z.string().refine(
    (val) => {
      if (!val) return true; // opcional
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Data de início inválida' }
  ).optional(),
  data_fim: z.string().refine(
    (val) => {
      if (!val) return true; // opcional
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Data de término inválida' }
  ).optional(),
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

    const votacao = await prisma.votacao.update({
      where: { id },
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        dataInicio: dados.data_inicio ? new Date(dados.data_inicio) : undefined,
        dataFim: dados.data_fim ? new Date(dados.data_fim) : undefined,
        status: dados.status,
      },
    });

    // Formata resposta
    const votacaoFormatada = {
      ...votacao,
      criado_por: votacao.criadoPor,
      data_inicio: votacao.dataInicio,
      data_fim: votacao.dataFim,
      modo_auditoria: votacao.modoAuditoria,
      created_at: votacao.createdAt,
      updated_at: votacao.updatedAt,
    };

    return NextResponse.json(votacaoFormatada);
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

