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
  veiculoId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VeiculoForm({
  unidadeId,
  vagaId,
  veiculoId,
  onSuccess,
  onCancel,
}: VeiculoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [veiculo, setVeiculo] = useState<any>(null);

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
      vaga_id: vagaId,
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
            const veiculoEncontrado = veiculos.find((v: any) => v.id === veiculoId);
            if (veiculoEncontrado) {
              setVeiculo(veiculoEncontrado);
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
        throw new Error(errorData.error || 'Erro ao salvar veículo');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar veículo');
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

      {vagaId && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={!!usarVaga}
              onChange={(e) => {
                setValue('vaga_id', e.target.checked ? vagaId : null);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Estacionar na vaga da unidade</span>
          </label>
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
