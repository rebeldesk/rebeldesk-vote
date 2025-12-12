/**
 * API Route para buscar resultados parciais de uma votação.
 * 
 * GET: Retorna resultados parciais (apenas se mostrar_parcial = true e votação está aberta)
 * 
 * Esta rota é acessível para votantes quando a votação permite mostrar parcial.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calcularResultado } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Busca a votação para verificar se permite mostrar parcial
    const votacao = await prisma.votacao.findUnique({
      where: { id },
      select: {
        id: true,
        mostrarParcial: true,
        status: true,
        dataInicio: true,
        dataFim: true,
      },
    });

    if (!votacao) {
      return NextResponse.json({ error: 'Votação não encontrada' }, { status: 404 });
    }

    // Verifica se a votação permite mostrar parcial
    if (!votacao.mostrarParcial) {
      return NextResponse.json(
        { error: 'Esta votação não permite visualizar resultados parciais' },
        { status: 403 }
      );
    }

    // Verifica se a votação está aberta
    if (votacao.status !== 'aberta') {
      return NextResponse.json(
        { error: 'Resultados parciais só estão disponíveis para votações abertas' },
        { status: 403 }
      );
    }

    // Verifica se está no período da votação
    const agora = new Date();
    const dataInicio = new Date(votacao.dataInicio);
    const dataFim = new Date(votacao.dataFim);

    if (agora < dataInicio || agora > dataFim) {
      return NextResponse.json(
        { error: 'Resultados parciais só estão disponíveis durante o período de votação' },
        { status: 403 }
      );
    }

    // Calcula e retorna o resultado (sem detalhes dos votos para votantes)
    const resultado = await calcularResultado(id, false);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar resultados parciais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resultados parciais' },
      { status: 500 }
    );
  }
}
