/**
 * API Route para gerenciar usuários.
 * 
 * GET: Lista todos os usuários
 * POST: Cria um novo usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { criarUsuario } from '@/lib/db';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema de validação para criar usuário
const criarUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().optional(),
  perfil: z.enum(['staff', 'conselho', 'auditor', 'morador']),
  // Aceita string vazia, UUID válido ou null/undefined
  unidade_id: z
    .union([z.string().uuid(), z.string().length(0), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === undefined ? null : val)),
});

export async function GET() {
  try {
    const session = await auth();

    // Apenas staff e conselho podem listar usuários
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const usuarios = await prisma.usuario.findMany({
      include: {
        unidade: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove passwordHash e formata resposta
    const usuariosFormatados = usuarios.map((u) => {
      const { passwordHash, ...rest } = u;
      return {
        ...rest,
        unidade_id: rest.unidadeId,
        created_at: rest.createdAt,
        updated_at: rest.updatedAt,
        unidades: rest.unidade ? {
          id: rest.unidade.id,
          numero: rest.unidade.numero,
        } : null,
      };
    });

    return NextResponse.json(usuariosFormatados);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Apenas staff e conselho podem criar usuários
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const dados = criarUsuarioSchema.parse(body);

    const usuario = await criarUsuario({
      email: dados.email,
      senha: dados.senha,
      nome: dados.nome,
      telefone: dados.telefone || '',
      perfil: dados.perfil,
      unidade_id: dados.unidade_id, // Já normalizado pelo schema Zod
    });

    // Remove passwordHash da resposta
    const { passwordHash, ...usuarioSemSenha } = usuario as any;

    return NextResponse.json(usuarioSemSenha, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Email já cadastrado') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

