/**
 * Modal de alteração de senha.
 * 
 * Modal que permite que o usuário altere sua própria senha,
 * validando a senha atual antes de permitir a alteração.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const changePasswordSchema = z
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

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mostrarSenhas, setMostrarSenhas] = useState({
    senhaAtual: false,
    novaSenha: false,
    confirmarSenha: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Fecha modal ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Previne scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reseta form quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      reset();
      setError('');
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/alterar-senha', {
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

      setSuccess(true);

      // Fecha modal após 2 segundos
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Botão fechar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Fechar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Conteúdo */}
          <div>
            <h3
              className="text-lg font-medium leading-6 text-gray-900"
              id="modal-title"
            >
              Alterar Senha
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Digite sua senha atual e escolha uma nova senha
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-3">
                  <p className="text-sm text-green-800">
                    ✅ Senha alterada com sucesso!
                  </p>
                </div>
              )}

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
                    title={
                      mostrarSenhas.senhaAtual ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    {mostrarSenhas.senhaAtual ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.senhaAtual && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.senhaAtual.message}
                  </p>
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
                    title={
                      mostrarSenhas.novaSenha ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    {mostrarSenhas.novaSenha ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.novaSenha && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.novaSenha.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo de 6 caracteres
                </p>
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
                      mostrarSenhas.confirmarSenha
                        ? 'Ocultar senha'
                        : 'Mostrar senha'
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Alterando...' : success ? 'Alterado!' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

