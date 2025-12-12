/**
 * Formulário de troca obrigatória de senha.
 * 
 * Permite que o usuário altere sua senha quando forçado pelo sistema.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
    confirmarSenha: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })
  .refine((data) => data.senhaAtual !== data.novaSenha, {
    message: 'A nova senha deve ser diferente da senha atual',
    path: ['novaSenha'],
  });

type TrocarSenhaFormData = z.infer<typeof trocarSenhaSchema>;

export function TrocarSenhaObrigatoriaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState({
    senhaAtual: false,
    novaSenha: false,
    confirmarSenha: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrocarSenhaFormData>({
    resolver: zodResolver(trocarSenhaSchema),
  });

  const onSubmit = async (data: TrocarSenhaFormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/alterar-senha-obrigatoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual: data.senhaAtual,
          novaSenha: data.novaSenha,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao alterar senha');
      }

      // Redireciona após sucesso
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Você não poderá acessar o sistema até alterar sua senha.
        </p>
      </div>

      <div>
        <label
          htmlFor="senhaAtual"
          className="block text-sm font-medium text-gray-700"
        >
          Senha Atual *
        </label>
        <div className="mt-1 flex gap-2">
          <input
            {...register('senhaAtual')}
            type={mostrarSenhas.senhaAtual ? 'text' : 'password'}
            id="senhaAtual"
            className="block flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() =>
              setMostrarSenhas((prev) => ({
                ...prev,
                senhaAtual: !prev.senhaAtual,
              }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            title={mostrarSenhas.senhaAtual ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenhas.senhaAtual ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.senhaAtual && (
          <p className="mt-1 text-sm text-red-600">{errors.senhaAtual.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="novaSenha"
          className="block text-sm font-medium text-gray-700"
        >
          Nova Senha *
        </label>
        <div className="mt-1 flex gap-2">
          <input
            {...register('novaSenha')}
            type={mostrarSenhas.novaSenha ? 'text' : 'password'}
            id="novaSenha"
            className="block flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() =>
              setMostrarSenhas((prev) => ({
                ...prev,
                novaSenha: !prev.novaSenha,
              }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            title={mostrarSenhas.novaSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenhas.novaSenha ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.novaSenha && (
          <p className="mt-1 text-sm text-red-600">{errors.novaSenha.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
      </div>

      <div>
        <label
          htmlFor="confirmarSenha"
          className="block text-sm font-medium text-gray-700"
        >
          Confirmar Nova Senha *
        </label>
        <div className="mt-1 flex gap-2">
          <input
            {...register('confirmarSenha')}
            type={mostrarSenhas.confirmarSenha ? 'text' : 'password'}
            id="confirmarSenha"
            className="block flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() =>
              setMostrarSenhas((prev) => ({
                ...prev,
                confirmarSenha: !prev.confirmarSenha,
              }))
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            title={
              mostrarSenhas.confirmarSenha ? 'Ocultar senha' : 'Mostrar senha'
            }
          >
            {mostrarSenhas.confirmarSenha ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        {errors.confirmarSenha && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmarSenha.message}
          </p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Alterando...' : 'Alterar Senha e Continuar'}
        </button>
      </div>
    </form>
  );
}
