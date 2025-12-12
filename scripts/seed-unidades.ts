/**
 * Script para inserir 300 unidades no banco de dados.
 * 
 * Gera unidades para 2 blocos:
 * - Bloco 1: 1-101 até 1-1510 (15 andares, 10 apartamentos por andar = 150 unidades)
 * - Bloco 2: 2-101 até 2-1510 (15 andares, 10 apartamentos por andar = 150 unidades)
 * 
 * Formato: BLOCO-ANDARAPARTAMENTO
 * - 1-101 = Bloco 1, 1º andar, apartamento 01
 * - 1-1510 = Bloco 1, 15º andar, apartamento 10
 * 
 * Uso: npx tsx scripts/seed-unidades.ts
 * ou: npm run seed:unidades
 * 
 * IMPORTANTE: Certifique-se de que a variável DATABASE_URL está configurada no .env.local
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Carrega variáveis de ambiente do .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Verifica se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está configurada!');
  console.error('   Configure a variável DATABASE_URL no arquivo .env.local');
  console.error('   Exemplo: DATABASE_URL=postgresql://postgres:senha@localhost:5432/votacao_db');
  console.error('\n   Ou exporte a variável antes de executar:');
  console.error('   export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

// Cria o pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 0,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

// Cria o adapter e o Prisma Client
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

/**
 * Gera o número da unidade no formato BLOCO-ANDARAPARTAMENTO
 * 
 * @param bloco - Número do bloco (1 ou 2)
 * @param andar - Número do andar (1 a 15)
 * @param apartamento - Número do apartamento (01 a 10)
 * @returns Número da unidade formatado (ex: "1-101", "2-1510")
 */
function gerarNumeroUnidade(bloco: number, andar: number, apartamento: number): string {
  return `${bloco}-${andar}${apartamento.toString().padStart(2, '0')}`;
}

/**
 * Gera todas as unidades de um bloco
 * 
 * @param bloco - Número do bloco (1 ou 2)
 * @returns Array com números das unidades
 */
function gerarUnidadesBloco(bloco: number): string[] {
  const unidades: string[] = [];
  
  // 15 andares (1 a 15)
  for (let andar = 1; andar <= 15; andar++) {
    // 10 apartamentos por andar (01 a 10)
    for (let apartamento = 1; apartamento <= 10; apartamento++) {
      unidades.push(gerarNumeroUnidade(bloco, andar, apartamento));
    }
  }
  
  return unidades;
}

/**
 * Insere unidades no banco de dados
 */
async function inserirUnidades() {
  console.log('🚀 Iniciando inserção de unidades...\n');

  try {
    // Gera todas as unidades
    const unidadesBloco1 = gerarUnidadesBloco(1);
    const unidadesBloco2 = gerarUnidadesBloco(2);
    const todasUnidades = [...unidadesBloco1, ...unidadesBloco2];

    console.log(`📊 Total de unidades a inserir: ${todasUnidades.length}`);
    console.log(`   - Bloco 1: ${unidadesBloco1.length} unidades (${unidadesBloco1[0]} até ${unidadesBloco1[unidadesBloco1.length - 1]})`);
    console.log(`   - Bloco 2: ${unidadesBloco2.length} unidades (${unidadesBloco2[0]} até ${unidadesBloco2[unidadesBloco2.length - 1]})\n`);

    let inseridas = 0;
    let jaExistentes = 0;
    let erros = 0;

    // Insere unidades em lotes para melhor performance
    const tamanhoLote = 50;
    
    for (let i = 0; i < todasUnidades.length; i += tamanhoLote) {
      const lote = todasUnidades.slice(i, i + tamanhoLote);
      
      // Cria todas as unidades do lote
      const promises = lote.map(async (numero) => {
        try {
          await prisma.unidade.create({
            data: { numero },
          });
          inseridas++;
          return { numero, status: 'inserida' };
        } catch (error: any) {
          // Se já existe, ignora (constraint unique)
          if (error.code === 'P2002' || error.message?.includes('unique')) {
            jaExistentes++;
            return { numero, status: 'ja_existia' };
          }
          // Outros erros
          erros++;
          console.error(`❌ Erro ao inserir ${numero}:`, error.message);
          return { numero, status: 'erro' };
        }
      });

      await Promise.all(promises);
      
      // Mostra progresso
      const progresso = Math.min(i + tamanhoLote, todasUnidades.length);
      console.log(`⏳ Progresso: ${progresso}/${todasUnidades.length} unidades processadas...`);
    }

    console.log('\n✅ Inserção concluída!\n');
    console.log('📈 Estatísticas:');
    console.log(`   ✅ Inseridas: ${inseridas}`);
    console.log(`   ⚠️  Já existentes: ${jaExistentes}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📊 Total processado: ${inseridas + jaExistentes + erros}`);

  } catch (error) {
    console.error('\n❌ Erro fatal ao inserir unidades:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
inserirUnidades().catch((error) => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});
