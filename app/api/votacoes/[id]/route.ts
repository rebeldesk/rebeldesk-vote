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
  tipo: z.enum(['escolha_unica', 'multipla_escolha']).optional(),
  modo_auditoria: z.enum(['anonimo', 'rastreado']).optional(),
  mostrar_parcial: z.boolean().optional(),
  permitir_alterar_voto: z.boolean().optional(),
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
  opcoes: z.array(z.string().min(1, 'Opção não pode ser vazia')).min(2, 'Deve ter pelo menos 2 opções').optional(),
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
    
    // Verifica se a votação existe e seu status
    const votacaoExistente = await prisma.votacao.findUnique({
      where: { id },
      include: { opcoes: true },
    });

    if (!votacaoExistente) {
      return NextResponse.json({ error: 'Votação não encontrada' }, { status: 404 });
    }

    // Se a votação não está em rascunho, não permite editar opções, tipo e modo_auditoria
    const podeEditarCompleto = votacaoExistente.status === 'rascunho';

    const body = await request.json();
    const dados = atualizarVotacaoSchema.parse(body);

    // Valida se está tentando editar campos bloqueados
    if (!podeEditarCompleto) {
      if (dados.opcoes || dados.tipo || dados.modo_auditoria) {
        return NextResponse.json(
          { error: 'Não é possível editar opções, tipo ou modo de auditoria de uma votação que já foi aberta' },
          { status: 400 }
        );
      }
    }

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

    // Atualiza a votação e opções em uma transação
    const votacao = await prisma.$transaction(async (tx) => {
      // Atualiza dados da votação
      const votacaoAtualizada = await tx.votacao.update({
        where: { id },
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          tipo: dados.tipo,
          modoAuditoria: dados.modo_auditoria,
          mostrarParcial: dados.mostrar_parcial,
          permitirAlterarVoto: dados.permitir_alterar_voto,
          dataInicio: dados.data_inicio ? new Date(dados.data_inicio) : undefined,
          dataFim: dados.data_fim ? new Date(dados.data_fim) : undefined,
          status: dados.status,
        },
        include: { opcoes: true },
      });

      // Se opções foram fornecidas e a votação está em rascunho, atualiza as opções
      if (dados.opcoes && podeEditarCompleto) {
        // Remove opções antigas
        await tx.opcaoVotacao.deleteMany({
          where: { votacaoId: id },
        });

        // Cria novas opções
        await tx.opcaoVotacao.createMany({
          data: dados.opcoes.map((texto, index) => ({
            votacaoId: id,
            texto,
            ordem: index,
          })),
        });

        // Busca opções atualizadas
        const opcoesAtualizadas = await tx.opcaoVotacao.findMany({
          where: { votacaoId: id },
          orderBy: { ordem: 'asc' },
        });

        return { ...votacaoAtualizada, opcoes: opcoesAtualizadas };
      }

      return votacaoAtualizada;
    });

    // Formata resposta
    const votacaoFormatada = {
      ...votacao,
      criado_por: votacao.criadoPor,
      data_inicio: votacao.dataInicio,
      data_fim: votacao.dataFim,
      modo_auditoria: votacao.modoAuditoria,
      mostrar_parcial: votacao.mostrarParcial,
      permitir_alterar_voto: votacao.permitirAlterarVoto,
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

    console.error('Erro ao atualizar votação:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar votação' },
      { status: 500 }
    );
  }
}

