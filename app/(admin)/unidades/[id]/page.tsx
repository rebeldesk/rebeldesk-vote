/**
 * Página de detalhes da unidade.
 * 
 * Exibe informações da unidade, vaga e veículos.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { UnidadeDetalhes } from '@/components/admin/UnidadeDetalhes';

async function buscarUnidade(id: string) {
  const unidade = await prisma.unidade.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          usuarioUnidades: true,
          votos: true,
        },
      },
      usuarioUnidades: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              perfil: true,
            },
          },
        },
      },
      vaga: {
        include: {
          unidadeAlugada: {
            select: {
              id: true,
              numero: true,
            },
          },
          veiculos: {
            select: {
              id: true,
              placa: true,
              modelo: true,
              marca: true,
              tipo: true,
            },
          },
        },
      },
      veiculos: {
        include: {
          vaga: {
            select: {
              id: true,
              unidadeId: true,
            },
          },
        },
      },
    },
  });

  if (!unidade) {
    return null;
  }

  return {
    id: unidade.id,
    numero: unidade.numero,
    created_at: unidade.createdAt?.toISOString(),
    updated_at: unidade.updatedAt?.toISOString(),
    total_usuarios: unidade._count.usuarioUnidades,
    usuarios: unidade.usuarioUnidades.map((uu) => ({
      id: uu.usuario.id,
      nome: uu.usuario.nome,
      email: uu.usuario.email,
      perfil: uu.usuario.perfil,
    })),
    vaga: unidade.vaga
      ? {
          id: unidade.vaga.id,
          esta_alugada: unidade.vaga.estaAlugada,
          unidade_alugada: unidade.vaga.unidadeAlugada
            ? {
                id: unidade.vaga.unidadeAlugada.id,
                numero: unidade.vaga.unidadeAlugada.numero,
              }
            : null,
          veiculos: unidade.vaga.veiculos,
        }
      : null,
    veiculos: unidade.veiculos.map((v) => ({
      id: v.id,
      placa: v.placa,
      modelo: v.modelo,
      marca: v.marca,
      tipo: v.tipo,
      vaga_id: v.vagaId,
    })),
  };
}

async function buscarTodasUnidades() {
  const unidades = await prisma.unidade.findMany({
    orderBy: { numero: 'asc' },
    select: {
      id: true,
      numero: true,
    },
  });

  return unidades;
}

export default async function UnidadeDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const unidade = await buscarUnidade(id);
  const todasUnidades = await buscarTodasUnidades();

  if (!unidade) {
    redirect('/unidades');
  }

  const isStaff = session.user?.perfil === 'staff';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/unidades"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Voltar para Unidades
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Unidade {unidade.numero}</h1>
        </div>
      </div>

      <UnidadeDetalhes
        unidade={unidade}
        todasUnidades={todasUnidades}
        isStaff={isStaff}
      />
    </div>
  );
}
