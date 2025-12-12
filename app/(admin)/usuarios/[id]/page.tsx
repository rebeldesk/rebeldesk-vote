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
  });

  if (!usuario) {
    return null;
  }

  // Formata para manter compatibilidade
  const { passwordHash, unidadeId, createdAt, updatedAt, usuarioUnidades, ...rest } = usuario;
  const unidades = usuarioUnidades?.map(uu => ({
    id: uu.unidade.id,
    numero: uu.unidade.numero,
  })) || [];
  
  // Se não tem unidades via relacionamento, usa a unidade antiga (compatibilidade)
  const unidadesFormatadas = unidades.length > 0 
    ? unidades 
    : (usuario.unidade ? [{ id: usuario.unidade.id, numero: usuario.unidade.numero }] : []);
  
  return {
    ...rest,
    unidade_id: unidadeId || null, // Mantido para compatibilidade
    unidades: unidadesFormatadas,
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
            unidades: usuario.unidades,
          } as any}
        />
      </div>
    </div>
  );
}

