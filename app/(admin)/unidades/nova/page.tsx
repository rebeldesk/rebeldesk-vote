/**
 * Página para criar nova unidade.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UnidadeForm } from '@/components/admin/UnidadeForm';

export default async function NovaUnidadePage() {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
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

