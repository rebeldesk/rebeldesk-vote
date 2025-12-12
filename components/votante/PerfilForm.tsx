/**
 * Formulário de perfil do usuário.
 * 
 * Permite visualizar dados e atualizar apenas telefone e senha.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { maskTelefone, unmaskTelefone } from '@/lib/utils/masks';

const perfilSchema = z.object({
  telefone: z.string().optional(),
});

type PerfilFormData = z.infer<typeof perfilSchema>;

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: string;
  unidades?: {
    id: string;
    numero: string;
  }[];
}

interface PerfilFormProps {
  usuario: Usuario;
}

export function PerfilForm({ usuario }: PerfilFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [telefoneValue, setTelefoneValue] = useState(
    usuario.telefone ? maskTelefone(usuario.telefone) : ''
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      telefone: usuario.telefone || '',
    },
  });

  // Função para capitalizar primeira letra
  const capitalizeFirst = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Função para formatar email (lowercase)
  const formatEmail = (email: string): string => {
    return email.toLowerCase().trim();
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskTelefone(e.target.value);
    setTelefoneValue(masked);
    // Salva o valor sem máscara no form
    setValue('telefone', unmaskTelefone(masked), { shouldValidate: true });
  };

  const onSubmit = async (data: PerfilFormData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Envia telefone sem máscara
      const telefoneSemMascara = data.telefone ? unmaskTelefone(data.telefone) : '';
      
      const response = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneSemMascara }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar perfil');
      }

      setSuccess(true);
      router.refresh();

      // Limpa mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Informações Pessoais
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Seus dados pessoais. Você pode atualizar apenas o telefone.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">
                ✅ Telefone atualizado com sucesso!
              </p>
            </div>
          )}

          {/* Nome - Somente leitura */}
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-gray-700"
            >
              Nome
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="nome"
                value={usuario.nome}
                disabled
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Este campo não pode ser alterado
            </p>
          </div>

          {/* Email - Somente leitura */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="mt-1">
              <input
                type="email"
                id="email"
                value={formatEmail(usuario.email)}
                disabled
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Este campo não pode ser alterado
            </p>
          </div>

          {/* Perfil - Somente leitura */}
          <div>
            <label
              htmlFor="perfil"
              className="block text-sm font-medium text-gray-700"
            >
              Perfil
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="perfil"
                value={capitalizeFirst(usuario.perfil)}
                disabled
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 shadow-sm sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Este campo não pode ser alterado
            </p>
          </div>

          {/* Unidades - Somente leitura */}
          {usuario.unidades && usuario.unidades.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unidades Vinculadas
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {usuario.unidades.map((unidade) => (
                  <span
                    key={unidade.id}
                    className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                  >
                    {unidade.numero}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Unidades vinculadas ao seu usuário
              </p>
            </div>
          )}

          {/* Telefone - Editável */}
          <div>
            <label
              htmlFor="telefone"
              className="block text-sm font-medium text-gray-700"
            >
              Telefone
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="telefone"
                value={telefoneValue}
                onChange={handleTelefoneChange}
                placeholder="(11) 98765-4321"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
            </div>
            {errors.telefone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.telefone.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Você pode atualizar seu telefone
            </p>
          </div>

          {/* Senha - Botão para modal */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Alterar Senha
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Clique no botão para alterar sua senha
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                reset();
                setTelefoneValue(usuario.telefone ? maskTelefone(usuario.telefone) : '');
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Telefone'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de alteração de senha */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
