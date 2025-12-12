/**
 * Rota de webhook do WhatsApp (stub temporário).
 * 
 * Esta rota foi criada para resolver problemas de build.
 * Se não for necessária, pode ser removida.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Webhook do WhatsApp não implementado' }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Webhook do WhatsApp não implementado' }, { status: 501 });
}
