/**
 * API Route para gerenciar a vaga de uma unidade.
 * 
 * GET: Busca vaga da unidade
 * POST: Cria vaga para a unidade
 * PUT: Atualiza vaga (marcar como alugada, definir unidade que está usando)
 * DELETE: Deleta vaga
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const criarVagaSchema = z.object({
  esta_alugada: z.boolean().optional().default(false),
  unidade_alugada_id: z.string().uuid().nullable().optional(),
});

const atualizarVagaSchema = z.object({
  esta_alugada: z.boolean().optional(),
  unidade_alugada_id: z.string().uuid().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff e conselho podem ver vagas
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const vaga = await prisma.vaga.findUnique({
      where: { unidadeId: id },
      include: {
        unidadeAlugada: {
          select: {
            id: true,
            numero: true,
          },
        },
        veiculos: {
          select: {
            id: true,
            placa: true,
            modelo: true,
            marca: true,
            tipo: true,
          },
        },
      },
    });

    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: vaga.id,
      unidade_id: vaga.unidadeId,
      esta_alugada: vaga.estaAlugada,
      unidade_alugada: vaga.unidadeAlugada
        ? {
            id: vaga.unidadeAlugada.id,
            numero: vaga.unidadeAlugada.numero,
          }
        : null,
      veiculos: vaga.veiculos,
      created_at: vaga.createdAt?.toISOString(),
      updated_at: vaga.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar vaga:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vaga' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode criar vagas
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Verifica se a unidade existe
    const unidade = await prisma.unidade.findUnique({
      where: { id },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    // Verifica se já existe vaga para esta unidade
    const vagaExistente = await prisma.vaga.findUnique({
      where: { unidadeId: id },
    });

    if (vagaExistente) {
      return NextResponse.json(
        { error: 'Esta unidade já possui uma vaga' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const dados = criarVagaSchema.parse(body);

    // Validação: se está alugada, deve ter unidade_alugada_id
    if (dados.esta_alugada && !dados.unidade_alugada_id) {
      return NextResponse.json(
        { error: 'Se a vaga está alugada, deve informar a unidade que está usando' },
        { status: 400 }
      );
    }

    // Validação: não pode alugar para si mesmo
    if (dados.esta_alugada && dados.unidade_alugada_id === id) {
      return NextResponse.json(
        { error: 'Não é possível alugar a vaga para a própria unidade' },
        { status: 400 }
      );
    }

    const vaga = await prisma.vaga.create({
      data: {
        unidadeId: id,
        estaAlugada: dados.esta_alugada,
        unidadeAlugadaId: dados.unidade_alugada_id || null,
      },
      include: {
        unidadeAlugada: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: vaga.id,
        unidade_id: vaga.unidadeId,
        esta_alugada: vaga.estaAlugada,
        unidade_alugada: vaga.unidadeAlugada
          ? {
              id: vaga.unidadeAlugada.id,
              numero: vaga.unidadeAlugada.numero,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar vaga:', error);
    return NextResponse.json(
      { error: 'Erro ao criar vaga' },
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

    // Apenas staff pode atualizar vagas
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const vaga = await prisma.vaga.findUnique({
      where: { unidadeId: id },
    });

    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const dados = atualizarVagaSchema.parse(body);

    // Validação: se está alugada, deve ter unidade_alugada_id
    if (dados.esta_alugada === true && !dados.unidade_alugada_id) {
      return NextResponse.json(
        { error: 'Se a vaga está alugada, deve informar a unidade que está usando' },
        { status: 400 }
      );
    }

    // Validação: se não está alugada, unidade_alugada_id deve ser null
    if (dados.esta_alugada === false && dados.unidade_alugada_id !== null) {
      return NextResponse.json(
        { error: 'Se a vaga não está alugada, não deve informar unidade que está usando' },
        { status: 400 }
      );
    }

    // Validação: não pode alugar para si mesmo
    if (dados.esta_alugada === true && dados.unidade_alugada_id === id) {
      return NextResponse.json(
        { error: 'Não é possível alugar a vaga para a própria unidade' },
        { status: 400 }
      );
    }

    const vagaAtualizada = await prisma.vaga.update({
      where: { id: vaga.id },
      data: {
        estaAlugada: dados.esta_alugada !== undefined ? dados.esta_alugada : vaga.estaAlugada,
        unidadeAlugadaId:
          dados.unidade_alugada_id !== undefined ? dados.unidade_alugada_id : vaga.unidadeAlugadaId,
      },
      include: {
        unidadeAlugada: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: vagaAtualizada.id,
      unidade_id: vagaAtualizada.unidadeId,
      esta_alugada: vagaAtualizada.estaAlugada,
      unidade_alugada: vagaAtualizada.unidadeAlugada
        ? {
            id: vagaAtualizada.unidadeAlugada.id,
            numero: vagaAtualizada.unidadeAlugada.numero,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar vaga:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar vaga' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode deletar vagas
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const vaga = await prisma.vaga.findUnique({
      where: { unidadeId: id },
    });

    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    await prisma.vaga.delete({
      where: { id: vaga.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar vaga:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar vaga' },
      { status: 500 }
    );
  }
}
