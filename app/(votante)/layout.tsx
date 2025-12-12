/**
 * Layout da área do votante.
 * 
 * Protege rotas de votante e fornece navegação comum.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { MobileMenu } from '@/components/admin/MobileMenu';
import { ChangePasswordButton } from '@/components/auth/ChangePasswordButton';
import { NavLink } from '@/components/admin/NavLink';

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
          <div className="relative flex h-16 justify-between">
            <div className="flex flex-1 items-center">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/participar" className="text-lg sm:text-xl font-bold text-gray-900">
                  Sistema de Votação
                </Link>
              </div>
              {/* Menu desktop - oculto em mobile */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <NavLink href="/participar">Votações</NavLink>
                {(session.user?.perfil === 'staff' || session.user?.perfil === 'conselho') && (
                  <NavLink href="/dashboard">Administração</NavLink>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline-block text-sm text-gray-700">
                {session.user?.name} ({session.user?.perfil})
              </span>
              <ChangePasswordButton className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900" />
              {/* Menu hambúrguer mobile */}
              <MobileMenu
                links={[
                  { href: '/participar', label: 'Votações' },
                  ...(session.user?.perfil === 'staff' || session.user?.perfil === 'conselho'
                    ? [{ href: '/dashboard', label: 'Administração' }]
                    : []),
                ]}
                userName={session.user?.name || ''}
                userProfile={session.user?.perfil || ''}
              />
              <form
                action={async () => {
                  'use server';
                  const { signOut: signOutFn } = await import('@/lib/auth');
                  await signOutFn({ redirectTo: '/login' });
                }}
                className="ml-2 sm:ml-4"
              >
                <button
                  type="submit"
                  className="rounded-md bg-gray-100 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200"
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

