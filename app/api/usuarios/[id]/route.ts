/**
 * API Route para gerenciar um usuário específico.
 * 
 * GET: Busca um usuário por ID
 * PUT: Atualiza um usuário
 * DELETE: Exclui um usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buscarUsuarioPorId, atualizarUsuario } from '@/lib/db';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema de validação para atualizar usuário
const atualizarUsuarioSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  telefone: z.string().optional(),
  perfil: z.enum(['staff', 'conselho', 'auditor', 'morador']).optional(),
  unidade_id: z.string().uuid().nullable().optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff e conselho podem ver usuários
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const usuario = await buscarUsuarioPorId(id);

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Remove password_hash da resposta
    const { password_hash, ...usuarioSemSenha } = usuario as any;

    return NextResponse.json(usuarioSemSenha);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
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

    // Apenas staff e conselho podem atualizar usuários
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const dados = atualizarUsuarioSchema.parse(body);

    // Prepara dados para atualização (inclui senha se fornecida)
    const dadosAtualizacao: any = {
      email: dados.email,
      nome: dados.nome,
      telefone: dados.telefone,
      perfil: dados.perfil,
      unidade_id: dados.unidade_id,
    };

    // Se senha foi fornecida, inclui na atualização
    if (dados.senha) {
      dadosAtualizacao.senha = dados.senha;
    }

    const usuario = await atualizarUsuario(id, dadosAtualizacao);

    // Remove password_hash da resposta
    const { password_hash, ...usuarioSemSenha } = usuario as any;

    return NextResponse.json(usuarioSemSenha);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
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

    // Apenas staff pode excluir usuários
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Não permite excluir a si mesmo
    if (session.user?.id === id) {
      return NextResponse.json(
        { error: 'Não é possível excluir seu próprio usuário' },
        { status: 400 }
      );
    }

    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}

