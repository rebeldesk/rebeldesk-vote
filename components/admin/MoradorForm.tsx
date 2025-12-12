/**
 * Formulário para criar/editar morador.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const moradorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  documento: z.string().min(1, 'Documento é obrigatório').max(20),
  grau_parentesco: z.enum(['Proprietario', 'Conjuge', 'Filho', 'Pai', 'Mae', 'Outro']),
});

type MoradorFormData = z.infer<typeof moradorSchema>;

interface MoradorFormProps {
  unidadeId: string;
  moradorId?: string | null;
  initialData?: {
    nome: string;
    documento: string;
    grau_parentesco: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function MoradorForm({
  unidadeId,
  moradorId,
  initialData,
  onSuccess,
  onCancel,
}: MoradorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MoradorFormData>({
    resolver: zodResolver(moradorSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      documento: initialData?.documento || '',
      grau_parentesco: (initialData?.grau_parentesco as any) || 'Proprietario',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nome: initialData.nome,
        documento: initialData.documento,
        grau_parentesco: initialData.grau_parentesco as any,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: MoradorFormData) => {
    setLoading(true);
    setError('');

    try {
      const url = moradorId
        ? `/api/unidades/${unidadeId}/moradores/${moradorId}`
        : `/api/unidades/${unidadeId}/moradores`;
      const method = moradorId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Erro ao salvar morador';
        
        // Se for erro de documento duplicado, mostrar mensagem mais clara
        if (errorMessage.includes('documento') || errorMessage.includes('Documento')) {
          throw new Error('Este documento já está cadastrado no sistema. Por favor, use outro documento.');
        }
        
        throw new Error(errorMessage);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar morador');
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
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
          Nome *
        </label>
        <input
          type="text"
          id="nome"
          {...register('nome')}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Ex: João Silva"
        />
        {errors.nome && (
          <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="documento" className="block text-sm font-medium text-gray-700">
          Documento *
        </label>
        <input
          type="text"
          id="documento"
          {...register('documento')}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="Ex: 123.456.789-00"
        />
        {errors.documento && (
          <p className="mt-1 text-sm text-red-600">{errors.documento.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="grau_parentesco" className="block text-sm font-medium text-gray-700">
          Grau de Parentesco *
        </label>
        <select
          id="grau_parentesco"
          {...register('grau_parentesco')}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="Proprietario">Proprietário</option>
          <option value="Conjuge">Cônjuge</option>
          <option value="Filho">Filho</option>
          <option value="Pai">Pai</option>
          <option value="Mae">Mãe</option>
          <option value="Outro">Outro</option>
        </select>
        {errors.grau_parentesco && (
          <p className="mt-1 text-sm text-red-600">{errors.grau_parentesco.message}</p>
        )}
      </div>

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
          {loading ? 'Salvando...' : moradorId ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}
