/**
 * Componente de listagem de unidades com busca.
 */

'use client';

import { useState, useMemo } from 'react';

interface Unidade {
  id: string;
  numero: string;
  total_usuarios: number;
  created_at: string;
  updated_at: string;
}

interface UnidadeListProps {
  unidades: Unidade[];
}

export function UnidadeList({ unidades }: UnidadeListProps) {
  const [busca, setBusca] = useState('');

  // Filtra unidades baseado na busca
  const unidadesFiltradas = useMemo(() => {
    if (!busca.trim()) {
      return unidades;
    }

    const termoBusca = busca.toLowerCase();
    return unidades.filter((unidade) =>
      unidade.numero.toLowerCase().includes(termoBusca) ||
      unidade.total_usuarios.toString().includes(termoBusca)
    );
  }, [unidades, busca]);

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
        {busca && (
          <p className="mt-2 text-sm text-gray-500">
            {unidadesFiltradas.length} unidade{unidadesFiltradas.length !== 1 ? 's' : ''} encontrada{unidadesFiltradas.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {unidadesFiltradas.length > 0 ? (
              unidadesFiltradas.map((unidade) => (
                <tr key={unidade.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {unidade.numero}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {unidade.total_usuarios}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(unidade.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  {busca ? 'Nenhuma unidade encontrada' : 'Nenhuma unidade cadastrada'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
