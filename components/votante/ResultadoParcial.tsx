/**
 * Componente para exibir resultados parciais de uma votação.
 * 
 * Este componente é exibido quando a votação está aberta e
 * a opção mostrar_parcial está habilitada.
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
    const buscarParcial = async () => {
      try {
        setLoading(true);
        setError(''); // Limpa erro anterior
        
        const response = await fetch(`/api/votacoes/${votacaoId}/resultado`);
        
        if (!response.ok) {
          // Se for erro 403, significa que a parcial não está disponível (não é um erro real)
          if (response.status === 403) {
            setError('');
            setResultado(null);
            setLoading(false);
            return;
          }
          
          // Se for erro 404, votação não encontrada
          if (response.status === 404) {
            setError('');
            setResultado(null);
            setLoading(false);
            return;
          }
          
          let errorMessage = 'Erro ao buscar resultados';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // Ignora erro ao parsear JSON
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setResultado(data);
        setError('');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar resultados parciais';
        setError(errorMessage);
        console.error('Erro ao buscar resultados parciais:', err);
      } finally {
        setLoading(false);
      }
    };

    buscarParcial();

    // Atualiza a cada 30 segundos
    const interval = setInterval(buscarParcial, 30000);

    return () => clearInterval(interval);
  }, [votacaoId]);

  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Carregando resultados parciais...</p>
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
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-blue-900">Resultados Parciais</h3>
        <p className="mt-1 text-sm text-blue-700">
          Ainda não há votos registrados nesta votação.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blue-900">Resultados Parciais</h3>
        <p className="mt-1 text-sm text-blue-700">
          Total de votos: <span className="font-medium">{resultado.total_votos}</span>
        </p>
        <p className="mt-1 text-xs text-blue-600">
          Os resultados são atualizados automaticamente a cada 30 segundos
        </p>
      </div>

      <div className="space-y-3">
        {resultado.opcoes.map((item) => (
          <div key={item.opcao.id} className="rounded-md bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {item.opcao.texto}
                </h4>
                <div className="mt-1 flex items-center space-x-3">
                  <span className="text-xs text-gray-600">
                    {item.votos} voto{item.votos !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs font-medium text-blue-600">
                    {item.percentual}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
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
