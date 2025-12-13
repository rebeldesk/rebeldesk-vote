/**
 * Script para verificar se os novos campos foram criados no banco de dados
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verificarCampos() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.MIGRATE_DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('🔍 Verificando campos na tabela users...\n');

    // Verifica colunas na tabela users
    const colunasResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('conselheiro', 'tipo_usuario', 'procuracao_ativa')
      ORDER BY column_name;
    `);

    console.log('📋 Campos encontrados na tabela users:');
    if (colunasResult.rows.length === 0) {
      console.log('❌ NENHUM dos novos campos foi encontrado!');
      console.log('   Isso significa que as migrations não foram aplicadas corretamente.\n');
    } else {
      colunasResult.rows.forEach(col => {
        console.log(`   ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Verifica enum tipo_usuario
    console.log('\n🔍 Verificando enum tipo_usuario...');
    const enumResult = await pool.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'tipo_usuario'
      ORDER BY e.enumsortorder;
    `);

    if (enumResult.rows.length === 0) {
      console.log('❌ Enum tipo_usuario não foi encontrado!');
    } else {
      console.log('✅ Enum tipo_usuario encontrado com valores:');
      enumResult.rows.forEach(row => {
        console.log(`   - ${row.enumlabel}`);
      });
    }

    // Verifica enum perfil_usuario
    console.log('\n🔍 Verificando enum perfil_usuario...');
    const perfilEnumResult = await pool.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'perfil_usuario'
      ORDER BY e.enumsortorder;
    `);

    if (perfilEnumResult.rows.length === 0) {
      console.log('❌ Enum perfil_usuario não foi encontrado!');
    } else {
      console.log('✅ Enum perfil_usuario encontrado com valores:');
      perfilEnumResult.rows.forEach(row => {
        console.log(`   - ${row.enumlabel}`);
      });
    }

    // Verifica campo procuracao_ativa na tabela unidades
    console.log('\n🔍 Verificando campo procuracao_ativa na tabela unidades...');
    const unidadesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'unidades'
      AND column_name = 'procuracao_ativa';
    `);

    if (unidadesResult.rows.length === 0) {
      console.log('❌ Campo procuracao_ativa não foi encontrado na tabela unidades!');
    } else {
      console.log('✅ Campo procuracao_ativa encontrado na tabela unidades');
      unidadesResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Verifica alguns usuários para ver se têm tipoUsuario definido
    console.log('\n🔍 Verificando usuários existentes...');
    const usuariosResult = await pool.query(`
      SELECT 
        id,
        email,
        nome,
        perfil,
        conselheiro,
        tipo_usuario,
        procuracao_ativa
      FROM users
      LIMIT 5;
    `);

    if (usuariosResult.rows.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no banco');
    } else {
      console.log(`✅ Encontrados ${usuariosResult.rows.length} usuários (mostrando primeiros 5):`);
      usuariosResult.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.nome}):`);
        console.log(`     perfil: ${user.perfil}`);
        console.log(`     conselheiro: ${user.conselheiro}`);
        console.log(`     tipo_usuario: ${user.tipo_usuario || 'NULL'}`);
        console.log(`     procuracao_ativa: ${user.procuracao_ativa}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar campos:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

verificarCampos();
