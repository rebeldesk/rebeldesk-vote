/**
 * Formulário para criar/editar votação.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const votingSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.enum(['escolha_unica', 'multipla_escolha']),
  modo_auditoria: z.enum(['anonimo', 'rastreado']),
  mostrar_parcial: z.boolean(),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().min(1, 'Data de término é obrigatória'),
  opcoes: z.array(z.string().min(1, 'Opção não pode ser vazia')).min(2, 'Deve ter pelo menos 2 opções'),
});

type VotingFormData = z.infer<typeof votingSchema>;

interface VotingFormProps {
  votacaoId?: string;
  initialData?: Partial<VotingFormData>;
}

export function VotingForm({ votacaoId, initialData }: VotingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opcoes, setOpcoes] = useState<string[]>(
    initialData?.opcoes || ['', '']
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VotingFormData>({
    resolver: zodResolver(votingSchema),
    defaultValues: {
      titulo: initialData?.titulo || '',
      descricao: initialData?.descricao || '',
      tipo: initialData?.tipo || 'escolha_unica',
      modo_auditoria: initialData?.modo_auditoria || 'anonimo',
      mostrar_parcial: initialData?.mostrar_parcial ?? false,
      data_inicio: initialData?.data_inicio || '',
      data_fim: initialData?.data_fim || '',
      opcoes: initialData?.opcoes || ['', ''],
    },
  });

  const tipo = watch('tipo');

  const adicionarOpcao = () => {
    const novasOpcoes = [...opcoes, ''];
    setOpcoes(novasOpcoes);
    setValue('opcoes', novasOpcoes);
  };

  const removerOpcao = (index: number) => {
    if (opcoes.length <= 2) return;
    const novasOpcoes = opcoes.filter((_, i) => i !== index);
    setOpcoes(novasOpcoes);
    setValue('opcoes', novasOpcoes);
  };

  const atualizarOpcao = (index: number, valor: string) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[index] = valor;
    setOpcoes(novasOpcoes);
    setValue('opcoes', novasOpcoes);
  };

  const onSubmit = async (data: VotingFormData) => {
    setLoading(true);
    setError('');

    try {
      // Valida opções
      const opcoesValidas = opcoes.filter((op) => op.trim() !== '');
      if (opcoesValidas.length < 2) {
        throw new Error('Deve ter pelo menos 2 opções');
      }

      const url = votacaoId ? `/api/votacoes/${votacaoId}` : '/api/votacoes';
      const method = votacaoId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          opcoes: opcoesValidas,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Mostra detalhes de validação se disponíveis
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details.map((d: any) => d.message).join(', ')}`
          : errorData.error || 'Erro ao salvar votação';
        throw new Error(errorMessage);
      }

      router.push('/votacoes');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar votação');
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
        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
          Título *
        </label>
        <input
          {...register('titulo')}
          type="text"
          id="titulo"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.titulo && (
          <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          {...register('descricao')}
          id="descricao"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
            Tipo *
          </label>
          <select
            {...register('tipo')}
            id="tipo"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="escolha_unica">Escolha Única</option>
            <option value="multipla_escolha">Múltipla Escolha</option>
          </select>
        </div>

        <div>
          <label htmlFor="modo_auditoria" className="block text-sm font-medium text-gray-700">
            Modo de Auditoria *
          </label>
          <select
            {...register('modo_auditoria')}
            id="modo_auditoria"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="anonimo">Anônimo</option>
            <option value="rastreado">Rastreado</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center">
          <input
            {...register('mostrar_parcial')}
            type="checkbox"
            id="mostrar_parcial"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="mostrar_parcial" className="ml-2 block text-sm text-gray-700">
            Mostrar resultados parciais durante a votação
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Se marcado, os votantes poderão ver os resultados parciais enquanto a votação estiver aberta
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700">
            Data de Início *
          </label>
          <input
            {...register('data_inicio')}
            type="datetime-local"
            id="data_inicio"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          {errors.data_inicio && (
            <p className="mt-1 text-sm text-red-600">{errors.data_inicio.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="data_fim" className="block text-sm font-medium text-gray-700">
            Data de Término *
          </label>
          <input
            {...register('data_fim')}
            type="datetime-local"
            id="data_fim"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          {errors.data_fim && (
            <p className="mt-1 text-sm text-red-600">{errors.data_fim.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Opções * (mínimo 2)
          </label>
          <button
            type="button"
            onClick={adicionarOpcao}
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            + Adicionar Opção
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {opcoes.map((opcao, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={opcao}
                onChange={(e) => atualizarOpcao(index, e.target.value)}
                placeholder={`Opção ${index + 1}`}
                className="block flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              {opcoes.length > 2 && (
                <button
                  type="button"
                  onClick={() => removerOpcao(index)}
                  className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.opcoes && (
          <p className="mt-1 text-sm text-red-600">{errors.opcoes.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/votacoes')}
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

