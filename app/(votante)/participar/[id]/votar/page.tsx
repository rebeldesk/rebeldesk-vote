/**
 * Página para votar em uma votação.
 * 
 * Permite que o morador visualize as opções e registre seu voto.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buscarVotacaoCompleta, unidadeJaVotou } from '@/lib/db';
import { VotingCard } from '@/components/votante/VotingCard';

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
              <p className="text-sm text-green-800">
                ✓ Você já votou nesta votação.
              </p>
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
            {opcoes.map((opcao) => (
              <div
                key={opcao.id}
                className="rounded-md border border-gray-200 bg-white p-4"
              >
                <p>{opcao.texto}</p>
              </div>
            ))}
          </div>
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
    </div>
  );
}

