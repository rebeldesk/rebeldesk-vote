/**
 * API Route para buscar votos (auditoria).
 * 
 * GET: Lista votos de uma votação (apenas se rastreado e usuário tem permissão)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { calcularResultado } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const votacaoId = searchParams.get('votacao_id');

    if (!votacaoId) {
      return NextResponse.json(
        { error: 'votacao_id é obrigatório' },
        { status: 400 }
      );
    }

    // Busca a votação para verificar modo de auditoria
    const votacao = await prisma.votacao.findUnique({
      where: { id: votacaoId },
      select: { modoAuditoria: true },
    });

    if (!votacao) {
      return NextResponse.json({ error: 'Votação não encontrada' }, { status: 404 });
    }

    // Apenas staff OU morador com conselheiro=true podem ver detalhes
    const perfil = session.user?.perfil;
    const conselheiro = session.user?.conselheiro || false;
    const podeAuditar = perfil === 'staff' || (perfil === 'morador' && conselheiro);

    // Se não é rastreado, não há detalhes para mostrar
    if (votacao.modoAuditoria !== 'rastreado') {
      return NextResponse.json({
        error: 'Esta votação não possui rastreamento de votos',
      });
    }

    // Se não tem permissão, não pode ver detalhes
    if (!podeAuditar) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Calcula resultado com detalhes
    const resultado = await calcularResultado(votacaoId, true);

    return NextResponse.json(resultado);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar votos' },
      { status: 500 }
    );
  }
}

