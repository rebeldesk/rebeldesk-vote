/**
 * Dashboard administrativo.
 * 
 * Página inicial da área administrativa, mostrando resumo
 * de usuários, votações e estatísticas.
 */

import { auth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  // Busca estatísticas
  const [usuariosResult, votacoesResult, unidadesResult] = await Promise.all([
    supabaseServer.from('users').select('id', { count: 'exact', head: true }),
    supabaseServer.from('votacoes').select('id', { count: 'exact', head: true }),
    supabaseServer.from('unidades').select('id', { count: 'exact', head: true }),
  ]);

  const totalUsuarios = usuariosResult.count || 0;
  const totalVotacoes = votacoesResult.count || 0;
  const totalUnidades = unidadesResult.count || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Bem-vindo, {session?.user?.name}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card Usuários */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Usuários
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalUsuarios}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/usuarios"
                className="font-medium text-blue-700 hover:text-blue-900"
              >
                Ver todos
              </Link>
            </div>
          </div>
        </div>

        {/* Card Votações */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Votações
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalVotacoes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                href="/votacoes"
                className="font-medium text-blue-700 hover:text-blue-900"
              >
                Ver todas
              </Link>
            </div>
          </div>
        </div>

        {/* Card Unidades */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-500 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Unidades
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalUnidades}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Ações Rápidas</h2>
        <div className="mt-4 flex space-x-4">
          <Link
            href="/usuarios/novo"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Novo Usuário
          </Link>
          <Link
            href="/votacoes/nova"
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Nova Votação
          </Link>
        </div>
      </div>
    </div>
  );
}

