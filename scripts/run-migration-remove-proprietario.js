/**
 * Script para executar a migration que remove 'Proprietario' do enum grau_parentesco
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não encontrada no arquivo .env.local');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '010_remove_proprietario_from_grau_parentesco.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo de migration não encontrado: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Executando migration...');

    await client.query(sql);

    console.log('✅ Migration executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (err) {
      // Ignora erros ao fechar conexão
    }
  }
}

runMigration();
