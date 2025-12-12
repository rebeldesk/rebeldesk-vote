/**
 * Página para votar em uma votação.
 * 
 * Permite que o morador visualize as opções e registre seu voto.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buscarVotacaoCompleta, unidadeJaVotou, buscarVotoUnidade } from '@/lib/db';
import { VotingCard } from '@/components/votante/VotingCard';
import { ResultadoParcial } from '@/components/votante/ResultadoParcial';

export default async function VotarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const votacaoCompleta = await buscarVotacaoCompleta(id);

  if (!votacaoCompleta) {
    redirect('/participar');
  }

  const { votacao, opcoes } = votacaoCompleta;

  // Verifica se pode votar
  const unidadeId = session.user?.unidade_id;
  if (!unidadeId) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Você precisa estar vinculado a uma unidade para votar.
        </p>
      </div>
    );
  }

  const jaVotou = await unidadeJaVotou(votacao.id, unidadeId);
  const votoUnidade = jaVotou ? await buscarVotoUnidade(votacao.id, unidadeId) : null;

  // Determina quais opções foram votadas
  const opcoesVotadas: string[] = [];
  if (votoUnidade) {
    if (votacao.tipo === 'escolha_unica' && votoUnidade.opcao_id) {
      opcoesVotadas.push(votoUnidade.opcao_id);
    } else if (votacao.tipo === 'multipla_escolha' && votoUnidade.opcoes_ids) {
      opcoesVotadas.push(...votoUnidade.opcoes_ids);
    }
  }

  // Se já votou ou votação encerrada, apenas mostra detalhes
  if (jaVotou || votacao.status !== 'aberta') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{votacao.titulo}</h1>
        {votacao.descricao && (
          <p className="mt-2 text-gray-600">{votacao.descricao}</p>
        )}
        <div className="mt-8">
          {jaVotou && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                ✓ Você já votou nesta votação.
              </p>
              {votoUnidade && (
                <p className="mt-2 text-sm text-green-700">
                  Seu voto foi registrado em {new Date(votoUnidade.created_at).toLocaleString('pt-BR')}.
                </p>
              )}
            </div>
          )}
          {votacao.status !== 'aberta' && (
            <div className="mb-4 rounded-md bg-gray-50 p-4">
              <p className="text-sm text-gray-800">
                Esta votação está {votacao.status === 'encerrada' ? 'encerrada' : 'em rascunho'}.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Opções:</h2>
            {opcoes.map((opcao) => {
              const foiVotada = opcoesVotadas.includes(opcao.id);
              return (
                <div
                  key={opcao.id}
                  className={`rounded-md border-2 p-4 ${
                    foiVotada
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={foiVotada ? 'font-medium text-green-900' : 'text-gray-900'}>
                      {opcao.texto}
                    </p>
                    {foiVotada && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        ✓ Sua escolha
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mostra resultados parciais se permitido e votação está aberta */}
          {votacao.mostrar_parcial && votacao.status === 'aberta' && (
            <ResultadoParcial votacaoId={votacao.id} />
          )}
        </div>
      </div>
    );
  }

  // Verifica se está no período
  const agora = new Date();
  const dataInicio = new Date(votacao.data_inicio);
  const dataFim = new Date(votacao.data_fim);

  if (agora < dataInicio || agora > dataFim) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Esta votação ainda não está aberta ou já foi encerrada.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">{votacao.titulo}</h1>
      {votacao.descricao && (
        <p className="mt-2 text-gray-600">{votacao.descricao}</p>
      )}
      <div className="mt-8">
        <VotingCard votacao={votacao} opcoes={opcoes} />
      </div>
      
      {/* Mostra resultados parciais se permitido */}
      {votacao.mostrar_parcial && votacao.status === 'aberta' && (
        <ResultadoParcial votacaoId={votacao.id} />
      )}
    </div>
  );
}

