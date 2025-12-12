/**
 * API Route para registrar um voto em uma votação.
 * 
 * POST: Registra um voto de uma unidade
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registrarVoto, buscarUnidadesUsuario } from '@/lib/db';
import { z } from 'zod';

const registrarVotoSchema = z.object({
  opcoes_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos uma opção'),
  unidade_id: z.string().uuid().optional(), // Opcional: se não fornecido, usa da sessão
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

    const { id } = await params;
    const body = await request.json();
    const dados = registrarVotoSchema.parse(body);

    // Determina qual unidade usar
    let unidadeId: string | null = null;

    if (dados.unidade_id) {
      // Se unidade_id foi fornecido, valida se pertence ao usuário
      unidadeId = dados.unidade_id;
    } else if (session.user?.unidade_id) {
      // Se não foi fornecido, usa da sessão (compatibilidade)
      unidadeId = session.user.unidade_id;
    }

    if (!unidadeId) {
      return NextResponse.json(
        { error: 'Unidade não especificada. Selecione uma unidade para votar.' },
        { status: 400 }
      );
    }

    // Valida se a unidade pertence ao usuário
    const unidadesUsuario = await buscarUnidadesUsuario(session.user.id);
    const unidadePertenceAoUsuario = unidadesUsuario.some(u => u.id === unidadeId);

    if (!unidadePertenceAoUsuario) {
      return NextResponse.json(
        { error: 'Você não tem permissão para votar com esta unidade' },
        { status: 403 }
      );
    }

    const voto = await registrarVoto(
      id,
      unidadeId,
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

