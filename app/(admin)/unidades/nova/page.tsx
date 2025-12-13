/**
 * Página para criar nova unidade.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UnidadeForm } from '@/components/admin/UnidadeForm';

export default async function NovaUnidadePage() {
  const session = await auth();

  const perfil = session.user?.perfil;
  const conselheiro = session.user?.conselheiro || false;
  if (!session || (perfil !== 'staff' && !(perfil === 'morador' && conselheiro))) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Nova Unidade</h1>
      <div className="mt-8">
        <UnidadeForm />
      </div>
    </div>
  );
}

