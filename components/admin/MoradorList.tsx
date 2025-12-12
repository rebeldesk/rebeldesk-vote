/**
 * Componente de listagem de moradores.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Morador {
  id: string;
  nome: string;
  documento: string;
  grau_parentesco: string;
}

interface MoradorListProps {
  moradores: Morador[];
  unidadeId: string;
  isStaff: boolean;
  onEdit: (moradorId: string) => void;
}

export function MoradorList({ moradores, unidadeId, isStaff, onEdit }: MoradorListProps) {
  const router = useRouter();
  const [moradorDeletando, setMoradorDeletando] = useState<string | null>(null);

  const handleDeletar = async (moradorId: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o morador ${nome}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setMoradorDeletando(moradorId);
    try {
      const response = await fetch(`/api/unidades/${unidadeId}/moradores/${moradorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir morador');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir morador');
      setMoradorDeletando(null);
    }
  };

  const getGrauParentescoLabel = (grau: string) => {
    const labels: Record<string, string> = {
      Proprietario: 'Proprietário',
      Conjuge: 'Cônjuge',
      Filho: 'Filho',
      Pai: 'Pai',
      Mae: 'Mãe',
      Outro: 'Outro',
    };
    return labels[grau] || grau;
  };

  if (moradores.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nenhum morador cadastrado para esta unidade.</p>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Nome
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Documento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Grau de Parentesco
            </th>
            {isStaff && (
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {moradores.map((morador) => (
            <tr key={morador.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {morador.nome}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {morador.documento}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span className="inline-flex rounded-full bg-purple-100 px-2 text-xs font-semibold leading-5 text-purple-800">
                  {getGrauParentescoLabel(morador.grau_parentesco)}
                </span>
              </td>
              {isStaff && (
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(morador.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(morador.id, morador.nome)}
                      disabled={moradorDeletando === morador.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {moradorDeletando === morador.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
