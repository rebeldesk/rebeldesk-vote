/**
 * API Route para alteração de senha do próprio usuário.
 * 
 * POST: Altera a senha do usuário logado após validar a senha atual.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verificarSenha, hashSenha } from '@/lib/password';
import { z } from 'zod';

const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  novaSenha: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const dados = alterarSenhaSchema.parse(body);

    // Busca o usuário com a senha atual
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verifica a senha atual
    const senhaValida = await verificarSenha(
      dados.senhaAtual,
      usuario.passwordHash
    );

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 400 }
      );
    }

    // Verifica se a nova senha é diferente da atual
    const mesmaSenha = await verificarSenha(
      dados.novaSenha,
      usuario.passwordHash
    );

    if (mesmaSenha) {
      return NextResponse.json(
        { error: 'A nova senha deve ser diferente da senha atual' },
        { status: 400 }
      );
    }

    // Gera hash da nova senha
    const novoHash = await hashSenha(dados.novaSenha);

    // Atualiza a senha e remove o flag de forçar troca (se existir)
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        passwordHash: novoHash,
        forcarTrocaSenha: false, // Remove o flag após trocar
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
}

