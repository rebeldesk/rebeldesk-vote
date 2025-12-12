/**
 * Componente de listagem de veículos.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  tipo: string;
  vaga_id: string | null;
}

interface VeiculoListProps {
  veiculos: Veiculo[];
  vagaId: string | null;
  unidadeId: string;
  isStaff: boolean;
  onEdit: (veiculoId: string) => void;
}

export function VeiculoList({ veiculos, vagaId, unidadeId, isStaff, onEdit }: VeiculoListProps) {
  const router = useRouter();
  const [veiculoDeletando, setVeiculoDeletando] = useState<string | null>(null);

  const handleDeletar = async (veiculoId: string, placa: string) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo com placa ${placa}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setVeiculoDeletando(veiculoId);
    try {
      const response = await fetch(`/api/unidades/${unidadeId}/veiculos/${veiculoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir veículo');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir veículo');
      setVeiculoDeletando(null);
    }
  };

  if (veiculos.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nenhum veículo cadastrado para esta unidade.</p>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Placa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Marca/Modelo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Vaga
            </th>
            {isStaff && (
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {veiculos.map((veiculo) => (
            <tr key={veiculo.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {veiculo.placa}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {veiculo.marca} {veiculo.modelo}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                  {veiculo.tipo === 'carro' ? 'Carro' : 'Moto'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {veiculo.vaga_id === vagaId ? (
                  <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-medium text-green-800">
                    Na vaga
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              {isStaff && (
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(veiculo.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(veiculo.id, veiculo.placa)}
                      disabled={veiculoDeletando === veiculo.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {veiculoDeletando === veiculo.id ? 'Excluindo...' : 'Excluir'}
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
