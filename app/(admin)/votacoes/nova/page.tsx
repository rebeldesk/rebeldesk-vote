/**
 * Página para criar nova votação.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { VotingForm } from '@/components/admin/VotingForm';

export default async function NovaVotacaoPage() {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Nova Votação</h1>
      <div className="mt-8">
        <VotingForm />
      </div>
    </div>
  );
}

