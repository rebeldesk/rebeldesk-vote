/**
 * Formulário para criar/editar usuário.
 * 
 * Gerencia o estado do formulário e valida os dados
 * antes de enviar para a API.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PerfilUsuario } from '@/types';

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().optional(),
  perfil: z.enum(['staff', 'conselho', 'auditor', 'morador']),
  unidade_id: z.string().uuid().nullable().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  usuarioId?: string;
  initialData?: Partial<UserFormData>;
}

export function UserForm({ usuarioId, initialData }: UserFormProps) {
  const router = useRouter();
  const [unidades, setUnidades] = useState<Array<{ id: string; numero: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData || {
      email: '',
      senha: '',
      nome: '',
      telefone: '',
      perfil: 'morador',
      unidade_id: null,
    },
  });

  useEffect(() => {
    // Busca unidades
    fetch('/api/unidades')
      .then((res) => res.json())
      .then((data) => setUnidades(data))
      .catch(() => setError('Erro ao carregar unidades'));
  }, []);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError('');

    try {
      const url = usuarioId ? `/api/usuarios/${usuarioId}` : '/api/usuarios';
      const method = usuarioId ? 'PUT' : 'POST';

      // Remove senha se estiver vazia (edição)
      if (usuarioId && !data.senha) {
        delete (data as any).senha;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar usuário');
      }

      router.push('/usuarios');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
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
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
          Nome *
        </label>
        <input
          {...register('nome')}
          type="text"
          id="nome"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.nome && (
          <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
          Senha {usuarioId ? '(deixe em branco para não alterar)' : '*'}
        </label>
        <input
          {...register('senha')}
          type="password"
          id="senha"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.senha && (
          <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
          Telefone
        </label>
        <input
          {...register('telefone')}
          type="tel"
          id="telefone"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="perfil" className="block text-sm font-medium text-gray-700">
          Perfil *
        </label>
        <select
          {...register('perfil')}
          id="perfil"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="morador">Morador</option>
          <option value="auditor">Auditor</option>
          <option value="conselho">Conselho</option>
          <option value="staff">Staff</option>
        </select>
        {errors.perfil && (
          <p className="mt-1 text-sm text-red-600">{errors.perfil.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="unidade_id" className="block text-sm font-medium text-gray-700">
          Unidade
        </label>
        <select
          {...register('unidade_id')}
          id="unidade_id"
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Nenhuma</option>
          {unidades.map((unidade) => (
            <option key={unidade.id} value={unidade.id}>
              {unidade.numero}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.push('/usuarios')}
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

