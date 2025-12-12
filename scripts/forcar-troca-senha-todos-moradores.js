/**
 * Script para marcar todos os usuários moradores para forçar troca de senha.
 * 
 * Atualiza o campo forcar_troca_senha para true em todos os usuários
 * com perfil "morador".
 * 
 * Uso:
 *   node scripts/forcar-troca-senha-todos-moradores.js
 * 
 * Requer: DATABASE_URL no .env.local
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

async function forcarTrocaSenhaMoradores() {
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

    // Conta quantos moradores existem
    const countResult = await client.query(
      "SELECT COUNT(*) as total FROM users WHERE perfil = 'morador'"
    );
    const totalMoradores = parseInt(countResult.rows[0].total, 10);

    if (totalMoradores === 0) {
      console.log('⚠️  Nenhum usuário com perfil "morador" encontrado.');
      await client.end();
      return;
    }

    console.log(`📊 Encontrados ${totalMoradores} usuário(s) com perfil "morador"\n`);

    // Atualiza todos os moradores
    console.log('🔄 Marcando todos os moradores para forçar troca de senha...');
    const updateResult = await client.query(`
      UPDATE users 
      SET forcar_troca_senha = true,
          updated_at = NOW()
      WHERE perfil = 'morador'
      RETURNING id, email, nome
    `);

    const atualizados = updateResult.rows.length;

    console.log(`✅ ${atualizados} usuário(s) atualizado(s) com sucesso!\n`);

    // Mostra alguns exemplos
    if (atualizados > 0 && atualizados <= 10) {
      console.log('📋 Usuários atualizados:');
      updateResult.rows.forEach((usuario, index) => {
        console.log(`   ${index + 1}. ${usuario.nome} (${usuario.email})`);
      });
    } else if (atualizados > 10) {
      console.log('📋 Primeiros 10 usuários atualizados:');
      updateResult.rows.slice(0, 10).forEach((usuario, index) => {
        console.log(`   ${index + 1}. ${usuario.nome} (${usuario.email})`);
      });
      console.log(`   ... e mais ${atualizados - 10} usuário(s)`);
    }

    await client.end();
    console.log('\n✅ Processo concluído com sucesso!');
    console.log('\n💡 Todos os moradores precisarão alterar a senha no próximo login.');
  } catch (error) {
    console.error('❌ Erro ao atualizar usuários:', error);
    await client.end();
    process.exit(1);
  }
}

// Executa o script
forcarTrocaSenhaMoradores();
