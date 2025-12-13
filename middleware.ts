/**
 * Middleware para proteção de rotas e redirecionamento baseado em autenticação.
 * 
 * Este middleware:
 * - Protege rotas administrativas (apenas staff e moradores com conselheiro=true)
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
  const rotasPublicas = ['/login', '/api/auth', '/trocar-senha-obrigatoria'];
  if (rotasPublicas.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next();
  }

  // Se não está autenticado, redireciona para login
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Se precisa trocar senha, redireciona para página de troca obrigatória
  // (exceto se já estiver na página de trocar senha ou em rotas de API)
  if (
    session.user?.forcar_troca_senha && 
    !pathname.startsWith('/trocar-senha-obrigatoria') &&
    !pathname.startsWith('/api/auth/alterar-senha-obrigatoria')
  ) {
    return NextResponse.redirect(new URL('/trocar-senha-obrigatoria', request.url));
  }

  const perfil = session.user?.perfil;
  const conselheiro = session.user?.conselheiro || false;

  // Rotas de usuários - apenas staff
  if (pathname.startsWith('/usuarios')) {
    if (perfil !== 'staff') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Rotas administrativas - staff OU morador com conselheiro=true
  if (pathname.startsWith('/dashboard') || (pathname.startsWith('/votacoes') && (pathname.includes('/nova') || pathname.includes('/resultado')))) {
    if (perfil !== 'staff' && !(perfil === 'morador' && conselheiro)) {
      return NextResponse.redirect(new URL('/participar', request.url));
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

