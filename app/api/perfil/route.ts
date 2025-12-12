/**
 * API Route para o perfil do usuário logado.
 * 
 * GET: Busca dados do próprio perfil
 * PUT: Atualiza apenas telefone do próprio perfil
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buscarUsuarioPorId, atualizarUsuario } from '@/lib/db';
import { z } from 'zod';

// Schema de validação para atualizar perfil (apenas telefone)
const atualizarPerfilSchema = z.object({
  telefone: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const usuario = await buscarUsuarioPorId(session.user.id);

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Remove password_hash da resposta
    const { password_hash, ...usuarioSemSenha } = usuario as any;

    return NextResponse.json(usuarioSemSenha);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const dados = atualizarPerfilSchema.parse(body);

    // Atualiza apenas o telefone
    const usuario = await atualizarUsuario(session.user.id, {
      telefone: dados.telefone,
    });

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
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
}
