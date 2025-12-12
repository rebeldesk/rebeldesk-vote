/**
 * Formulário para criar/editar vaga da unidade.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const vagaSchema = z.object({
  esta_alugada: z.boolean(),
  unidade_alugada_id: z.string().uuid().nullable(),
});

type VagaFormData = z.infer<typeof vagaSchema>;

interface Vaga {
  id: string;
  esta_alugada: boolean;
  unidade_alugada: {
    id: string;
    numero: string;
  } | null;
}

interface VagaFormProps {
  unidadeId: string;
  vaga?: Vaga | null;
  todasUnidades: Array<{ id: string; numero: string }>;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function VagaForm({
  unidadeId,
  vaga,
  todasUnidades,
  onSuccess,
  onCancel,
}: VagaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<VagaFormData>({
    resolver: zodResolver(vagaSchema),
    defaultValues: {
      esta_alugada: vaga?.esta_alugada || false,
      unidade_alugada_id: vaga?.unidade_alugada?.id || null,
    },
  });

  const estaAlugada = watch('esta_alugada');

  useEffect(() => {
    if (vaga) {
      reset({
        esta_alugada: vaga.esta_alugada,
        unidade_alugada_id: vaga.unidade_alugada?.id || null,
      });
    }
  }, [vaga, reset]);

  const onSubmit = async (data: VagaFormData) => {
    setLoading(true);
    setError('');

    try {
      const url = `/api/unidades/${unidadeId}/vaga`;
      const method = vaga ? 'PUT' : 'POST';
      const body = {
        esta_alugada: data.esta_alugada,
        unidade_alugada_id: data.esta_alugada ? data.unidade_alugada_id : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar vaga');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar vaga');
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

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('esta_alugada')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Está alugada</span>
        </label>
      </div>

      {estaAlugada && (
        <div>
          <label htmlFor="unidade_alugada_id" className="block text-sm font-medium text-gray-700">
            Unidade que está usando
          </label>
          <select
            id="unidade_alugada_id"
            {...register('unidade_alugada_id', {
              required: estaAlugada ? 'Selecione a unidade que está usando' : false,
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Selecione uma unidade</option>
            {todasUnidades.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.numero}
              </option>
            ))}
          </select>
          {errors.unidade_alugada_id && (
            <p className="mt-1 text-sm text-red-600">{errors.unidade_alugada_id.message}</p>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : vaga ? 'Atualizar' : 'Criar Vaga'}
        </button>
      </div>
    </form>
  );
}
