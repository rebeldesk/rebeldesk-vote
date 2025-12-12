/**
 * Script para testar conexão com o banco de dados Supabase.
 * 
 * Execute: node scripts/test-db-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const url = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '');

if (!url) {
  console.error('❌ DATABASE_URL não encontrada no .env.local');
  process.exit(1);
}

console.log('🔍 Testando conexão com banco de dados...');
console.log('📍 Hostname:', url.match(/@([^:]+):/)?.[1] || 'não encontrado');

const pool = new Pool({
  connectionString: url,
  connectionTimeoutMillis: 10000,
  ssl: url.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

pool
  .query('SELECT NOW() as current_time, version() as pg_version')
  .then((result) => {
    console.log('✅ Conexão bem-sucedida!');
    console.log('⏰ Hora do servidor:', result.rows[0].current_time);
    console.log('📦 Versão PostgreSQL:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar:', err.message);
    console.error('📋 Código:', err.code);
    
    if (err.code === 'ENOTFOUND') {
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verifique se o projeto Supabase está ativo no dashboard');
      console.log('2. Tente usar connection pooling (porta 6543):');
      console.log('   - Acesse: Supabase Dashboard > Settings > Database');
      console.log('   - Use a connection string com "Connection pooling"');
      console.log('   - Formato: postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true');
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verifique sua conexão com a internet');
      console.log('2. Verifique se o firewall não está bloqueando a porta 5432');
      console.log('3. Tente usar connection pooling (porta 6543)');
    }
    
    pool.end();
    process.exit(1);
  });

