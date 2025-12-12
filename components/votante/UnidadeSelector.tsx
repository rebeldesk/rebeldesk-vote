/**
 * Componente para selecionar unidade ao votar.
 * 
 * Usado quando o usuário tem múltiplas unidades e precisa escolher
 * qual unidade usar para votar.
 */

'use client';

import { useState } from 'react';
import type { Unidade } from '@/types';

interface UnidadeSelectorProps {
  unidades: Unidade[];
  unidadesJaVotaram: string[]; // IDs das unidades que já votaram
  onSelect: (unidadeId: string) => void;
  votacaoPermiteAlterar: boolean;
}

export function UnidadeSelector({
  unidades,
  unidadesJaVotaram,
  onSelect,
  votacaoPermiteAlterar,
}: UnidadeSelectorProps) {
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>(
    unidades.length > 0 ? unidades[0].id : ''
  );

  const handleSelect = (unidadeId: string) => {
    setSelectedUnidadeId(unidadeId);
    onSelect(unidadeId);
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Selecione a unidade para votar:
      </label>
      <div className="space-y-2">
        {unidades.map((unidade) => {
          const jaVotou = unidadesJaVotaram.includes(unidade.id);
          const isSelected = selectedUnidadeId === unidade.id;

          return (
            <label
              key={unidade.id}
              className={`flex cursor-pointer items-center rounded-lg border-2 p-3 transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${jaVotou && !votacaoPermiteAlterar ? 'opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="unidade"
                value={unidade.id}
                checked={isSelected}
                onChange={() => handleSelect(unidade.id)}
                disabled={jaVotou && !votacaoPermiteAlterar}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    Unidade {unidade.numero}
                  </span>
                  {jaVotou && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      {votacaoPermiteAlterar ? '✓ Votou (pode alterar)' : '✓ Já votou'}
                    </span>
                  )}
                </div>
                {jaVotou && !votacaoPermiteAlterar && (
                  <p className="mt-1 text-xs text-gray-500">
                    Esta unidade já votou e a alteração não é permitida
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {unidades.length === 0 && (
        <p className="text-sm text-yellow-600">
          Você não possui unidades vinculadas. Entre em contato com o administrador.
        </p>
      )}
    </div>
  );
}
