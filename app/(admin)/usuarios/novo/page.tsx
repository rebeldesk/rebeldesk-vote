/**
 * Página para criar novo usuário.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UserForm } from '@/components/admin/UserForm';

export default async function NovoUsuarioPage() {
  const session = await auth();

  if (!session || session.user?.perfil !== 'staff') {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Novo Usuário</h1>
      <div className="mt-8">
        <UserForm />
      </div>
    </div>
  );
}

