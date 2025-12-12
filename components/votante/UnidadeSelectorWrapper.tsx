/**
 * Wrapper client-side para o seletor de unidade.
 * 
 * Gerencia o estado da unidade selecionada e renderiza
 * o VotingCard com a unidade correta.
 */

'use client';

import { useState, useEffect } from 'react';
import { UnidadeSelector } from './UnidadeSelector';
import { VotingCard } from './VotingCard';
import type { Votacao, OpcaoVotacao, Unidade, Voto } from '@/types';

interface UnidadeSelectorWrapperProps {
  unidades: Unidade[];
  unidadesJaVotaram: string[];
  votacao: Votacao;
  opcoes: OpcaoVotacao[];
  votosPorUnidade: Record<string, Voto | null>;
}

export function UnidadeSelectorWrapper({
  unidades,
  unidadesJaVotaram,
  votacao,
  opcoes,
  votosPorUnidade,
}: UnidadeSelectorWrapperProps) {
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string>(
    unidades.length > 0 ? unidades[0].id : ''
  );

  // Determina opções votadas para a unidade selecionada
  const votoUnidade = selectedUnidadeId ? votosPorUnidade[selectedUnidadeId] : null;
  const opcoesVotadas: string[] = [];
  
  if (votoUnidade) {
    if (votacao.tipo === 'escolha_unica' && votoUnidade.opcao_id) {
      opcoesVotadas.push(votoUnidade.opcao_id);
    } else if (votacao.tipo === 'multipla_escolha' && votoUnidade.opcoes_ids) {
      opcoesVotadas.push(...votoUnidade.opcoes_ids);
    }
  }

  const jaVotou = selectedUnidadeId ? unidadesJaVotaram.includes(selectedUnidadeId) : false;

  return (
    <>
      <UnidadeSelector
        unidades={unidades}
        unidadesJaVotaram={unidadesJaVotaram}
        onSelect={setSelectedUnidadeId}
        votacaoPermiteAlterar={votacao.permitir_alterar_voto}
      />
      {selectedUnidadeId && (
        <VotingCard
          votacao={votacao}
          opcoes={opcoes}
          opcoesVotadas={opcoesVotadas}
          jaVotou={jaVotou && votacao.permitir_alterar_voto}
          unidadeId={selectedUnidadeId}
        />
      )}
    </>
  );
}
