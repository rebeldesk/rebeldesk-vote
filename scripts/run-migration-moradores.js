/**
 * Script para executar a migration de moradores.
 * 
 * Uso: node scripts/run-migration-moradores.js
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

  const migrationPath = path.join(__dirname, '../supabase/migrations/009_add_moradores.sql');
  
  if (!existsSync(migrationPath)) {
    console.error(`❌ Erro: Arquivo de migration não encontrado: ${migrationPath}`);
    process.exit(1);
  }

  const sql = readFileSync(migrationPath, 'utf-8');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('📦 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso');

    console.log('🔄 Executando migration...');
    
    // Verifica se a tabela já existe
    const checkTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'moradores';
    `);
    
    if (checkTable.rows.length > 0) {
      console.log('⚠️  A tabela moradores já existe no banco de dados');
      console.log('   A migration já foi executada anteriormente.');
    } else {
      await client.query(sql);
      console.log('✅ Migration executada com sucesso!');
      console.log('   Tabela moradores criada');
    }

    // Verifica se a tabela foi criada
    try {
      const checkQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'moradores';
      `;
      const result = await client.query(checkQuery);

      if (result.rows.length > 0) {
        console.log('\n📊 Verificação:');
        console.log(`   Tabela: ${result.rows[0].table_name}`);
      }
    } catch (checkError) {
      console.log('\n⚠️  Não foi possível verificar a tabela (mas a migration foi executada)');
    }

    // Fecha conexão de forma segura
    try {
      await client.end();
    } catch (endError) {
      // Ignora erros ao fechar conexão se a migration já foi executada
    }
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  A tabela moradores já existe no banco de dados');
      console.log('   A migration já foi executada anteriormente.');
    } else {
      console.error('\n💡 Dica: Verifique se:');
      console.error('   - A conexão com o banco está correta');
      console.error('   - Você tem permissões para alterar o banco');
      console.error('   - A tabela unidades existe');
    }
    
    // Fecha conexão de forma segura mesmo em caso de erro
    try {
      await client.end();
    } catch (endError) {
      // Ignora erros ao fechar conexão
    }
    process.exit(1);
  }
}

runMigration();
