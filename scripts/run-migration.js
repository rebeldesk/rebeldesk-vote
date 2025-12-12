/**
 * Script para executar a migration 002_add_mostrar_parcial.sql
 * 
 * Uso:
 *   node scripts/run-migration.js
 * 
 * Requer: DATABASE_URL no .env.local ou variável de ambiente
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
    console.error('   Certifique-se de ter um arquivo .env.local com DATABASE_URL configurada');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('📦 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso');

    console.log('📄 Lendo arquivo de migration...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/002_add_mostrar_parcial.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Executando migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration executada com sucesso!');
    console.log('   Campo mostrar_parcial adicionado à tabela votacoes');

    // Verifica se a coluna foi criada
    const checkQuery = `
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'votacoes' AND column_name = 'mostrar_parcial';
    `;
    const result = await client.query(checkQuery);

    if (result.rows.length > 0) {
      console.log('\n📊 Verificação:');
      console.log(`   Coluna: ${result.rows[0].column_name}`);
      console.log(`   Tipo: ${result.rows[0].data_type}`);
      console.log(`   Default: ${result.rows[0].column_default}`);
    }

    await client.end();
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  A coluna mostrar_parcial já existe na tabela votacoes');
      console.log('   A migration já foi executada anteriormente.');
    } else {
      console.error('\n💡 Dica: Verifique se:');
      console.error('   - A conexão com o banco está correta');
      console.error('   - Você tem permissões para alterar a tabela');
      console.error('   - A tabela votacoes existe');
    }
    
    await client.end();
    process.exit(1);
  }
}

runMigration();
