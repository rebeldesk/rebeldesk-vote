/**
 * Componente client-side para listagem de usuários com busca e ações.
 * 
 * Gerencia a busca local e ações de deletar.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { QuickFilters } from '@/components/ui/QuickFilters';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: string;
  conselheiro?: boolean;
  tipoUsuario?: string | null;
  procuracaoAtiva?: boolean;
  unidades?: {
    id: string;
    numero: string;
  }[];
}

interface UserListProps {
  usuarios: Usuario[];
  currentUserId?: string;
  canDelete?: boolean; // Apenas staff pode deletar
}

export function UserList({ usuarios, currentUserId, canDelete = false }: UserListProps) {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState<string>('todos');
  const [filtroUnidade, setFiltroUnidade] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [usuarioParaDeletar, setUsuarioParaDeletar] = useState<string | null>(null);
  const [deletando, setDeletando] = useState(false);

  // Conta usuários por perfil para os filtros
  const contadoresPerfil = useMemo(() => {
    const contadores: Record<string, number> = {
      todos: usuarios.length,
      staff: 0,
      morador: 0,
    };

    usuarios.forEach((u) => {
      if (contadores[u.perfil] !== undefined) {
        contadores[u.perfil]++;
      }
    });

    return contadores;
  }, [usuarios]);

  const contadoresUnidade = useMemo(() => {
    const comUnidade = usuarios.filter((u) => u.unidades && u.unidades.length > 0).length;
    const semUnidade = usuarios.length - comUnidade;
    const comMultiplas = usuarios.filter((u) => u.unidades && u.unidades.length > 1).length;
    return {
      todos: usuarios.length,
      com: comUnidade,
      sem: semUnidade,
      multiplas: comMultiplas,
    };
  }, [usuarios]);

  // Filtra usuários baseado na busca e filtros
  const usuariosFiltrados = useMemo(() => {
    let filtrados = usuarios;

    // Filtro por busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      filtrados = filtrados.filter(
        (usuario) =>
          usuario.nome.toLowerCase().includes(termoBusca) ||
          usuario.email.toLowerCase().includes(termoBusca) ||
          usuario.telefone?.toLowerCase().includes(termoBusca) ||
          usuario.perfil.toLowerCase().includes(termoBusca) ||
          usuario.unidades?.some(u => u.numero.toLowerCase().includes(termoBusca))
      );
    }

    // Filtro por perfil
    if (filtroPerfil !== 'todos') {
      filtrados = filtrados.filter((u) => u.perfil === filtroPerfil);
    }

    // Filtro por unidade
    if (filtroUnidade === 'com') {
      filtrados = filtrados.filter((u) => u.unidades && u.unidades.length > 0);
    } else if (filtroUnidade === 'sem') {
      filtrados = filtrados.filter((u) => !u.unidades || u.unidades.length === 0);
    } else if (filtroUnidade === 'multiplas') {
      filtrados = filtrados.filter((u) => u.unidades && u.unidades.length > 1);
    }

    return filtrados;
  }, [usuarios, busca, filtroPerfil, filtroUnidade]);

  // Paginação
  const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);
  const usuariosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return usuariosFiltrados.slice(start, end);
  }, [usuariosFiltrados, currentPage, itemsPerPage]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroPerfil, filtroUnidade]);

  const handleDeletar = async (usuarioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    setUsuarioParaDeletar(usuarioId);
    setDeletando(true);
    try {
      const response = await fetch(`/api/usuarios/${usuarioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir usuário');
      }

      // Recarrega a página para atualizar a lista
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir usuário');
      setDeletando(false);
      setUsuarioParaDeletar(null);
    }
  };

  return (
    <div>
      {/* Campo de busca */}
      <div className="mb-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, email, telefone, perfil ou unidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>
        {(busca || filtroPerfil !== 'todos' || filtroUnidade !== 'todos') && (
          <p className="mt-2 text-sm text-gray-500">
            {usuariosFiltrados.length} usuário{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="mb-4 space-y-3">
        <QuickFilters
          filters={[
            { value: 'todos', label: 'Todos', count: contadoresPerfil.todos },
            { value: 'staff', label: 'Staff', count: contadoresPerfil.staff },
            { value: 'morador', label: 'Morador', count: contadoresPerfil.morador },
          ]}
          selectedFilter={filtroPerfil}
          onFilterChange={setFiltroPerfil}
          label="Perfil"
        />
        <QuickFilters
          filters={[
            { value: 'todos', label: 'Todos', count: contadoresUnidade.todos },
            { value: 'com', label: 'Com Unidade', count: contadoresUnidade.com },
            { value: 'sem', label: 'Sem Unidade', count: contadoresUnidade.sem },
            { value: 'multiplas', label: 'Com Múltiplas Unidades', count: contadoresUnidade.multiplas },
          ]}
          selectedFilter={filtroUnidade}
          onFilterChange={setFiltroUnidade}
          label="Unidade"
        />
      </div>

      {/* Tabela de usuários */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle sm:px-0">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Nome
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Telefone
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Perfil
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Tipo/Status
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Unidades
              </th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500">
                  {busca ? 'Nenhum usuário encontrado com os critérios de busca.' : 'Nenhum usuário cadastrado.'}
                </td>
              </tr>
            ) : (
              usuariosPaginados.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                    <div>
                      <div className="font-medium">{usuario.nome}</div>
                      <div className="sm:hidden text-xs text-gray-500 mt-1">{usuario.email}</div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {usuario.email}
                  </td>
                  <td className="hidden md:table-cell whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {usuario.telefone || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                        {usuario.perfil}
                      </span>
                      {usuario.conselheiro && (
                        <span className="inline-flex rounded-full bg-purple-100 px-2 text-xs font-semibold leading-5 text-purple-800">
                          Conselheiro
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                      {usuario.tipoUsuario && (
                        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-medium text-green-800">
                          {usuario.tipoUsuario === 'proprietario' ? 'Proprietário' : 'Inquilino'}
                        </span>
                      )}
                      {usuario.procuracaoAtiva && (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-medium text-yellow-800">
                          Procuração Ativa
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-500">
                    {usuario.unidades && usuario.unidades.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {usuario.unidades.map((unidade) => (
                          <span
                            key={unidade.id}
                            className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                          >
                            {unidade.numero}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/usuarios/${usuario.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </Link>
                      {canDelete && usuario.id !== currentUserId && (
                        <button
                          onClick={() => handleDeletar(usuario.id)}
                          disabled={deletando}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletando && usuarioParaDeletar === usuario.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </div>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={usuariosFiltrados.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}

