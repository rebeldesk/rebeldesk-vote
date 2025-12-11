/**
 * Rota de API do NextAuth.
 * 
 * Esta rota gerencia todas as requisições de autenticação
 * (login, logout, callback, etc.)
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

