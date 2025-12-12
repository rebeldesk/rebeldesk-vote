/**
 * Utilitários para hash e verificação de senhas.
 * 
 * Este arquivo contém apenas funções relacionadas a senhas,
 * sem dependências do Prisma, permitindo uso no Edge Runtime.
 */

import bcrypt from 'bcryptjs';

/**
 * Hash de senha usando bcrypt.
 * 
 * @param senha - Senha em texto plano
 * @returns Hash da senha
 */
export async function hashSenha(senha: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senha, salt);
}

/**
 * Verifica se a senha corresponde ao hash.
 * 
 * @param senha - Senha em texto plano
 * @param hash - Hash armazenado
 * @returns true se a senha corresponder
 */
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

