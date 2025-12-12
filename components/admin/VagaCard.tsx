/**
 * Componente para exibir e gerenciar a vaga da unidade.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VagaForm } from './VagaForm';

interface Vaga {
  id: string;
  esta_alugada: boolean;
  unidade_alugada: {
    id: string;
    numero: string;
  } | null;
  veiculos: Array<{
    id: string;
    placa: string;
    modelo: string;
    marca: string;
    tipo: string;
  }>;
}

interface VagaCardProps {
  unidadeId: string;
  vaga: Vaga | null;
  todasUnidades: Array<{ id: string; numero: string }>;
  isStaff: boolean;
}

export function VagaCard({ unidadeId, vaga, todasUnidades, isStaff }: VagaCardProps) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [deletando, setDeletando] = useState(false);

  const handleSalvar = () => {
    setEditando(false);
    router.refresh();
  };

  const handleDeletar = async () => {
    if (!confirm('Tem certeza que deseja deletar esta vaga? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletando(true);
    try {
      const response = await fetch(`/api/unidades/${unidadeId}/vaga`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar vaga');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao deletar vaga');
      setDeletando(false);
    }
  };

  if (!vaga) {
    if (!isStaff) {
      return null;
    }

    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Vaga de Estacionamento</h3>
          <p className="mt-2 text-sm text-gray-500">Esta unidade ainda não possui uma vaga cadastrada.</p>
          <div className="mt-5">
            <VagaForm
              unidadeId={unidadeId}
              todasUnidades={todasUnidades}
              onSuccess={handleSalvar}
            />
          </div>
        </div>
      </div>
    );
  }

  if (editando) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-5">
            Editar Vaga de Estacionamento
          </h3>
          <VagaForm
            unidadeId={unidadeId}
            vaga={vaga}
            todasUnidades={todasUnidades}
            onSuccess={handleSalvar}
            onCancel={() => setEditando(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Vaga de Estacionamento</h3>
          {isStaff && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditando(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Editar
              </button>
              <button
                onClick={handleDeletar}
                disabled={deletando}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletando ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {vaga.esta_alugada ? (
                <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                  Alugada
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  Livre
                </span>
              )}
            </dd>
          </div>
          {vaga.esta_alugada && vaga.unidade_alugada && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Unidade que está usando</dt>
              <dd className="mt-1 text-sm text-gray-900">{vaga.unidade_alugada.numero}</dd>
            </div>
          )}
        </dl>

        {vaga.veiculos.length > 0 && (
          <div className="mt-5">
            <dt className="text-sm font-medium text-gray-500 mb-2">Veículos na vaga</dt>
            <ul className="divide-y divide-gray-200">
              {vaga.veiculos.map((veiculo) => (
                <li key={veiculo.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {veiculo.marca} {veiculo.modelo}
                      </p>
                      <p className="text-sm text-gray-500">Placa: {veiculo.placa}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                      {veiculo.tipo === 'carro' ? 'Carro' : 'Moto'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
