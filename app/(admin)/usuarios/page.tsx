/**
 * Página de listagem de usuários.
 * 
 * Exibe todos os usuários cadastrados no sistema
 * com opções para criar, editar e excluir.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { UserList } from '@/components/admin/UserList';

async function buscarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    include: {
      unidade: {
        select: {
          id: true,
          numero: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Formata para manter compatibilidade
  return usuarios.map((u) => {
    const { passwordHash, unidadeId, createdAt, updatedAt, ...rest } = u;
    return {
      ...rest,
      unidade_id: unidadeId,
      created_at: createdAt?.toISOString() || new Date().toISOString(),
      updated_at: updatedAt?.toISOString() || new Date().toISOString(),
      unidades: u.unidade ? {
        id: u.unidade.id,
        numero: u.unidade.numero,
      } : null,
    };
  });
}

export default async function UsuariosPage() {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
    redirect('/dashboard');
  }

  const usuarios = await buscarUsuarios();
  const canDelete = session.user?.perfil === 'staff';

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
        <Link
          href="/usuarios/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo Usuário
        </Link>
      </div>

      <div className="mt-8">
        <UserList
          usuarios={usuarios}
          currentUserId={session.user?.id}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}

