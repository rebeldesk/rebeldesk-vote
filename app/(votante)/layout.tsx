/**
 * Layout da área do votante.
 * 
 * Protege rotas de votante e fornece navegação comum.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function VotanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegação */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/participar" className="text-xl font-bold text-gray-900">
                  Sistema de Votação
                </Link>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link
                  href="/participar"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Votações
                </Link>
                {(session.user?.perfil === 'staff' || session.user?.perfil === 'conselho') && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    Administração
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                {session.user?.name} ({session.user?.perfil})
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

