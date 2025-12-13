/**
 * API Route para gerenciar moradores de uma unidade.
 * 
 * GET: Lista moradores da unidade
 * POST: Cria novo morador
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const criarMoradorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  documento: z.string().min(1, 'Documento é obrigatório').max(20),
  grau_parentesco: z.enum(['Conjuge', 'Filho', 'Pai', 'Mae', 'Outro']),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff OU morador com conselheiro=true podem ver moradores
    const perfil = session.user?.perfil;
    const conselheiro = session.user?.conselheiro || false;
    if (!session || (perfil !== 'staff' && !(perfil === 'morador' && conselheiro))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Verifica se a unidade existe
    const unidade = await prisma.unidade.findUnique({
      where: { id },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    const moradores = await prisma.morador.findMany({
      where: { unidadeId: id },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(
      moradores.map((m) => ({
        id: m.id,
        nome: m.nome,
        documento: m.documento,
        grau_parentesco: m.grauParentesco,
        created_at: m.createdAt?.toISOString(),
        updated_at: m.updatedAt?.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Erro ao buscar moradores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar moradores' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode criar moradores
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Verifica se a unidade existe
    const unidade = await prisma.unidade.findUnique({
      where: { id },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const dados = criarMoradorSchema.parse(body);

    const morador = await prisma.morador.create({
      data: {
        unidadeId: id,
        nome: dados.nome,
        documento: dados.documento,
        grauParentesco: dados.grau_parentesco,
      },
    });

    return NextResponse.json({
      id: morador.id,
      nome: morador.nome,
      documento: morador.documento,
      grau_parentesco: morador.grauParentesco,
      created_at: morador.createdAt?.toISOString(),
      updated_at: morador.updatedAt?.toISOString(),
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

    console.error('Erro ao criar morador:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao criar morador' },
      { status: 500 }
    );
  }
}
