/**
 * Componente de detalhes da unidade.
 * 
 * Exibe informações da unidade, vaga e veículos com opções de edição.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VagaCard } from './VagaCard';
import { VeiculoList } from './VeiculoList';
import { VeiculoForm } from './VeiculoForm';

interface Unidade {
  id: string;
  numero: string;
  created_at: string;
  updated_at: string;
  total_usuarios: number;
  usuarios: Array<{
    id: string;
    nome: string;
    email: string;
    perfil: string;
  }>;
  vaga: {
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
  } | null;
  veiculos: Array<{
    id: string;
    placa: string;
    modelo: string;
    marca: string;
    tipo: string;
    vaga_id: string | null;
  }>;
}

interface UnidadeDetalhesProps {
  unidade: Unidade;
  todasUnidades: Array<{ id: string; numero: string }>;
  isStaff: boolean;
}

export function UnidadeDetalhes({ unidade, todasUnidades, isStaff }: UnidadeDetalhesProps) {
  const router = useRouter();
  const [mostrarFormVeiculo, setMostrarFormVeiculo] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState<string | null>(null);

  const handleVeiculoSalvo = () => {
    setMostrarFormVeiculo(false);
    setVeiculoEditando(null);
    router.refresh();
  };

  const handleEditarVeiculo = (veiculoId: string) => {
    setVeiculoEditando(veiculoId);
    setMostrarFormVeiculo(true);
  };

  const handleCancelarForm = () => {
    setMostrarFormVeiculo(false);
    setVeiculoEditando(null);
  };

  return (
    <div className="space-y-6">
      {/* Informações básicas da unidade */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Informações da Unidade
          </h3>
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Número</dt>
              <dd className="mt-1 text-sm text-gray-900">{unidade.numero}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total de Usuários</dt>
              <dd className="mt-1 text-sm text-gray-900">{unidade.total_usuarios}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data de Cadastro</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(unidade.created_at).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Última Atualização</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(unidade.updated_at).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Usuários vinculados */}
      {unidade.usuarios.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Usuários Vinculados
            </h3>
            <div className="mt-5">
              <ul className="divide-y divide-gray-200">
                {unidade.usuarios.map((usuario) => (
                  <li key={usuario.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{usuario.nome}</p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                        {usuario.perfil}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Vaga */}
      <VagaCard
        unidadeId={unidade.id}
        vaga={unidade.vaga}
        todasUnidades={todasUnidades.filter((u) => u.id !== unidade.id)}
        isStaff={isStaff}
      />

      {/* Veículos */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Veículos</h3>
            {isStaff && (
              <button
                onClick={() => {
                  setVeiculoEditando(null);
                  setMostrarFormVeiculo(true);
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Adicionar Veículo
              </button>
            )}
          </div>

          {mostrarFormVeiculo && (
            <div className="mb-5 p-4 border border-gray-200 rounded-lg">
              <VeiculoForm
                unidadeId={unidade.id}
                vagaId={unidade.vaga?.id || null}
                veiculoId={veiculoEditando}
                onSuccess={handleVeiculoSalvo}
                onCancel={handleCancelarForm}
              />
            </div>
          )}

          <VeiculoList
            veiculos={unidade.veiculos}
            vagaId={unidade.vaga?.id || null}
            unidadeId={unidade.id}
            isStaff={isStaff}
            onEdit={handleEditarVeiculo}
          />
        </div>
      </div>
    </div>
  );
}
