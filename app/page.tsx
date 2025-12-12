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

  // Redireciona baseado no perfil
  const perfil = session.user?.perfil;

  // Staff vai direto para admin
  if (perfil === 'staff') {
    redirect('/dashboard');
  }

  // Conselho e auditor podem acessar ambas as áreas, mas redireciona para admin primeiro
  // Eles podem navegar para /participar através do menu
  if (perfil === 'conselho') {
    redirect('/dashboard');
  }

  // Auditor e morador vão para área de votante
  redirect('/participar');
}
