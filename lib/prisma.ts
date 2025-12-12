/**
 * Cliente Prisma para acesso ao banco de dados.
 * 
 * Este arquivo exporta uma instância singleton do Prisma Client
 * para uso em toda a aplicação.
 * 
 * IMPORTANTE: Em desenvolvimento, o Prisma Client é recriado a cada hot reload.
 * Em produção, use uma única instância para melhor performance.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Cliente Prisma singleton.
 * 
 * Em desenvolvimento, cria nova instância a cada hot reload.
 * Em produção, reutiliza a instância global.
 * 
 * NOTA: Prisma 7 requer um adapter PostgreSQL para conexão direta.
 * Para Supabase, recomendamos usar connection pooling.
 */
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10, // Limite de conexões no pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Configurações adicionais para Supabase
      ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
    })
  : undefined;

const adapter = pool ? new PrismaPg(pool) : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

