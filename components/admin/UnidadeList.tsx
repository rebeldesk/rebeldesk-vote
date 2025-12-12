/**
 * Componente de listagem de unidades com busca.
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { QuickFilters } from '@/components/ui/QuickFilters';

interface Unidade {
  id: string;
  numero: string;
  total_usuarios: number;
  created_at: string;
  updated_at: string;
}

interface UnidadeListProps {
  unidades: Unidade[];
  canDelete?: boolean; // Apenas staff pode deletar
}

export function UnidadeList({ unidades, canDelete = false }: UnidadeListProps) {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [filtroUsuarios, setFiltroUsuarios] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [unidadeParaDeletar, setUnidadeParaDeletar] = useState<string | null>(null);
  const [deletando, setDeletando] = useState(false);

  // Conta unidades por filtro
  const contadores = useMemo(() => {
    const comUsuarios = unidades.filter((u) => u.total_usuarios > 0).length;
    const semUsuarios = unidades.length - comUsuarios;
    return {
      todos: unidades.length,
      com: comUsuarios,
      sem: semUsuarios,
    };
  }, [unidades]);

  // Filtra unidades baseado na busca e filtros
  const unidadesFiltradas = useMemo(() => {
    let filtradas = unidades;

    // Filtro por busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      filtradas = filtradas.filter(
        (unidade) =>
          unidade.numero.toLowerCase().includes(termoBusca) ||
          unidade.total_usuarios.toString().includes(termoBusca)
      );
    }

    // Filtro por usuários
    if (filtroUsuarios === 'com') {
      filtradas = filtradas.filter((u) => u.total_usuarios > 0);
    } else if (filtroUsuarios === 'sem') {
      filtradas = filtradas.filter((u) => u.total_usuarios === 0);
    }

    return filtradas;
  }, [unidades, busca, filtroUsuarios]);

  // Paginação
  const totalPages = Math.ceil(unidadesFiltradas.length / itemsPerPage);
  const unidadesPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return unidadesFiltradas.slice(start, end);
  }, [unidadesFiltradas, currentPage, itemsPerPage]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [busca, filtroUsuarios]);

  const handleDeletar = async (unidadeId: string, numeroUnidade: string, totalUsuarios: number) => {
    let mensagem = `Tem certeza que deseja excluir a unidade "${numeroUnidade}"?`;
    if (totalUsuarios > 0) {
      mensagem += `\n\nEsta unidade possui ${totalUsuarios} usuário${totalUsuarios !== 1 ? 's' : ''} vinculado${totalUsuarios !== 1 ? 's' : ''}. Os relacionamentos serão removidos automaticamente.`;
    }
    mensagem += '\n\nEsta ação não pode ser desfeita.';

    if (!confirm(mensagem)) {
      return;
    }

    setUnidadeParaDeletar(unidadeId);
    setDeletando(true);
    try {
      const response = await fetch(`/api/unidades/${unidadeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir unidade');
      }

      // Recarrega a página para atualizar a lista
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir unidade');
      setDeletando(false);
      setUnidadeParaDeletar(null);
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
            placeholder="Buscar por número ou total de usuários..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>
        {(busca || filtroUsuarios !== 'todos') && (
          <p className="mt-2 text-sm text-gray-500">
            {unidadesFiltradas.length} unidade{unidadesFiltradas.length !== 1 ? 's' : ''} encontrada{unidadesFiltradas.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filtros rápidos */}
      <QuickFilters
        filters={[
          { value: 'todos', label: 'Todas', count: contadores.todos },
          { value: 'com', label: 'Com Usuários', count: contadores.com },
          { value: 'sem', label: 'Sem Usuários', count: contadores.sem },
        ]}
        selectedFilter={filtroUsuarios}
        onFilterChange={setFiltroUsuarios}
        label="Filtros"
      />

      {/* Tabela */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Número
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Total de Usuários
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Data de Cadastro
              </th>
              {canDelete && (
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {unidadesPaginadas.length > 0 ? (
              unidadesPaginadas.map((unidade) => (
                <tr key={unidade.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <Link
                      href={`/unidades/${unidade.id}`}
                      className="text-blue-600 hover:text-blue-900 hover:underline cursor-pointer"
                    >
                      {unidade.numero}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {unidade.total_usuarios}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(unidade.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  {canDelete && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeletar(unidade.id, unidade.numero, unidade.total_usuarios)}
                        disabled={deletando}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletando && unidadeParaDeletar === unidade.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canDelete ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                  {busca ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade cadastrada'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={unidadesFiltradas.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
