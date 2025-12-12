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
      usuarioUnidades: {
        include: {
          unidade: {
            select: {
              id: true,
              numero: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Formata para manter compatibilidade
  return usuarios.map((u) => {
    const { passwordHash, unidadeId, createdAt, updatedAt, usuarioUnidades, ...rest } = u;
    const unidades = usuarioUnidades?.map(uu => ({
      id: uu.unidade.id,
      numero: uu.unidade.numero,
    })) || [];
    
    // Se não tem unidades via relacionamento, usa a unidade antiga (compatibilidade)
    const unidadesFormatadas = unidades.length > 0 
      ? unidades 
      : (u.unidade ? [{ id: u.unidade.id, numero: u.unidade.numero }] : []);
    
    return {
      ...rest,
      unidade_id: unidadeId, // Mantido para compatibilidade
      created_at: createdAt?.toISOString() || new Date().toISOString(),
      updated_at: updatedAt?.toISOString() || new Date().toISOString(),
      unidades: unidadesFormatadas,
    };
  });
}

export default async function UsuariosPage() {
  const session = await auth();

  if (!session || session.user?.perfil !== 'staff') {
    redirect('/dashboard');
  }

  const usuarios = await buscarUsuarios();
  const canDelete = session.user?.perfil === 'staff';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Usuários</h1>
        <Link
          href="/usuarios/novo"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 w-full sm:w-auto text-center"
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

