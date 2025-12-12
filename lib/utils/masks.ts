/**
 * Utilitários para máscaras de entrada.
 * 
 * Funções para formatar valores de input em tempo real.
 */

/**
 * Aplica máscara de telefone brasileiro.
 * 
 * Formatos suportados:
 * - (11) 98765-4321 (celular)
 * - (11) 3456-7890 (fixo)
 * 
 * @param value - Valor do input
 * @returns Valor formatado
 */
export function maskTelefone(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');

  // Limita a 11 dígitos (DDD + 9 dígitos para celular)
  const limited = numbers.slice(0, 11);

  // Aplica máscara baseado no tamanho
  if (limited.length <= 2) {
    return limited.length > 0 ? `(${limited}` : '';
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  } else {
    // Celular com 9 dígitos
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
}

/**
 * Remove máscara de telefone, retornando apenas números.
 * 
 * @param value - Valor formatado
 * @returns Apenas números
 */
export function unmaskTelefone(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida formato de email básico.
 * 
 * @param email - Email a validar
 * @returns true se válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

