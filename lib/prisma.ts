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
  pool: Pool | undefined;
};

/**
 * Cliente Prisma singleton.
 * 
 * Em desenvolvimento, cria nova instância a cada hot reload.
 * Em produção, reutiliza a instância global.
 * 
 * NOTA: Prisma 7 requer um adapter PostgreSQL para conexão direta.
 * Para Supabase, recomendamos usar connection pooling (porta 6543).
 */
// Singleton do Pool para evitar múltiplas instâncias
// IMPORTANTE: Para Supabase, use Transaction Pooler (porta 6543) em produção
// Formato: postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
// Transaction Pooler é recomendado para Prisma + Next.js (serverless)
const getPool = () => {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  // Reutiliza pool existente se disponível
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Limite de conexões no pool
    min: 0, // Não mantém conexões mínimas
    idleTimeoutMillis: 20000, // Fecha conexões ociosas após 20s
    connectionTimeoutMillis: 5000, // Timeout de conexão de 5s
    // Configurações adicionais para Supabase
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  // Armazena o pool globalmente para reutilização
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool;
  }

  return pool;
};

const pool = getPool();
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

