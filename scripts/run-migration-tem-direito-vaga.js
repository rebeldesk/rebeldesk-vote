/**
 * Script para executar a migration de tem_direito_vaga.
 * 
 * Uso: node scripts/run-migration-tem-direito-vaga.js
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

  const migrationPath = path.join(__dirname, '../supabase/migrations/008_add_tem_direito_vaga.sql');
  
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
    await client.query(sql);
    console.log('✅ Migration executada com sucesso!');
    console.log('   Campo tem_direito_vaga adicionado à tabela unidades');

    // Verifica se a coluna foi criada
    try {
      const checkQuery = `
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'unidades' AND column_name = 'tem_direito_vaga';
      `;
      const result = await client.query(checkQuery);

      if (result.rows.length > 0) {
        console.log('\n📊 Verificação:');
        console.log(`   Coluna: ${result.rows[0].column_name}`);
        console.log(`   Tipo: ${result.rows[0].data_type}`);
        console.log(`   Default: ${result.rows[0].column_default}`);
      }
    } catch (checkError) {
      console.log('\n⚠️  Não foi possível verificar a coluna (mas a migration foi executada)');
    }

    try {
      await client.end();
    } catch (endError) {
      // Ignora erros ao fechar conexão se a migration já foi executada
      console.log('\n⚠️  Aviso: Erro ao fechar conexão (mas a migration foi executada com sucesso)');
    }
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  A coluna tem_direito_vaga já existe na tabela unidades');
      console.log('   A migration já foi executada anteriormente.');
    } else {
      console.error('\n💡 Dica: Verifique se:');
      console.error('   - A conexão com o banco está correta');
      console.error('   - Você tem permissões para alterar a tabela');
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
