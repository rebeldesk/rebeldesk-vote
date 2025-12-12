/**
 * Página para editar usuário existente.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UserForm } from '@/components/admin/UserForm';
import { prisma } from '@/lib/prisma';

async function buscarUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      unidade: {
        select: {
          id: true,
          numero: true,
        },
      },
    },
  });

  if (!usuario) {
    return null;
  }

  // Formata para manter compatibilidade
  const { passwordHash, unidadeId, createdAt, updatedAt, ...rest } = usuario;
  return {
    ...rest,
    unidade_id: unidadeId,
    created_at: createdAt?.toISOString() || new Date().toISOString(),
    updated_at: updatedAt?.toISOString() || new Date().toISOString(),
  };
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

