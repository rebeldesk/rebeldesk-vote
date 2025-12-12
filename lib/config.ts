/**
 * Configurações gerais da aplicação.
 * 
 * Centraliza configurações que podem ser ajustadas via variáveis de ambiente
 * ou valores padrão.
 */

/**
 * Número do WhatsApp para suporte.
 * 
 * Formato esperado: código do país + DDD + número (ex: 5511999999999)
 * Sem espaços, parênteses, hífens ou outros caracteres especiais.
 * 
 * Configure via variável de ambiente NEXT_PUBLIC_WHATSAPP_NUMBER
 * ou ajuste o valor padrão abaixo.
 */
export const WHATSAPP_SUPPORT_NUMBER = 
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999';

/**
 * Mensagem padrão para contato via WhatsApp.
 * 
 * Inclui informações úteis para facilitar o atendimento.
 */
export const WHATSAPP_SUPPORT_MESSAGE = 
  'Olá! Preciso de ajuda com o sistema de votação condominial.\n\n' +
  'Estou com problemas para fazer login. Poderia me ajudar?\n\n' +
  'Obrigado pela atenção!';

/**
 * Gera o link do WhatsApp com mensagem pré-formatada.
 */
export function getWhatsAppSupportLink(): string {
  const message = encodeURIComponent(WHATSAPP_SUPPORT_MESSAGE);
  return `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${message}`;
}
