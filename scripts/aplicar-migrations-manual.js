/**
 * Script para aplicar manualmente os campos que podem estar faltando
 * Use apenas se as migrations não foram aplicadas corretamente
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function aplicarCampos() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.MIGRATE_DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('🔧 Aplicando campos manualmente...\n');

    // Verifica se tipo_usuario enum existe
    const enumCheck = await pool.query(`
      SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario';
    `);

    if (enumCheck.rows.length === 0) {
      console.log('📝 Criando enum tipo_usuario...');
      await pool.query(`
        CREATE TYPE tipo_usuario AS ENUM ('proprietario', 'inquilino');
      `);
      console.log('✅ Enum tipo_usuario criado');
    } else {
      console.log('✅ Enum tipo_usuario já existe');
    }

    // Verifica e adiciona campo conselheiro
    const conselheiroCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'conselheiro';
    `);

    if (conselheiroCheck.rows.length === 0) {
      console.log('📝 Adicionando campo conselheiro...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN conselheiro BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✅ Campo conselheiro adicionado');
    } else {
      console.log('✅ Campo conselheiro já existe');
    }

    // Verifica e adiciona campo tipo_usuario
    const tipoCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'tipo_usuario';
    `);

    if (tipoCheck.rows.length === 0) {
      console.log('📝 Adicionando campo tipo_usuario...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN tipo_usuario tipo_usuario;
      `);
      console.log('✅ Campo tipo_usuario adicionado');
    } else {
      console.log('✅ Campo tipo_usuario já existe');
    }

    // Verifica e adiciona campo procuracao_ativa
    const procCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'procuracao_ativa';
    `);

    if (procCheck.rows.length === 0) {
      console.log('📝 Adicionando campo procuracao_ativa...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN procuracao_ativa BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✅ Campo procuracao_ativa adicionado');
    } else {
      console.log('✅ Campo procuracao_ativa já existe');
    }

    // Define tipoUsuario para usuários moradores existentes
    console.log('\n📝 Definindo tipoUsuario para usuários moradores existentes...');
    await pool.query(`
      UPDATE users 
      SET tipo_usuario = 'proprietario'::tipo_usuario
      WHERE perfil = 'morador'::perfil_usuario 
      AND tipo_usuario IS NULL;
    `);
    console.log('✅ tipoUsuario definido para usuários moradores');

    // Verifica e adiciona campo procuracao_ativa na tabela unidades
    const unidadesProcCheck = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'unidades' AND column_name = 'procuracao_ativa';
    `);

    if (unidadesProcCheck.rows.length === 0) {
      console.log('📝 Adicionando campo procuracao_ativa na tabela unidades...');
      await pool.query(`
        ALTER TABLE unidades 
        ADD COLUMN procuracao_ativa BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✅ Campo procuracao_ativa adicionado na tabela unidades');
    } else {
      console.log('✅ Campo procuracao_ativa já existe na tabela unidades');
    }

    console.log('\n✅ Todos os campos foram aplicados com sucesso!');
    console.log('🔄 Agora execute: npm run fix:prisma');

  } catch (error) {
    console.error('❌ Erro ao aplicar campos:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

aplicarCampos();
