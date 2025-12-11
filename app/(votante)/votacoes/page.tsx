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
import { supabaseServer } from '@/lib/supabase/server';
import { unidadeJaVotou } from '@/lib/db';

async function buscarVotacoesDisponiveis() {
  const { data, error } = await supabaseServer
    .from('votacoes')
    .select('*')
    .in('status', ['aberta', 'encerrada'])
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data || [];
}

export default async function VotacoesDisponiveisPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const votacoes = await buscarVotacoesDisponiveis();
  const unidadeId = session.user?.unidade_id;

  // Para cada votação, verifica se a unidade já votou
  const votacoesComStatus = await Promise.all(
    votacoes.map(async (votacao) => {
      let jaVotou = false;
      if (unidadeId && votacao.status === 'aberta') {
        jaVotou = await unidadeJaVotou(votacao.id, unidadeId);
      }

      return {
        ...votacao,
        jaVotou,
      };
    })
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Votações Disponíveis</h1>
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
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {votacao.descricao}
                </p>
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
                {votacao.status === 'aberta' && unidadeId && (
                  <div className="flex items-center">
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">
                      {votacao.jaVotou ? (
                        <span className="text-green-600">✓ Você já votou</span>
                      ) : (
                        <span className="text-blue-600">Pendente</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3">
              {votacao.status === 'aberta' && unidadeId && !votacao.jaVotou ? (
                <Link
                  href={`/votacoes/${votacao.id}/votar`}
                  className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                >
                  Votar Agora
                </Link>
              ) : votacao.status === 'aberta' && !unidadeId ? (
                <p className="text-center text-sm text-gray-500">
                  Você precisa estar vinculado a uma unidade para votar
                </p>
              ) : (
                <Link
                  href={`/votacoes/${votacao.id}/votar`}
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

