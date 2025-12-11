/**
 * Página de login do sistema.
 * 
 * Permite que usuários façam login usando email e senha.
 * Após login bem-sucedido, redireciona baseado no perfil do usuário.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await auth();

  // Se já está autenticado, redireciona
  if (session) {
    const perfil = session.user?.perfil;
    if (perfil === 'staff' || perfil === 'conselho') {
      redirect('/dashboard');
    } else {
      redirect('/votacoes');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sistema de Votação Condominial
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login para continuar
          </p>
        </div>
        <LoginForm callbackUrl={searchParams.callbackUrl} error={searchParams.error} />
      </div>
    </div>
  );
}

