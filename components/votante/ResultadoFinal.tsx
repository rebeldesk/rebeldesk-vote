/**
 * Componente para exibir resultados finais de uma votação encerrada.
 * 
 * Este componente é exibido quando a votação está encerrada
 * e mostra os resultados completos da votação.
 */

'use client';

import { useEffect, useState } from 'react';
import type { ResultadoVotacao } from '@/types';

interface ResultadoFinalProps {
  votacaoId: string;
}

export function ResultadoFinal({ votacaoId }: ResultadoFinalProps) {
  const [resultado, setResultado] = useState<ResultadoVotacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const buscarResultado = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(`/api/votacoes/${votacaoId}/resultado`);
        
        if (!response.ok) {
          let errorMessage = 'Erro ao buscar resultados';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setResultado(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar resultados';
        setError(errorMessage);
        console.error('Erro ao buscar resultados finais:', err);
      } finally {
        setLoading(false);
      }
    };

    buscarResultado();
  }, [votacaoId]);

  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Carregando resultados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!resultado || resultado.total_votos === 0) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Resultados Finais</h3>
        <p className="mt-1 text-sm text-gray-700">
          Nenhum voto foi registrado nesta votação.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Resultados Finais</h3>
        <p className="mt-2 text-sm text-gray-600">
          Total de votos: <span className="font-medium text-gray-900">{resultado.total_votos}</span>
        </p>
      </div>

      <div className="space-y-4">
        {resultado.opcoes.map((item) => (
          <div key={item.opcao.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900">
                  {item.opcao.texto}
                </h4>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {item.votos} voto{item.votos !== 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {item.percentual}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${item.percentual}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
