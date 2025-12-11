/**
 * Página para editar usuário existente.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UserForm } from '@/components/admin/UserForm';

async function buscarUsuario(id: string) {
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/usuarios/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const usuario = await buscarUsuario(id);

  if (!usuario) {
    redirect('/usuarios');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Editar Usuário</h1>
      <div className="mt-8">
        <UserForm
          usuarioId={id}
          initialData={{
            email: usuario.email,
            nome: usuario.nome,
            telefone: usuario.telefone || '',
            perfil: usuario.perfil,
            unidade_id: usuario.unidade_id || null,
          }}
        />
      </div>
    </div>
  );
}

