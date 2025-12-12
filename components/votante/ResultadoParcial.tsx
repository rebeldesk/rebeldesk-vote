/**
 * Componente para exibir resultados parciais de uma votação.
 * 
 * Usado quando mostrar_parcial = true e a votação está aberta.
 */

'use client';

import { useEffect, useState } from 'react';
import type { ResultadoVotacao } from '@/types';

interface ResultadoParcialProps {
  votacaoId: string;
}

export function ResultadoParcial({ votacaoId }: ResultadoParcialProps) {
  const [resultado, setResultado] = useState<ResultadoVotacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function buscarResultado() {
      try {
        setLoading(true);
        const response = await fetch(`/api/votacoes/${votacaoId}/parcial`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao buscar resultados');
        }

        const data = await response.json();
        setResultado(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar resultados parciais');
      } finally {
        setLoading(false);
      }
    }

    buscarResultado();
  }, [votacaoId]);

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-gray-600">Carregando resultados parciais...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">{error}</p>
      </div>
    );
  }

  if (!resultado) {
    return null;
  }

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Resultados Parciais</h2>
        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
          Parcial
        </span>
      </div>
      
      <p className="mb-4 text-sm text-gray-600">
        Total de votos até o momento: <strong>{resultado.total_votos}</strong>
      </p>

      <div className="space-y-4">
        {resultado.opcoes.map((item) => (
          <div key={item.opcao.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
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
            <div className="mt-3">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${item.percentual}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        * Estes são resultados parciais. Os resultados finais serão divulgados após o encerramento da votação.
      </p>
    </div>
  );
}
