/**
 * Formulário para criar/editar veículo.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const veiculoSchema = z.object({
  placa: z.string().min(1, 'Placa é obrigatória').max(10),
  modelo: z.string().min(1, 'Modelo é obrigatório').max(100),
  marca: z.string().min(1, 'Marca é obrigatória').max(100),
  tipo: z.enum(['carro', 'moto']),
  vaga_id: z.string().uuid().nullable().optional(),
});

type VeiculoFormData = z.infer<typeof veiculoSchema>;

interface VeiculoFormProps {
  unidadeId: string;
  vagaId: string | null;
  vagaEstaAlugada?: boolean;
  veiculosNaVagaPropria?: number;
  veiculoEstaNaVagaPropria?: boolean;
  vagaAlugadaId?: string | null;
  veiculosNaVagaAlugada?: number;
  veiculoId?: string | null;
  veiculoEstaNaVagaAlugada?: boolean;
  temDireitoVaga?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VeiculoForm({
  unidadeId,
  vagaId,
  vagaEstaAlugada = false,
  veiculosNaVagaPropria = 0,
  veiculoEstaNaVagaPropria = false,
  vagaAlugadaId,
  veiculosNaVagaAlugada = 0,
  veiculoId,
  veiculoEstaNaVagaAlugada = false,
  temDireitoVaga = true,
  onSuccess,
  onCancel,
}: VeiculoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const temVagaAlugada = !!vagaAlugadaId;
  const vagaPropriaEstaAlugada = vagaEstaAlugada;
  
  // Vaga própria está disponível se:
  // - Não tem veículos na vaga própria, OU
  // - Está editando o veículo que já está na vaga própria (pode manter ele lá)
  const veiculosNaVagaPropriaSemEste = veiculoEstaNaVagaPropria 
    ? Math.max(0, veiculosNaVagaPropria - 1) 
    : veiculosNaVagaPropria;
  const vagaPropriaDisponivel = vagaId && !vagaPropriaEstaAlugada && veiculosNaVagaPropriaSemEste === 0;
  
  // Vaga alugada está disponível se:
  // - Não tem veículos na vaga alugada, OU
  // - Está editando o veículo que já está na vaga alugada (pode manter ele lá)
  const veiculosNaVagaSemEste = veiculoEstaNaVagaAlugada 
    ? Math.max(0, veiculosNaVagaAlugada - 1) 
    : veiculosNaVagaAlugada;
  const vagaAlugadaDisponivel = temVagaAlugada && veiculosNaVagaSemEste === 0;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      placa: '',
      modelo: '',
      marca: '',
      tipo: 'carro',
      // Só preenche vaga alugada se estiver disponível, senão usa vaga própria ou null
      vaga_id: vagaAlugadaDisponivel ? vagaAlugadaId : (vagaId && !vagaPropriaEstaAlugada ? vagaId : null),
    },
  });

  const usarVaga = watch('vaga_id');

  useEffect(() => {
    if (veiculoId) {
      // Buscar dados do veículo
      const buscarVeiculo = async () => {
        try {
          const response = await fetch(`/api/unidades/${unidadeId}/veiculos`);
          if (response.ok) {
            const veiculos = await response.json();
            const veiculoEncontrado = veiculos.find((v: { id: string }) => v.id === veiculoId);
            if (veiculoEncontrado) {
              reset({
                placa: veiculoEncontrado.placa,
                modelo: veiculoEncontrado.modelo,
                marca: veiculoEncontrado.marca,
                tipo: veiculoEncontrado.tipo,
                vaga_id: veiculoEncontrado.vaga_id || vagaId,
              });
            }
          }
        } catch (err) {
          console.error('Erro ao buscar veículo:', err);
        }
      };
      buscarVeiculo();
    }
  }, [veiculoId, unidadeId, vagaId, reset]);

  const onSubmit = async (data: VeiculoFormData) => {
    // Se tentou associar à vaga própria, verifica se tem direito
    if (data.vaga_id === vagaId) {
      // Se não tem direito a vaga própria, não pode usar
      if (!temDireitoVaga) {
        alert('⚠️ Esta unidade não tem direito a vaga de estacionamento. Não é possível associar veículo à vaga própria.');
        return;
      }
      // Se a vaga própria está alugada, não pode usar
      if (vagaPropriaEstaAlugada) {
        alert('⚠️ Não é possível associar veículo à vaga. Esta vaga está alugada para outra unidade.');
        return;
      }
    }

    // Se tentou associar à vaga alugada, permite mesmo sem direito a vaga própria
    // (a validação no backend já verifica se a vaga está realmente alugada para esta unidade)
    if (data.vaga_id === vagaAlugadaId) {
      // Permite usar vaga alugada mesmo sem direito a vaga própria
      // Não precisa validar temDireitoVaga aqui
    }

    // Se tentou associar a uma vaga que não é própria nem alugada, bloquear
    if (data.vaga_id && data.vaga_id !== vagaId && data.vaga_id !== vagaAlugadaId) {
      alert('⚠️ Não é possível associar veículo a uma vaga que não pertence a esta unidade.');
      return;
    }

    // Se não tem vaga própria nem vaga alugada, e tentou associar, bloquear
    if (!vagaId && !temVagaAlugada && data.vaga_id) {
      alert('⚠️ Não é possível associar veículo a uma vaga. Esta unidade não possui vaga.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = veiculoId
        ? `/api/unidades/${unidadeId}/veiculos/${veiculoId}`
        : `/api/unidades/${unidadeId}/veiculos`;
      const method = veiculoId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Erro ao salvar veículo';
        
        // Se for erro de placa duplicada, mostrar mensagem mais clara
        if (errorMessage.includes('placa') || errorMessage.includes('Placa')) {
          throw new Error('Esta placa já está cadastrada no sistema. Por favor, use outra placa.');
        }
        
        throw new Error(errorMessage);
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar veículo';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="placa" className="block text-sm font-medium text-gray-700">
            Placa *
          </label>
          <input
            type="text"
            id="placa"
            {...register('placa')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="ABC-1234"
          />
          {errors.placa && (
            <p className="mt-1 text-sm text-red-600">{errors.placa.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700">
            Marca *
          </label>
          <input
            type="text"
            id="marca"
            {...register('marca')}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="Ex: Toyota"
          />
          {errors.marca && (
            <p className="mt-1 text-sm text-red-600">{errors.marca.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
          Modelo *
        </label>
        <input
          type="text"
          id="modelo"
          {...register('modelo')}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Ex: Corolla"
        />
        {errors.modelo && (
          <p className="mt-1 text-sm text-red-600">{errors.modelo.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="carro"
              {...register('tipo')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Carro</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="moto"
              {...register('tipo')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Moto</span>
          </label>
        </div>
        {errors.tipo && (
          <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
        )}
      </div>

      {/* Seleção de Vaga */}
      {(vagaId || vagaAlugadaId || temDireitoVaga) && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Estacionar em vaga
          </label>
          
          {/* Opção: Não estacionar em vaga */}
          <label className="flex items-center p-3 rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="vaga_selecao"
              checked={!usarVaga}
              onChange={() => {
                setValue('vaga_id', null);
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700">Não estacionar em vaga</span>
              <p className="text-xs text-gray-500">O veículo será cadastrado sem estar associado a nenhuma vaga</p>
            </div>
          </label>

          {/* Opção: Vaga própria - sempre mostra se tem direito, mas pode estar desabilitada */}
          {temDireitoVaga && (
            <>
              {/* Se está disponível OU se está editando o veículo que já está lá, mostra habilitada */}
              {vagaPropriaDisponivel || veiculoEstaNaVagaPropria ? (
                <label className="flex items-center p-3 rounded-md border border-green-300 hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="vaga_selecao"
                    checked={usarVaga === vagaId}
                    onChange={() => {
                      if (vagaId) {
                        setValue('vaga_id', vagaId);
                      }
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Vaga própria</span>
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-medium text-green-800">
                        Própria
                      </span>
                      {veiculosNaVagaPropria > 0 && !veiculoEstaNaVagaPropria && (
                        <span className="text-xs text-gray-500">
                          ({veiculosNaVagaPropria} veículo{veiculosNaVagaPropria !== 1 ? 's' : ''} já estacionado{veiculosNaVagaPropria !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Estacionar na vaga própria desta unidade</p>
                  </div>
                </label>
              ) : !vagaId ? (
                /* Se não tem vaga cadastrada */
                <label className="flex items-center p-3 rounded-md border border-yellow-300 bg-yellow-50 opacity-60 cursor-not-allowed">
                  <input
                    type="radio"
                    name="vaga_selecao"
                    checked={false}
                    disabled
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Vaga própria</span>
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-medium text-green-800">
                        Própria
                      </span>
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-medium text-yellow-800">
                        Não cadastrada
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Esta unidade não possui vaga própria cadastrada. Cadastre uma vaga primeiro.
                    </p>
                  </div>
                </label>
              ) : vagaPropriaEstaAlugada ? (
                /* Se a vaga está alugada */
                <label className="flex items-center p-3 rounded-md border border-red-300 bg-red-50 opacity-60 cursor-not-allowed">
                  <input
                    type="radio"
                    name="vaga_selecao"
                    checked={false}
                    disabled
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Vaga própria</span>
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-medium text-green-800">
                        Própria
                      </span>
                      <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-medium text-red-800">
                        Alugada
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Esta vaga está alugada para outra unidade e não pode ser usada.
                    </p>
                  </div>
                </label>
              ) : (
                /* Se a vaga está cheia */
                <label className="flex items-center p-3 rounded-md border border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed">
                  <input
                    type="radio"
                    name="vaga_selecao"
                    checked={false}
                    disabled
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Vaga própria</span>
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-medium text-green-800">
                        Própria
                      </span>
                      <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-medium text-red-800">
                        Cheia
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      A vaga própria já possui {veiculosNaVagaPropria} veículo{veiculosNaVagaPropria !== 1 ? 's' : ''} estacionado{veiculosNaVagaPropria !== 1 ? 's' : ''} e não está disponível para mais veículos.
                    </p>
                  </div>
                </label>
              )}
            </>
          )}

          {/* Opção: Vaga alugada - sempre mostra se existe, mas pode estar desabilitada se cheia */}
          {vagaAlugadaId && (
            <>
              {/* Se está disponível OU se está editando o veículo que já está lá, mostra habilitada */}
              {(vagaAlugadaDisponivel || veiculoEstaNaVagaAlugada) ? (
                <label className="flex items-center p-3 rounded-md border border-blue-300 hover:bg-blue-50 cursor-pointer">
                  <input
                    type="radio"
                    name="vaga_selecao"
                    checked={usarVaga === vagaAlugadaId}
                    onChange={() => {
                      setValue('vaga_id', vagaAlugadaId);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">Vaga alugada</span>
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-800">
                        Alugada
                      </span>
                      {veiculosNaVagaAlugada > 0 && !veiculoEstaNaVagaAlugada && (
                        <span className="text-xs text-gray-500">
                          ({veiculosNaVagaAlugada} veículo{veiculosNaVagaAlugada !== 1 ? 's' : ''} já estacionado{veiculosNaVagaAlugada !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Estacionar na vaga alugada desta unidade</p>
                  </div>
                </label>
              ) : (
                /* Se não está disponível e não está editando, mostra desabilitada com informação */
                <label className="flex items-center p-3 rounded-md border border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed">
                  <input
                    type="radio"
                    name="vaga_selecao"
                    checked={false}
                    disabled
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Vaga alugada</span>
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-800">
                        Alugada
                      </span>
                      <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-medium text-red-800">
                        Cheia
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      A vaga alugada já possui {veiculosNaVagaAlugada} veículo{veiculosNaVagaAlugada !== 1 ? 's' : ''} estacionado{veiculosNaVagaAlugada !== 1 ? 's' : ''} e não está disponível para mais veículos.
                    </p>
                  </div>
                </label>
              )}
            </>
          )}
        </div>
      )}


      {/* Se não tem direito a vaga própria e não tem vaga alugada disponível, mostrar aviso */}
      {!temDireitoVaga && !vagaAlugadaDisponivel && !vagaAlugadaId && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex">
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
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Informação:</strong> Esta unidade não tem direito a vaga própria de estacionamento. 
                {vagaAlugadaId ? ' Você pode usar a vaga alugada disponível acima.' : ' O veículo será cadastrado sem estar associado a nenhuma vaga.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Se a vaga própria está alugada, não pode associar */}
      {vagaPropriaEstaAlugada && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>Atenção:</strong> Esta vaga está alugada para outra unidade. 
                Não é possível associar veículos à vaga enquanto estiver alugada.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : veiculoId ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}
