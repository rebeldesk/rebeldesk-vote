/**
 * Componente de detalhes da unidade.
 * 
 * Exibe informações da unidade, vaga e veículos com opções de edição.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VagaCard } from './VagaCard';
import { VeiculoList } from './VeiculoList';
import { VeiculoForm } from './VeiculoForm';

interface Unidade {
  id: string;
  numero: string;
  tem_direito_vaga: boolean;
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
  vaga_alugada: {
    id: string;
    unidade_proprietaria: {
      id: string;
      numero: string;
    };
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
              <dt className="text-sm font-medium text-gray-500">Tem Direito a Vaga</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {isStaff ? (
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={unidade.tem_direito_vaga}
                        onChange={async (e) => {
                          try {
                            const response = await fetch(`/api/unidades/${unidade.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ tem_direito_vaga: e.target.checked }),
                            });

                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(errorData.error || 'Erro ao atualizar');
                            }

                            router.refresh();
                          } catch (error: any) {
                            alert(error.message || 'Erro ao atualizar direito a vaga');
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`block h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${
                          unidade.tem_direito_vaga ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                            unidade.tem_direito_vaga ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                    <span className="ml-3">
                      {unidade.tem_direito_vaga ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          Não
                        </span>
                      )}
                    </span>
                  </label>
                ) : (
                  <span>
                    {unidade.tem_direito_vaga ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Sim
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Não
                      </span>
                    )}
                  </span>
                )}
              </dd>
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
        temDireitoVaga={unidade.tem_direito_vaga}
        isStaff={isStaff}
      />

      {/* Vaga Alugada - Se esta unidade está usando uma vaga alugada */}
      {unidade.vaga_alugada && (
        <div className="bg-yellow-50 border border-yellow-200 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Vaga Alugada
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Esta unidade também está usando a vaga alugada da{' '}
                    <Link
                      href={`/unidades/${unidade.vaga_alugada.unidade_proprietaria.id}`}
                      className="font-medium underline hover:text-yellow-900"
                    >
                      Unidade {unidade.vaga_alugada.unidade_proprietaria.numero}
                    </Link>
                  </p>
                </div>
                {unidade.vaga_alugada.veiculos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      Veículos na vaga alugada ({unidade.vaga_alugada.veiculos.length}):
                    </p>
                    <ul className="space-y-2">
                      {unidade.vaga_alugada.veiculos.map((veiculo) => (
                        <li key={veiculo.id} className="bg-white rounded p-2 text-sm">
                          <span className="font-medium">{veiculo.marca} {veiculo.modelo}</span>
                          {' - '}
                          <span className="text-gray-600">Placa: {veiculo.placa}</span>
                          {' - '}
                          <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                            {veiculo.tipo === 'carro' ? 'Carro' : 'Moto'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                vagaEstaAlugada={unidade.vaga?.esta_alugada || false}
                veiculosNaVagaPropria={unidade.vaga?.veiculos.length || 0}
                veiculoEstaNaVagaPropria={
                  veiculoEditando
                    ? unidade.veiculos.find((v) => v.id === veiculoEditando)?.vaga_id ===
                      unidade.vaga?.id
                    : false
                }
                vagaAlugadaId={unidade.vaga_alugada?.id || null}
                veiculosNaVagaAlugada={unidade.vaga_alugada?.veiculos.length || 0}
                veiculoId={veiculoEditando}
                veiculoEstaNaVagaAlugada={
                  veiculoEditando
                    ? unidade.veiculos.find((v) => v.id === veiculoEditando)?.vaga_id ===
                      unidade.vaga_alugada?.id
                    : false
                }
                temDireitoVaga={unidade.tem_direito_vaga}
                onSuccess={handleVeiculoSalvo}
                onCancel={handleCancelarForm}
              />
            </div>
          )}

          <VeiculoList
            veiculos={unidade.veiculos}
            vagaId={unidade.vaga?.id || null}
            vagaAlugadaId={unidade.vaga_alugada?.id || null}
            unidadeId={unidade.id}
            isStaff={isStaff}
            onEdit={handleEditarVeiculo}
          />
        </div>
      </div>
    </div>
  );
}
