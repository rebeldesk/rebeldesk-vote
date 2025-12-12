/**
 * Formulário para criar unidade.
 * 
 * Gerencia o estado do formulário e valida os dados
 * antes de enviar para a API.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const unidadeSchema = z.object({
  numero: z.string().min(1, 'Número da unidade é obrigatório'),
});

type UnidadeFormData = z.infer<typeof unidadeSchema>;

export function UnidadeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnidadeFormData>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      numero: '',
    },
  });

  const onSubmit = async (data: UnidadeFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details.map((d: any) => d.message).join(', ')}`
          : errorData.error || 'Erro ao criar unidade';
        throw new Error(errorMessage);
      }

      router.push('/unidades');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar unidade');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
          Número da Unidade *
        </label>
        <input
          {...register('numero')}
          type="text"
          id="numero"
          placeholder="Ex: 101, 202, A-01"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.numero && (
          <p className="mt-1 text-sm text-red-600">{errors.numero.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Digite o número ou identificador da unidade (ex: 101, 202, A-01, Bloco A - Apt 101)
        </p>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/unidades')}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

