/**
 * Layout da área administrativa.
 * 
 * Protege rotas administrativas e fornece navegação comum
 * para usuários com perfil staff ou conselho.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { MobileMenu } from '@/components/admin/MobileMenu';
import { ChangePasswordButton } from '@/components/auth/ChangePasswordButton';
import { NavLink } from '@/components/admin/NavLink';

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
          <div className="relative flex h-16 justify-between">
            <div className="flex flex-1 items-center">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/dashboard" className="text-lg sm:text-xl font-bold text-gray-900">
                  Sistema de Votação
                </Link>
              </div>
              {/* Menu desktop - oculto em mobile */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <NavLink href="/dashboard">Dashboard</NavLink>
                {perfil === 'staff' && (
                  <NavLink href="/usuarios">Usuários</NavLink>
                )}
                <NavLink href="/unidades">Unidades</NavLink>
                <NavLink href="/votacoes">Votações</NavLink>
                {perfil === 'conselho' && (
                  <NavLink href="/participar">Participar</NavLink>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/perfil"
                className="hidden sm:inline-block text-sm text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                title="Ver meu perfil"
              >
                {session.user?.name} ({perfil})
              </Link>
              <ChangePasswordButton className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900" />
              {/* Menu hambúrguer mobile */}
              <MobileMenu
                links={[
                  { href: '/dashboard', label: 'Dashboard' },
                  ...(perfil === 'staff'
                    ? [{ href: '/usuarios', label: 'Usuários' }]
                    : []),
                  { href: '/unidades', label: 'Unidades' },
                  { href: '/votacoes', label: 'Votações' },
                  ...(perfil === 'conselho'
                    ? [{ href: '/participar', label: 'Participar' }]
                    : []),
                ]}
                userName={session.user?.name || ''}
                userProfile={perfil}
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

