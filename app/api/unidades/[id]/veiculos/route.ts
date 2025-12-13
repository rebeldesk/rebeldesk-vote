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

    // Apenas staff OU morador com conselheiro=true podem ver veículos
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

    // Se vaga_id foi informado, verifica se a unidade pode usar a vaga
    if (dados.vaga_id) {
      const vaga = await prisma.vaga.findUnique({
        where: { id: dados.vaga_id },
        include: {
          unidade: {
            select: {
              temDireitoVaga: true,
            },
          },
        },
      });

      if (!vaga) {
        return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
      }

      // Se a vaga pertence à unidade (vaga própria)
      if (vaga.unidadeId === id) {
        // Se não tem direito a vaga própria, não pode usar
        const unidadeAtual = await prisma.unidade.findUnique({
          where: { id },
          select: {
            temDireitoVaga: true,
          },
        });

        if (!unidadeAtual?.temDireitoVaga) {
          return NextResponse.json(
            { error: 'Esta unidade não tem direito a vaga de estacionamento' },
            { status: 403 }
          );
        }
        // Se a vaga própria está alugada, não permite associar veículo
        if (vaga.estaAlugada) {
          return NextResponse.json(
            { error: 'Não é possível associar veículo à vaga. Esta vaga está alugada para outra unidade.' },
            { status: 403 }
          );
        }
      } else if (vaga.unidadeAlugadaId === id) {
        // Se a vaga está alugada para a unidade (vaga alugada)
        // Permite usar vaga alugada mesmo sem direito a vaga própria
        // Não precisa verificar temDireitoVaga aqui
      } else {
        // A vaga não pertence à unidade nem está alugada para ela
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error?.code === 'P2002' && error?.meta?.target?.includes('placa')) {
      return NextResponse.json(
        { error: 'Placa já cadastrada no sistema' },
        { status: 409 }
      );
    }

    console.error('Erro ao criar veículo:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao criar veículo' },
      { status: 500 }
    );
  }
}
