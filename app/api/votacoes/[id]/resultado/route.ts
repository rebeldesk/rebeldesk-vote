/**
 * API Route para buscar resultados de uma votação.
 * 
 * GET: Retorna os resultados (parcial ou final) de uma votação.
 * 
 * Se a votação estiver aberta e mostrar_parcial = true, retorna resultados parciais.
 * Se a votação estiver encerrada, sempre retorna os resultados finais.
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

    // Busca a votação para verificar se pode mostrar parcial
    const votacao = await prisma.votacao.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        mostrarParcial: true,
        dataFim: true,
      },
    });

    if (!votacao) {
      return NextResponse.json({ error: 'Votação não encontrada' }, { status: 404 });
    }

    // Se a votação está encerrada, sempre mostra resultados finais
    // Se está aberta, só mostra se mostrar_parcial = true
    const podeMostrarParcial =
      votacao.status === 'encerrada' ||
      (votacao.status === 'aberta' && votacao.mostrarParcial);

    if (!podeMostrarParcial) {
      return NextResponse.json(
        { error: 'Resultados parciais não estão disponíveis para esta votação' },
        { status: 403 }
      );
    }

    // Calcula resultado sem detalhes (apenas totais e percentuais)
    const resultado = await calcularResultado(id, false);

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar resultados' },
      { status: 500 }
    );
  }
}
