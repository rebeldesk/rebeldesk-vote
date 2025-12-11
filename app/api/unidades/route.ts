/**
 * API Route para gerenciar unidades.
 * 
 * GET: Lista todas as unidades
 * POST: Cria uma nova unidade
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listarUnidades, criarUnidade } from '@/lib/db';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema de validação
const criarUnidadeSchema = z.object({
  numero: z.string().min(1, 'Número da unidade é obrigatório'),
});

export async function GET() {
  try {
    const session = await auth();

    // Apenas staff e conselho podem listar unidades
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const unidades = await listarUnidades();
    return NextResponse.json(unidades);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar unidades' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Apenas staff e conselho podem criar unidades
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const dados = criarUnidadeSchema.parse(body);

    const unidade = await criarUnidade(dados.numero);

    return NextResponse.json(unidade, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Número de unidade já cadastrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar unidade' },
      { status: 500 }
    );
  }
}

