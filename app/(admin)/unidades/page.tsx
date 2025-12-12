/**
 * Página de listagem de unidades.
 * 
 * Exibe todas as unidades cadastradas com opção para criar novas.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

async function buscarUnidades() {
  const unidades = await prisma.unidade.findMany({
    orderBy: { numero: 'asc' },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return unidades.map((u) => ({
    id: u.id,
    numero: u.numero,
    total_usuarios: u._count.users,
    created_at: u.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: u.updatedAt?.toISOString() || new Date().toISOString(),
  }));
}

export default async function UnidadesPage() {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
    redirect('/dashboard');
  }

  const unidades = await buscarUnidades();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Unidades</h1>
        <Link
          href="/unidades/nova"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova Unidade
        </Link>
      </div>

      <div className="mt-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Número
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Total de Usuários
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Data de Cadastro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {unidades.map((unidade) => (
                <tr key={unidade.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {unidade.numero}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {unidade.total_usuarios}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(unidade.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {unidades.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">Nenhuma unidade cadastrada.</p>
            <Link
              href="/unidades/nova"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Cadastrar Primeira Unidade
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

