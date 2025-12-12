/**
 * Componente para exibir opções de votação e permitir votar.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Votacao, OpcaoVotacao } from '@/types';

interface VotingCardProps {
  votacao: Votacao;
  opcoes: OpcaoVotacao[];
}

export function VotingCard({ votacao, opcoes }: VotingCardProps) {
  const router = useRouter();
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleOpcao = (opcaoId: string) => {
    if (votacao.tipo === 'escolha_unica') {
      setSelecionadas([opcaoId]);
    } else {
      // múltipla escolha
      if (selecionadas.includes(opcaoId)) {
        setSelecionadas(selecionadas.filter((id) => id !== opcaoId));
      } else {
        setSelecionadas([...selecionadas, opcaoId]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selecionadas.length === 0) {
      setError('Selecione pelo menos uma opção');
      return;
    }

    if (votacao.tipo === 'escolha_unica' && selecionadas.length !== 1) {
      setError('Selecione exatamente uma opção');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/votacoes/${votacao.id}/votos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opcoes_ids: selecionadas,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registrar voto');
      }

      // Redireciona para a página de participação após votar com sucesso
      // Usa window.location para garantir navegação completa e evitar loops
      window.location.href = '/participar';
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar voto');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {votacao.tipo === 'escolha_unica'
            ? 'Selecione uma opção:'
            : 'Selecione uma ou mais opções:'}
        </h2>
        <div className="mt-4 space-y-3">
          {opcoes.map((opcao) => {
            const isSelected = selecionadas.includes(opcao.id);
            const inputType = votacao.tipo === 'escolha_unica' ? 'radio' : 'checkbox';

            return (
              <label
                key={opcao.id}
                className={`flex cursor-pointer items-start rounded-lg border-2 p-4 transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type={inputType}
                  name={votacao.tipo === 'escolha_unica' ? 'opcao' : 'opcoes'}
                  value={opcao.id}
                  checked={isSelected}
                  onChange={() => toggleOpcao(opcao.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 flex-1 text-gray-900">{opcao.texto}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || selecionadas.length === 0}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registrando voto...' : 'Confirmar Voto'}
        </button>
      </div>
    </form>
  );
}

