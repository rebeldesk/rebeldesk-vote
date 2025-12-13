/**
 * API Route para gerenciar uma unidade específica.
 * 
 * GET: Busca detalhes da unidade
 * DELETE: Exclui uma unidade
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff OU morador com conselheiro=true podem ver detalhes de unidades
    const perfil = session.user?.perfil;
    const conselheiro = session.user?.conselheiro || false;
    if (!session || (perfil !== 'staff' && !(perfil === 'morador' && conselheiro))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const unidade = await prisma.unidade.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usuarioUnidades: true,
            votos: true,
          },
        },
        usuarioUnidades: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
              },
            },
          },
        },
        vaga: {
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
        },
        veiculos: {
          include: {
            vaga: {
              select: {
                id: true,
                unidadeId: true,
              },
            },
          },
        },
      },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: unidade.id,
      numero: unidade.numero,
      tem_direito_vaga: unidade.temDireitoVaga,
      created_at: unidade.createdAt?.toISOString(),
      updated_at: unidade.updatedAt?.toISOString(),
      total_usuarios: unidade._count.usuarioUnidades,
      usuarios: unidade.usuarioUnidades.map((uu) => ({
        id: uu.usuario.id,
        nome: uu.usuario.nome,
        email: uu.usuario.email,
        perfil: uu.usuario.perfil,
      })),
      vaga: unidade.vaga
        ? {
            id: unidade.vaga.id,
            esta_alugada: unidade.vaga.estaAlugada,
            unidade_alugada: unidade.vaga.unidadeAlugada
              ? {
                  id: unidade.vaga.unidadeAlugada.id,
                  numero: unidade.vaga.unidadeAlugada.numero,
                }
              : null,
            veiculos: unidade.vaga.veiculos,
          }
        : null,
      veiculos: unidade.veiculos.map((v) => ({
        id: v.id,
        placa: v.placa,
        modelo: v.modelo,
        marca: v.marca,
        tipo: v.tipo,
        vaga_id: v.vagaId,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar unidade:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar unidade' },
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

    // Apenas staff pode atualizar unidades
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { numero, tem_direito_vaga } = body;

    // Verifica se a unidade existe
    const unidade = await prisma.unidade.findUnique({
      where: { id },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    // Prepara dados para atualização
    const dadosAtualizacao: any = {};
    
    if (numero !== undefined) {
      dadosAtualizacao.numero = numero;
    }
    
    if (tem_direito_vaga !== undefined) {
      dadosAtualizacao.temDireitoVaga = tem_direito_vaga;
    }

    const unidadeAtualizada = await prisma.unidade.update({
      where: { id },
      data: dadosAtualizacao,
    });

    return NextResponse.json({
      id: unidadeAtualizada.id,
      numero: unidadeAtualizada.numero,
      tem_direito_vaga: unidadeAtualizada.temDireitoVaga,
      created_at: unidadeAtualizada.createdAt?.toISOString(),
      updated_at: unidadeAtualizada.updatedAt?.toISOString(),
    });
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('numero')) {
      return NextResponse.json(
        { error: 'Número de unidade já cadastrado' },
        { status: 409 }
      );
    }

    console.error('Erro ao atualizar unidade:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar unidade' },
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
