/**
 * Página de listagem de votações.
 * 
 * Exibe todas as votações com opções para criar, editar e ver resultados.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { MarkdownContent } from '@/components/ui/MarkdownContent';

async function buscarVotacoes() {
  const votacoes = await prisma.votacao.findMany({
    include: {
      criadoPorUser: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Formata para manter compatibilidade
  return votacoes.map((v) => ({
    ...v,
    criado_por: v.criadoPor,
    data_inicio: v.dataInicio.toISOString(),
    data_fim: v.dataFim.toISOString(),
    modo_auditoria: v.modoAuditoria,
    created_at: v.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: v.updatedAt?.toISOString() || new Date().toISOString(),
    criado_por_user: v.criadoPorUser,
  }));
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'aberta':
      return 'bg-green-100 text-green-800';
    case 'encerrada':
      return 'bg-gray-100 text-gray-800';
    case 'rascunho':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default async function VotacoesPage() {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
    redirect('/dashboard');
  }

  const votacoes = await buscarVotacoes();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Votações</h1>
        <Link
          href="/votacoes/nova"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova Votação
        </Link>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {votacoes.map((votacao: any) => (
          <div
            key={votacao.id}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {votacao.titulo}
                </h3>
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(votacao.status)}`}
                >
                  {votacao.status}
                </span>
              </div>

              {votacao.descricao && (
                <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                  <MarkdownContent content={votacao.descricao} />
                </div>
              )}

              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="font-medium">Tipo:</span>
                  <span className="ml-2">
                    {votacao.tipo === 'escolha_unica' ? 'Escolha Única' : 'Múltipla Escolha'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Auditoria:</span>
                  <span className="ml-2">
                    {votacao.modo_auditoria === 'anonimo' ? 'Anônimo' : 'Rastreado'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Período:</span>
                  <span className="ml-2">
                    {new Date(votacao.data_inicio).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(votacao.data_fim).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3">
              <div className="flex space-x-2">
                <Link
                  href={`/votacoes/${votacao.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-900"
                >
                  Ver detalhes
                </Link>
                {votacao.status !== 'rascunho' && (
                  <Link
                    href={`/votacoes/${votacao.id}/resultado`}
                    className="text-sm font-medium text-green-600 hover:text-green-900"
                  >
                    Resultados
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

