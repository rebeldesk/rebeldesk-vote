/**
 * API Route para gerenciar um veículo específico.
 * 
 * PUT: Atualiza veículo
 * DELETE: Deleta veículo
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const atualizarVeiculoSchema = z.object({
  placa: z.string().min(1, 'Placa é obrigatória').max(10).optional(),
  modelo: z.string().min(1, 'Modelo é obrigatório').max(100).optional(),
  marca: z.string().min(1, 'Marca é obrigatória').max(100).optional(),
  tipo: z.enum(['carro', 'moto']).optional(),
  vaga_id: z.string().uuid().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; veiculoId: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode atualizar veículos
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id, veiculoId } = await params;

    // Verifica se o veículo existe e pertence à unidade
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: veiculoId },
    });

    if (!veiculo) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    if (veiculo.unidadeId !== id) {
      return NextResponse.json(
        { error: 'Veículo não pertence a esta unidade' },
        { status: 403 }
      );
    }

    // Verifica se a unidade tem direito a vaga
    const unidade = await prisma.unidade.findUnique({
      where: { id },
      select: {
        temDireitoVaga: true,
      },
    });

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const dados = atualizarVeiculoSchema.parse(body);

    // Se vaga_id foi informado, verifica se a vaga pertence à unidade
    if (dados.vaga_id !== undefined) {
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
          if (!unidade.temDireitoVaga) {
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

        // Verifica se a vaga pertence à unidade ou se está alugada para ela
        if (vaga.unidadeId !== id && vaga.unidadeAlugadaId !== id) {
          return NextResponse.json(
            { error: 'A vaga não pertence a esta unidade' },
            { status: 403 }
          );
        }
      }
    }

    const veiculoAtualizado = await prisma.veiculo.update({
      where: { id: veiculoId },
      data: {
        placa: dados.placa ? dados.placa.toUpperCase().replace(/\s/g, '') : undefined,
        modelo: dados.modelo,
        marca: dados.marca,
        tipo: dados.tipo,
        vagaId: dados.vaga_id !== undefined ? dados.vaga_id : undefined,
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

    return NextResponse.json({
      id: veiculoAtualizado.id,
      placa: veiculoAtualizado.placa,
      modelo: veiculoAtualizado.modelo,
      marca: veiculoAtualizado.marca,
      tipo: veiculoAtualizado.tipo,
      vaga_id: veiculoAtualizado.vagaId,
    });
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

    console.error('Erro ao atualizar veículo:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar veículo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; veiculoId: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode deletar veículos
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id, veiculoId } = await params;

    // Verifica se o veículo existe e pertence à unidade
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: veiculoId },
    });

    if (!veiculo) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    if (veiculo.unidadeId !== id) {
      return NextResponse.json(
        { error: 'Veículo não pertence a esta unidade' },
        { status: 403 }
      );
    }

    await prisma.veiculo.delete({
      where: { id: veiculoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar veículo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar veículo' },
      { status: 500 }
    );
  }
}
