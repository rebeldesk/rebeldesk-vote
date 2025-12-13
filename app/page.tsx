/**
 * Página inicial - redireciona baseado no status de autenticação
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Se precisa trocar senha, redireciona para página de troca obrigatória
  if (session.user?.forcar_troca_senha) {
    redirect('/trocar-senha-obrigatoria');
  }

  // Redireciona baseado no perfil
  const perfil = session.user?.perfil;
  const conselheiro = session.user?.conselheiro || false;

  // Staff vai direto para admin
  if (perfil === 'staff') {
    redirect('/dashboard');
  }

  // Morador com conselheiro=true pode acessar ambas as áreas, mas redireciona para admin primeiro
  // Eles podem navegar para /participar através do menu
  if (perfil === 'morador' && conselheiro) {
    redirect('/dashboard');
  }

  // Morador sem conselho vai para área de votante
  redirect('/participar');
}
