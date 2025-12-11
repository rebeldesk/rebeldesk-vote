/**
 * Middleware para proteção de rotas e redirecionamento baseado em autenticação.
 * 
 * Este middleware:
 * - Protege rotas administrativas (apenas staff e conselho)
 * - Protege rotas de votante (requer autenticação)
 * - Redireciona usuários não autenticados para login
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Rotas públicas (não requerem autenticação)
  const rotasPublicas = ['/login', '/api/auth'];
  if (rotasPublicas.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next();
  }

  // Se não está autenticado, redireciona para login
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  const perfil = session.user?.perfil;

  // Rotas administrativas - apenas staff e conselho
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/usuarios') || pathname.startsWith('/votacoes') && pathname.includes('/nova') || pathname.includes('/resultado')) {
    if (perfil !== 'staff' && perfil !== 'conselho') {
      return NextResponse.redirect(new URL('/votacoes', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

