/**
 * Página de troca obrigatória de senha.
 * 
 * Exibida quando o usuário precisa trocar a senha no primeiro login
 * ou quando o staff marcou para forçar troca de senha.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { TrocarSenhaObrigatoriaForm } from '@/components/auth/TrocarSenhaObrigatoriaForm';

export default async function TrocarSenhaObrigatoriaPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Se não precisa trocar senha, redireciona
  if (!session.user?.forcar_troca_senha) {
    const perfil = session.user?.perfil;
    if (perfil === 'staff' || perfil === 'conselho') {
      redirect('/dashboard');
    } else {
      redirect('/participar');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Troca de Senha Obrigatória
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Por segurança, você precisa alterar sua senha antes de continuar
          </p>
        </div>
        <TrocarSenhaObrigatoriaForm />
      </div>
    </div>
  );
}
