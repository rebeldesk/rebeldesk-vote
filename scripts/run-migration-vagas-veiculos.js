/**
 * Script para executar a migration de vagas e veículos.
 * 
 * Executa o arquivo supabase/migrations/007_add_vagas_veiculos.sql
 */

const { Client } = require('pg');
const { readFileSync } = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrada nas variáveis de ambiente');
    console.error('   Certifique-se de ter um arquivo .env.local com DATABASE_URL configurada');
    process.exit(1);
  }

  try {
    console.log('📦 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso');

    console.log('📄 Lendo arquivo de migration...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/007_add_vagas_veiculos.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Executando migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration executada com sucesso!');
    console.log('   Tabelas vagas e veiculos criadas');

    // Verifica se as tabelas foram criadas
    const checkQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('vagas', 'veiculos')
      ORDER BY table_name;
    `;
    const result = await client.query(checkQuery);

    if (result.rows.length > 0) {
      console.log('\n📊 Verificação:');
      result.rows.forEach((row) => {
        console.log(`   ✅ Tabela ${row.table_name} criada`);
      });
    }

    // Verifica se o enum foi criado
    const enumQuery = `
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'tipo_veiculo';
    `;
    const enumResult = await client.query(enumQuery);

    if (enumResult.rows.length > 0) {
      console.log(`   ✅ Enum tipo_veiculo criado`);
    }

    await client.end();
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Algumas tabelas/objetos já existem no banco de dados');
      console.log('   A migration pode ter sido executada parcialmente anteriormente.');
    } else {
      console.error('\n💡 Dica: Verifique se:');
      console.error('   - A conexão com o banco está correta');
      console.error('   - Você tem permissões para criar tabelas');
      console.error('   - As migrations anteriores foram executadas');
    }
    
    await client.end();
    process.exit(1);
  }
}

runMigration();
