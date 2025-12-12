/**
 * Utilitários para integração WhatsApp.
 * 
 * Funções auxiliares para normalização de telefone,
 * formatação de mensagens e criação de botões interativos.
 */

import type { Votacao, OpcaoVotacao } from '@/types';

/**
 * Normaliza um número de telefone removendo caracteres não numéricos.
 * 
 * @param telefone - Número de telefone em qualquer formato
 * @returns Telefone normalizado (apenas dígitos)
 * 
 * @example
 * normalizarTelefone("(11) 98765-4321") // "11987654321"
 * normalizarTelefone("+55 11 98765-4321") // "5511987654321"
 */
export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, '');
}

/**
 * Formata um número de telefone para exibição.
 * 
 * @param telefone - Número de telefone normalizado
 * @returns Telefone formatado
 * 
 * @example
 * formatarTelefoneExibicao("11987654321") // "(11) 98765-4321"
 */
export function formatarTelefoneExibicao(telefone: string): string {
  const normalizado = normalizarTelefone(telefone);
  
  // Se tiver código do país (55), remove
  let numero = normalizado;
  if (normalizado.startsWith('55') && normalizado.length > 10) {
    numero = normalizado.substring(2);
  }
  
  // Formata como (XX) XXXXX-XXXX
  if (numero.length === 11) {
    return `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
  } else if (numero.length === 10) {
    return `(${numero.substring(0, 2)}) ${numero.substring(2, 6)}-${numero.substring(6)}`;
  }
  
  return telefone; // Retorna original se não conseguir formatar
}

/**
 * Formata uma votação para exibição em mensagem WhatsApp.
 * 
 * @param votacao - Votação a ser formatada
 * @param opcoes - Opções da votação
 * @returns Texto formatado da votação
 */
export function formatarVotacao(
  votacao: Votacao,
  opcoes: OpcaoVotacao[]
): string {
  const emojiStatus = votacao.status === 'aberta' ? '🟢' : '🔴';
  const statusTexto = votacao.status === 'aberta' ? 'Aberta' : 'Encerrada';
  
  let texto = `*${votacao.titulo}*\n\n`;
  
  if (votacao.descricao) {
    texto += `${votacao.descricao}\n\n`;
  }
  
  texto += `${emojiStatus} Status: ${statusTexto}\n`;
  texto += `📅 Início: ${formatarData(votacao.data_inicio)}\n`;
  texto += `📅 Fim: ${formatarData(votacao.data_fim)}\n`;
  texto += `📊 Tipo: ${votacao.tipo === 'escolha_unica' ? 'Escolha Única' : 'Múltipla Escolha'}\n\n`;
  
  if (opcoes.length > 0) {
    texto += `*Opções:*\n`;
    opcoes.forEach((opcao, index) => {
      texto += `${index + 1}. ${opcao.texto}\n`;
    });
  }
  
  return texto;
}

/**
 * Formata uma lista de votações para exibição.
 * 
 * @param votacoes - Lista de votações com opções
 * @returns Texto formatado
 */
export function formatarListaVotacoes(
  votacoes: Array<{ votacao: Votacao; opcoes: OpcaoVotacao[]; jaVotou?: boolean }>
): string {
  if (votacoes.length === 0) {
    return '📭 Não há votações disponíveis no momento.';
  }
  
  let texto = `*📊 Votações Disponíveis*\n\n`;
  
  votacoes.forEach((item, index) => {
    const emoji = item.jaVotou ? '✅' : '🆕';
    const status = item.jaVotou ? ' (Já votou)' : '';
    texto += `${emoji} *${index + 1}. ${item.votacao.titulo}*${status}\n`;
    texto += `   📅 Até: ${formatarData(item.votacao.data_fim)}\n\n`;
  });
  
  return texto;
}

/**
 * Formata uma data para exibição.
 * 
 * @param dataISO - Data em formato ISO string
 * @returns Data formatada
 */
export function formatarData(dataISO: string): string {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Cria estrutura de botões para Evolution API.
 * 
 * @param botoes - Array de objetos com id e texto dos botões
 * @returns Estrutura de botões para Evolution API
 */
export function criarBotoesVotacao(
  botoes: Array<{ id: string; texto: string }>
): Array<{ buttonId: string; buttonText: { displayText: string } }> {
  return botoes.map((botao) => ({
    buttonId: botao.id,
    buttonText: {
      displayText: botao.texto,
    },
  }));
}

/**
 * Cria estrutura de lista de botões para Evolution API.
 * 
 * @param itens - Array de objetos com id, título e descrição
 * @returns Estrutura de lista para Evolution API
 */
export function criarListaBotoes(
  itens: Array<{ id: string; titulo: string; descricao?: string }>
): Array<{
  title: string;
  description?: string;
  rowId: string;
}> {
  return itens.map((item) => ({
    title: item.titulo,
    description: item.descricao,
    rowId: item.id,
  }));
}

/**
 * Valida se um número de telefone tem formato válido.
 * 
 * @param telefone - Número de telefone
 * @returns true se válido
 */
export function validarTelefone(telefone: string): boolean {
  const normalizado = normalizarTelefone(telefone);
  // Aceita números com 10 ou 11 dígitos (com ou sem código do país)
  return normalizado.length >= 10 && normalizado.length <= 15;
}

