/**
 * API Route para gerenciar um morador específico.
 * 
 * PUT: Atualiza morador
 * DELETE: Deleta morador
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const atualizarMoradorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255).optional(),
  documento: z.string().min(1, 'Documento é obrigatório').max(20).optional(),
  grau_parentesco: z.enum(['Conjuge', 'Filho', 'Pai', 'Mae', 'Outro']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moradorId: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode atualizar moradores
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id, moradorId } = await params;

    // Verifica se o morador existe e pertence à unidade
    const morador = await prisma.morador.findUnique({
      where: { id: moradorId },
    });

    if (!morador) {
      return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 });
    }

    if (morador.unidadeId !== id) {
      return NextResponse.json(
        { error: 'Morador não pertence a esta unidade' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const dados = atualizarMoradorSchema.parse(body);

    const moradorAtualizado = await prisma.morador.update({
      where: { id: moradorId },
      data: {
        nome: dados.nome,
        documento: dados.documento,
        grauParentesco: dados.grau_parentesco,
      },
    });

    return NextResponse.json({
      id: moradorAtualizado.id,
      nome: moradorAtualizado.nome,
      documento: moradorAtualizado.documento,
      grau_parentesco: moradorAtualizado.grauParentesco,
      created_at: moradorAtualizado.createdAt?.toISOString(),
      updated_at: moradorAtualizado.updatedAt?.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error?.code === 'P2002') {
      // Erro de constraint único
      if (error?.meta?.target?.includes('documento')) {
        return NextResponse.json(
          { error: 'Documento já cadastrado no sistema' },
          { status: 409 }
        );
      }
    }

    console.error('Erro ao atualizar morador:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar morador' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moradorId: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode excluir moradores
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id, moradorId } = await params;

    // Verifica se o morador existe e pertence à unidade
    const morador = await prisma.morador.findUnique({
      where: { id: moradorId },
    });

    if (!morador) {
      return NextResponse.json({ error: 'Morador não encontrado' }, { status: 404 });
    }

    if (morador.unidadeId !== id) {
      return NextResponse.json(
        { error: 'Morador não pertence a esta unidade' },
        { status: 403 }
      );
    }

    await prisma.morador.delete({
      where: { id: moradorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir morador:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir morador' },
      { status: 500 }
    );
  }
}
