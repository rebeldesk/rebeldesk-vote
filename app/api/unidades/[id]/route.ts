/**
 * API Route para gerenciar uma unidade específica.
 * 
 * DELETE: Exclui uma unidade
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode excluir unidades
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Verifica se a unidade existe
    const unidade = await prisma.unidade.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarioUnidades: true,
            votos: true,
          },
        },
      },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    // Avisa se há usuários vinculados, mas permite deletar (CASCADE vai remover os relacionamentos)
    if (unidade._count.usuarioUnidades > 0) {
      // Ainda permite deletar, mas poderia retornar erro se preferir
      // Por enquanto, vamos permitir e o CASCADE vai remover os relacionamentos
    }

    // Deleta a unidade (CASCADE vai remover relacionamentos em usuario_unidades e votos)
    await prisma.unidade.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir unidade:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir unidade' },
      { status: 500 }
    );
  }
}
