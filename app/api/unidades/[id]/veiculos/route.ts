/**
 * API Route para gerenciar veículos de uma unidade.
 * 
 * GET: Lista veículos da unidade
 * POST: Cria novo veículo
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const criarVeiculoSchema = z.object({
  placa: z.string().min(1, 'Placa é obrigatória').max(10),
  modelo: z.string().min(1, 'Modelo é obrigatório').max(100),
  marca: z.string().min(1, 'Marca é obrigatória').max(100),
  tipo: z.enum(['carro', 'moto']),
  vaga_id: z.string().uuid().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff e conselho podem ver veículos
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
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

    const veiculos = await prisma.veiculo.findMany({
      where: { unidadeId: id },
      include: {
        vaga: {
          select: {
            id: true,
            unidadeId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      veiculos.map((v) => ({
        id: v.id,
        placa: v.placa,
        modelo: v.modelo,
        marca: v.marca,
        tipo: v.tipo,
        vaga_id: v.vagaId,
        created_at: v.createdAt?.toISOString(),
        updated_at: v.updatedAt?.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Erro ao listar veículos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar veículos' },
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

    // Apenas staff pode criar veículos
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
    const dados = criarVeiculoSchema.parse(body);

    // Se vaga_id foi informado, verifica se a vaga pertence à unidade
    if (dados.vaga_id) {
      const vaga = await prisma.vaga.findUnique({
        where: { id: dados.vaga_id },
      });

      if (!vaga) {
        return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
      }

      // Verifica se a vaga pertence à unidade ou se está alugada para ela
      if (vaga.unidadeId !== id && vaga.unidadeAlugadaId !== id) {
        return NextResponse.json(
          { error: 'A vaga não pertence a esta unidade' },
          { status: 403 }
        );
      }
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        unidadeId: id,
        placa: dados.placa.toUpperCase().replace(/\s/g, ''),
        modelo: dados.modelo,
        marca: dados.marca,
        tipo: dados.tipo,
        vagaId: dados.vaga_id || null,
      },
      include: {
        vaga: {
          select: {
            id: true,
            unidadeId: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: veiculo.id,
        placa: veiculo.placa,
        modelo: veiculo.modelo,
        marca: veiculo.marca,
        tipo: veiculo.tipo,
        vaga_id: veiculo.vagaId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Placa já cadastrada' },
        { status: 409 }
      );
    }

    console.error('Erro ao criar veículo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar veículo' },
      { status: 500 }
    );
  }
}
