/**
 * Página para votar em uma votação.
 * 
 * Permite que o morador visualize as opções e registre seu voto.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buscarVotacaoCompleta, unidadeJaVotou, buscarVotoUnidade, buscarUnidadesUsuario } from '@/lib/db';
import { VotingCard } from '@/components/votante/VotingCard';
import { ResultadoParcial } from '@/components/votante/ResultadoParcial';
import { ResultadoFinal } from '@/components/votante/ResultadoFinal';
import { UnidadeSelectorWrapper } from '@/components/votante/UnidadeSelectorWrapper';
import { MarkdownContent } from '@/components/ui/MarkdownContent';

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

  // Busca todas as unidades do usuário
  const userId = session.user?.id;
  if (!userId) {
    redirect('/login');
  }

  const unidadesUsuario = await buscarUnidadesUsuario(userId);
  
  if (unidadesUsuario.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Você precisa estar vinculado a uma unidade para votar.
        </p>
      </div>
    );
  }

  // Verifica quais unidades já votaram
  const unidadesJaVotaram: string[] = [];
  const votosPorUnidade: Record<string, any> = {};
  
  for (const unidade of unidadesUsuario) {
    const jaVotou = await unidadeJaVotou(votacao.id, unidade.id);
    if (jaVotou) {
      unidadesJaVotaram.push(unidade.id);
      votosPorUnidade[unidade.id] = await buscarVotoUnidade(votacao.id, unidade.id);
    }
  }

  // Se tem apenas uma unidade, usa ela automaticamente
  const unidadeIdUnica = unidadesUsuario.length === 1 ? unidadesUsuario[0].id : null;
  const unidadeId = unidadeIdUnica;
  const jaVotou = unidadeId ? unidadesJaVotaram.includes(unidadeId) : false;
  const votoUnidade = unidadeId && jaVotou ? votosPorUnidade[unidadeId] : null;

  // Determina quais opções foram votadas
  const opcoesVotadas: string[] = [];
  if (votoUnidade) {
    if (votacao.tipo === 'escolha_unica' && votoUnidade.opcao_id) {
      opcoesVotadas.push(votoUnidade.opcao_id);
    } else if (votacao.tipo === 'multipla_escolha' && votoUnidade.opcoes_ids) {
      opcoesVotadas.push(...votoUnidade.opcoes_ids);
    }
  }

  // Se votação encerrada, mostra resultados finais
  if (votacao.status === 'encerrada') {
    const unidadesQueVotaram = unidadesUsuario.filter(u => unidadesJaVotaram.includes(u.id));
    
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{votacao.titulo}</h1>
        {votacao.descricao && (
          <div className="mt-2">
            <MarkdownContent content={votacao.descricao} className="text-gray-600" />
          </div>
        )}
        <div className="mt-8">
          {unidadesQueVotaram.length > 0 && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                ✓ Você votou nesta votação com {unidadesQueVotaram.length} unidade{unidadesQueVotaram.length !== 1 ? 's' : ''}:
              </p>
              <ul className="mt-2 space-y-1">
                {unidadesQueVotaram.map((unidade) => {
                  const voto = votosPorUnidade[unidade.id];
                  return (
                    <li key={unidade.id} className="text-sm text-green-700">
                      • Unidade {unidade.numero} - Voto registrado em {voto ? new Date(voto.created_at).toLocaleString('pt-BR') : 'N/A'}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="mb-4 rounded-md bg-gray-50 p-4">
            <p className="text-sm text-gray-800">
              Esta votação está encerrada. Os resultados finais estão disponíveis abaixo.
            </p>
          </div>
          <div className="space-y-2 mb-6">
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
          <ResultadoFinal votacaoId={votacao.id} />
        </div>
      </div>
    );
  }

  // Se votação em rascunho
  if (votacao.status === 'rascunho') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{votacao.titulo}</h1>
        {votacao.descricao && (
          <div className="mt-2">
            <MarkdownContent content={votacao.descricao} className="text-gray-600" />
          </div>
        )}
        <div className="mt-8">
          <div className="mb-4 rounded-md bg-gray-50 p-4">
            <p className="text-sm text-gray-800">
              Esta votação está em rascunho e ainda não está disponível para votação.
            </p>
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
        <div className="mt-2">
          <MarkdownContent content={votacao.descricao} className="text-gray-600" />
        </div>
      )}
      <div className="mt-8">
        {jaVotou && (
          <div className={`mb-4 rounded-md p-4 ${
            votacao.permitir_alterar_voto 
              ? 'bg-blue-50' 
              : 'bg-green-50'
          }`}>
            <p className={`text-sm font-medium ${
              votacao.permitir_alterar_voto 
                ? 'text-blue-800' 
                : 'text-green-800'
            }`}>
              {votacao.permitir_alterar_voto 
                ? 'ℹ️ Você já votou nesta votação. Você pode alterar seu voto até o fim do período.'
                : '✓ Você já votou nesta votação. A alteração de voto não é permitida nesta votação.'
              }
            </p>
            {votoUnidade && (
              <p className={`mt-1 text-xs ${
                votacao.permitir_alterar_voto 
                  ? 'text-blue-700' 
                  : 'text-green-700'
              }`}>
                Voto registrado em {new Date(votoUnidade.created_at).toLocaleString('pt-BR')}.
              </p>
            )}
          </div>
        )}
        {jaVotou && !votacao.permitir_alterar_voto ? (
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
        ) : (
          <>
            {unidadesUsuario.length > 1 ? (
              <UnidadeSelectorWrapper
                unidades={unidadesUsuario}
                unidadesJaVotaram={unidadesJaVotaram}
                votacao={votacao}
                opcoes={opcoes}
                votosPorUnidade={votosPorUnidade}
              />
            ) : (
              <VotingCard 
                votacao={votacao} 
                opcoes={opcoes} 
                opcoesVotadas={opcoesVotadas}
                jaVotou={jaVotou && votacao.permitir_alterar_voto}
                unidadeId={unidadeId || undefined}
              />
            )}
          </>
        )}
        {votacao.mostrar_parcial && votacao.status === 'aberta' && (
          <ResultadoParcial votacaoId={votacao.id} />
        )}
      </div>
    </div>
  );
}

