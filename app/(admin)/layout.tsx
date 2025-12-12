/**
 * Layout da área administrativa.
 * 
 * Protege rotas administrativas e fornece navegação comum
 * para usuários com perfil staff ou conselho.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const perfil = session.user?.perfil;

  // Apenas staff e conselho têm acesso administrativo
  if (perfil !== 'staff' && perfil !== 'conselho') {
    redirect('/votacoes');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegação */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                  Sistema de Votação
                </Link>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/usuarios"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Usuários
                </Link>
                <Link
                  href="/unidades"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Unidades
                </Link>
                <Link
                  href="/votacoes"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Votações
                </Link>
                {perfil === 'conselho' && (
                  <Link
                    href="/participar"
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    Participar
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {session.user?.name} ({perfil})
              </span>
              <form
                action={async () => {
                  'use server';
                  const { signOut: signOutFn } = await import('@/lib/auth');
                  await signOutFn({ redirectTo: '/login' });
                }}
                className="ml-4"
              >
                <button
                  type="submit"
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

