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

  if (perfil === 'staff' || perfil === 'conselho') {
    redirect('/dashboard');
  }

  // Para outros perfis (auditor, morador), vai para área de votante
  redirect('/votacoes');
}
