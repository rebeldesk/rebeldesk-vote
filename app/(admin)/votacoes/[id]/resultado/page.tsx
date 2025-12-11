/**
 * Página de resultados de uma votação.
 * 
 * Exibe os resultados da votação com contagem de votos
 * e detalhes (se modo_auditoria = 'rastreado').
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { calcularResultado } from '@/lib/db';
import Link from 'next/link';

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho' && session.user?.perfil !== 'auditor')) {
    redirect('/votacoes');
  }

  const { id } = await params;
  const resultado = await calcularResultado(
    id,
    session.user?.perfil === 'staff' || session.user?.perfil === 'conselho' || session.user?.perfil === 'auditor'
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Resultados: {resultado.votacao.titulo}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Total de votos: {resultado.total_votos}
          </p>
        </div>
        <Link
          href={`/votacoes/${id}`}
          className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Voltar
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {resultado.opcoes.map((item) => (
          <div key={item.opcao.id} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.opcao.texto}
                </h3>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {item.votos} voto{item.votos !== 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {item.percentual}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${item.percentual}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {resultado.votacao.modo_auditoria === 'rastreado' && resultado.votos_detalhados && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">Detalhes dos Votos</h2>
          <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Unidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Opção(ões)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Data/Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {resultado.votos_detalhados.map((voto: any) => (
                  <tr key={voto.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {voto.unidade_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {voto.opcao_id
                        ? resultado.opcoes.find((o) => o.opcao.id === voto.opcao_id)?.opcao.texto
                        : voto.opcoes_ids
                        ? voto.opcoes_ids
                            .map((id: string) =>
                              resultado.opcoes.find((o) => o.opcao.id === id)?.opcao.texto
                            )
                            .join(', ')
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(voto.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

