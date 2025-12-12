/**
 * Página de perfil do usuário.
 * 
 * Permite que o usuário visualize seus dados e atualize apenas telefone e senha.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buscarUsuarioPorId } from '@/lib/db';
import { PerfilForm } from '@/components/votante/PerfilForm';

export default async function PerfilPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect('/login');
  }

  const usuario = await buscarUsuarioPorId(session.user.id);

  if (!usuario) {
    redirect('/login');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-2 text-sm text-gray-600">
          Visualize e atualize suas informações pessoais
        </p>
      </div>

      <div className="mt-8">
        <PerfilForm usuario={usuario} />
      </div>
    </div>
  );
}
