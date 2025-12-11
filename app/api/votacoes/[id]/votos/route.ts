/**
 * API Route para registrar um voto em uma votação.
 * 
 * POST: Registra um voto de uma unidade
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registrarVoto } from '@/lib/db';
import { z } from 'zod';

const registrarVotoSchema = z.object({
  opcoes_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos uma opção'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica se usuário tem unidade (necessário para votar)
    if (!session.user?.unidade_id) {
      return NextResponse.json(
        { error: 'Usuário não está vinculado a uma unidade' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const dados = registrarVotoSchema.parse(body);

    const voto = await registrarVoto(
      id,
      session.user.unidade_id,
      dados.opcoes_ids,
      session.user.id
    );

    return NextResponse.json(voto, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Erro ao registrar voto' },
      { status: 500 }
    );
  }
}

