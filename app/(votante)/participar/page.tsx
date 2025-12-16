/**
 * Página de listagem de votações para votantes.
 * 
 * Exibe todas as votações disponíveis (abertas e encerradas)
 * para que os moradores possam visualizar e votar.
 * 
 * Esta página está em um route group diferente para evitar conflito
 * com a página administrativa. A rota real é /participar.
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { unidadeJaVotou, buscarUnidadesUsuario } from '@/lib/db';
import { MarkdownContent } from '@/components/ui/MarkdownContent';

async function buscarVotacoesDisponiveis() {
  const votacoes = await prisma.votacao.findMany({
    where: {
      status: {
        in: ['aberta', 'encerrada'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Formata para manter compatibilidade
  return votacoes.map((v) => ({
    ...v,
    data_inicio: v.dataInicio,
    data_fim: v.dataFim,
    modo_auditoria: v.modoAuditoria,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  }));
}

export default async function VotacoesDisponiveisPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const votacoes = await buscarVotacoesDisponiveis();
  
  // Busca todas as unidades do usuário
  const userId = session.user?.id;
  if (!userId) {
    redirect('/login');
  }

  const unidadesUsuario = await buscarUnidadesUsuario(userId);
  const temUnidades = unidadesUsuario.length > 0;

  // Para cada votação, verifica se alguma unidade do usuário já votou
  const votacoesComStatus = await Promise.all(
    votacoes.map(async (votacao) => {
      let jaVotou = false;
      let unidadesQueVotaram: string[] = [];
      
      if (temUnidades && votacao.status === 'aberta') {
        // Verifica se alguma unidade do usuário já votou
        for (const unidade of unidadesUsuario) {
          const unidadeVotou = await unidadeJaVotou(votacao.id, unidade.id);
          if (unidadeVotou) {
            jaVotou = true;
            unidadesQueVotaram.push(unidade.id);
          }
        }
      }

      return {
        ...votacao,
        jaVotou,
        unidadesQueVotaram,
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Votações Disponíveis</h1>
      <p className="mt-2 text-sm text-gray-600">
        Visualize e participe das votações do condomínio
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {votacoesComStatus.map((votacao: any) => (
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
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    votacao.status === 'aberta'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {votacao.status === 'aberta' ? 'Aberta' : 'Encerrada'}
                </span>
              </div>

              {votacao.descricao && (
                <div className="mt-2 text-sm text-gray-600 line-clamp-3">
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
                  <span className="font-medium">Período:</span>
                  <span className="ml-2">
                    {new Date(votacao.data_inicio).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(votacao.data_fim).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {votacao.status === 'aberta' && temUnidades && (
                  <div className="flex items-center">
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">
                      {votacao.jaVotou ? (
                        <span className="text-green-600">
                          ✓ Você já votou {votacao.unidadesQueVotaram?.length > 1 ? `com ${votacao.unidadesQueVotaram.length} unidades` : ''}
                        </span>
                      ) : (
                        <span className="text-blue-600">Pendente</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3">
              {votacao.status === 'aberta' && temUnidades && !votacao.jaVotou ? (
                <Link
                  href={`/participar/${votacao.id}/votar`}
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                >
                  Votar Agora
                </Link>
              ) : votacao.status === 'aberta' && temUnidades && votacao.jaVotou ? (
                <Link
                  href={`/participar/${votacao.id}/votar`}
                  className="block w-full rounded-md bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
                >
                  Ver/Alterar Voto
                </Link>
              ) : votacao.status === 'aberta' && !temUnidades ? (
                <p className="text-center text-sm text-gray-500">
                  Você precisa estar vinculado a uma unidade para votar
                </p>
              ) : (
                <Link
                  href={`/participar/${votacao.id}/votar`}
                  className="block w-full rounded-md bg-gray-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-700"
                >
                  Ver Detalhes
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {votacoes.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">Nenhuma votação disponível no momento.</p>
        </div>
      )}
    </div>
  );
}

