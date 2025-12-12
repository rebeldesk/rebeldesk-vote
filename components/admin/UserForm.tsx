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
import { maskTelefone, unmaskTelefone, isValidTelefone } from '@/lib/utils/masks';
import { MultiSelect } from '@/components/ui/MultiSelect';

// Schema Zod com validação e transformação
const userSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Telefone é opcional
        // Remove máscara e valida
        const numbers = unmaskTelefone(val);
        return isValidTelefone(numbers);
      },
      {
        message: 'Telefone deve ter DDD + número completo. Formato: (11) 98765-4321 ou (11) 3456-7890',
      }
    ),
  perfil: z.enum(['staff', 'conselho', 'auditor', 'morador']),
  // Array de IDs de unidades
  unidades_ids: z.array(z.string().uuid()).default([]),
  forcar_troca_senha: z.boolean().default(false),
});

// Tipo do formulário
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
  const [senhaGerada, setSenhaGerada] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [forcarTrocaSenha, setForcarTrocaSenha] = useState(
    (initialData as any)?.forcar_troca_senha || false
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      email: initialData?.email || '',
      senha: initialData?.senha || '',
      nome: initialData?.nome || '',
      telefone: initialData?.telefone || '',
      perfil: initialData?.perfil || 'morador',
      unidades_ids: (initialData as any)?.unidades?.map((u: any) => u.id) || 
                    (initialData as any)?.unidades_ids || 
                    ((initialData as any)?.unidade_id ? [(initialData as any).unidade_id] : []),
      forcar_troca_senha: (initialData as any)?.forcar_troca_senha || false,
    },
  });

  const senhaAtual = watch('senha');
  const unidadesIdsAtual = watch('unidades_ids');
  const [unidadesCarregadas, setUnidadesCarregadas] = useState(false);
  const [telefoneFormatado, setTelefoneFormatado] = useState(
    initialData?.telefone ? maskTelefone(initialData.telefone) : ''
  );

  useEffect(() => {
    // Formata telefone inicial se houver
    if (initialData?.telefone) {
      setTelefoneFormatado(maskTelefone(initialData.telefone));
    }
  }, [initialData?.telefone]);

  useEffect(() => {
    // Busca unidades apenas uma vez
    if (unidadesCarregadas) return;

    fetch('/api/unidades')
      .then((res) => res.json())
      .then((data) => {
        setUnidades(data);
        setUnidadesCarregadas(true);
        // Após carregar unidades, seta o valor das unidades se houver initialData
        if (initialData) {
          const unidadesIds = (initialData as any)?.unidades?.map((u: any) => u.id) || 
                            (initialData as any)?.unidades_ids || 
                            ((initialData as any)?.unidade_id ? [(initialData as any).unidade_id] : []);
          setValue('unidades_ids', unidadesIds);
        }
      })
      .catch(() => setError('Erro ao carregar unidades'));
  }, [initialData, setValue, unidadesCarregadas]);

  /**
   * Gera uma senha aleatória segura.
   * Formato: 8 caracteres com letras maiúsculas, minúsculas e números
   */
  const gerarSenha = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let senha = '';
    for (let i = 0; i < 8; i++) {
      senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setSenhaGerada(senha);
    setValue('senha', senha, { shouldValidate: true });
    setMostrarSenha(true);
  };

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError('');

    try {
      const url = usuarioId ? `/api/usuarios/${usuarioId}` : '/api/usuarios';
      const method = usuarioId ? 'PUT' : 'POST';

      // Prepara dados para envio
      // Remove máscara do telefone antes de enviar
      const telefoneSemMascara = data.telefone ? unmaskTelefone(data.telefone) : '';
      
      const dadosEnvio: any = {
        email: data.email,
        nome: data.nome,
        telefone: telefoneSemMascara,
        perfil: data.perfil,
        unidades_ids: data.unidades_ids || [],
        forcar_troca_senha: forcarTrocaSenha,
      };

      // Remove senha se estiver vazia (edição)
      if (usuarioId && !data.senha) {
        // Não inclui senha
      } else if (data.senha) {
        dadosEnvio.senha = data.senha;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEnvio),
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
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <input
            {...register('email')}
            type="email"
            id="email"
            autoComplete="email"
            className="block w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all"
            placeholder="usuario@exemplo.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
            Senha {usuarioId ? '(deixe em branco para não alterar)' : '*'}
          </label>
          <button
            type="button"
            onClick={gerarSenha}
            className="text-sm font-medium text-blue-600 hover:text-blue-900"
          >
            🔑 Gerar Senha
          </button>
        </div>
        <div className="mt-1 flex gap-2">
          <input
            {...register('senha')}
            type={mostrarSenha ? 'text' : 'password'}
            id="senha"
            className="block flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            onChange={(e) => {
              const valor = e.target.value;
              // Se o usuário editar manualmente e não for a senha gerada, limpa a flag
              if (senhaGerada && valor !== senhaGerada) {
                setSenhaGerada('');
                setMostrarSenha(false);
              }
            }}
          />
          {senhaAtual && senhaAtual.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMostrarSenha(!mostrarSenha);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? '👁️' : '👁️‍🗨️'}
            </button>
          )}
        </div>
        {senhaGerada && (
          <div className="mt-2 rounded-md bg-blue-50 p-3">
            <p className="text-xs text-gray-700">
              <span className="font-medium">Senha gerada:</span>{' '}
              <span className="font-mono font-semibold text-blue-900">{senhaGerada}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(senhaGerada);
                  alert('Senha copiada para a área de transferência!');
                }}
                className="ml-2 text-blue-600 hover:text-blue-900 underline"
              >
                📋 Copiar
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-600">
              ⚠️ Anote esta senha antes de salvar. Ela não será exibida novamente.
            </p>
          </div>
        )}
        {errors.senha && (
          <p className="mt-1 text-sm text-red-600">{errors.senha.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="forcar_troca_senha"
          checked={forcarTrocaSenha}
          onChange={(e) => setForcarTrocaSenha(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="forcar_troca_senha" className="ml-2 block text-sm text-gray-700">
          Forçar troca de senha no próximo login
        </label>
      </div>
      <p className="text-xs text-gray-500 -mt-4 ml-6">
        O usuário será obrigado a alterar a senha após fazer login
      </p>

      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
          Telefone
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
          </div>
          <input
            {...register('telefone', {
              onChange: (e) => {
                const masked = maskTelefone(e.target.value);
                setTelefoneFormatado(masked);
                // Salva o valor sem máscara no form
                setValue('telefone', unmaskTelefone(masked), { shouldValidate: true });
              },
            })}
            type="tel"
            id="telefone"
            value={telefoneFormatado}
            className="block w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 sm:text-sm transition-all"
            placeholder="(11) 98765-4321"
            maxLength={15}
          />
        </div>
        {errors.telefone && (
          <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Formato: (11) 98765-4321 (celular) ou (11) 3456-7890 (fixo). DDD obrigatório.
        </p>
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
        <label htmlFor="unidades_ids" className="block text-sm font-medium text-gray-700">
          Unidades
        </label>
        <p className="mt-1 text-xs text-gray-500 mb-2">
          Selecione uma ou mais unidades para vincular ao usuário
        </p>
        <MultiSelect
          options={unidades.map((unidade) => ({
            value: unidade.id,
            label: unidade.numero,
          }))}
          value={unidadesIdsAtual || []}
          onChange={(value) => {
            setValue('unidades_ids', value, { shouldValidate: true });
          }}
          placeholder="Selecione as unidades..."
          emptyMessage="Nenhuma unidade encontrada"
          className="mt-1"
        />
        {errors.unidades_ids && (
          <p className="mt-1 text-sm text-red-600">{errors.unidades_ids.message}</p>
        )}
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

