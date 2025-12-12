/**
 * Script para executar a migration de forçar troca de senha.
 * 
 * Uso: node scripts/run-migration-forcar-troca-senha.js
 */

const { readFileSync, existsSync } = require('fs');
const { Client } = require('pg');
const path = require('path');

// Carrega variáveis de ambiente do .env.local se existir
const envPath = path.join(__dirname, '../.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Erro: DATABASE_URL não encontrada nas variáveis de ambiente');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('📦 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/005_add_forcar_troca_senha.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Executando migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executada com sucesso!\n');

    await client.end();
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    await client.end();
    process.exit(1);
  }
}

runMigration();
