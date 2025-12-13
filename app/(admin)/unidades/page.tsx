/**
 * Página de listagem de unidades.
 * 
 * Exibe todas as unidades cadastradas com opção para criar novas.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { UnidadeList } from '@/components/admin/UnidadeList';

async function buscarUnidades() {
  const unidades = await prisma.unidade.findMany({
    orderBy: { numero: 'asc' },
    include: {
      _count: {
        select: {
          usuarioUnidades: true, // Relacionamento N:N (correto)
        },
      },
    },
  });

  return unidades.map((u) => ({
    id: u.id,
    numero: u.numero,
    total_usuarios: u._count.usuarioUnidades || 0,
    created_at: u.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: u.updatedAt?.toISOString() || new Date().toISOString(),
  }));
}

export default async function UnidadesPage() {
  const session = await auth();

  const perfil = session.user?.perfil;
  const conselheiro = session.user?.conselheiro || false;
  if (!session || (perfil !== 'staff' && !(perfil === 'morador' && conselheiro))) {
    redirect('/dashboard');
  }

  const unidades = await buscarUnidades();
  const isStaff = session.user?.perfil === 'staff';

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
        <UnidadeList unidades={unidades} canDelete={isStaff} />
        
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

