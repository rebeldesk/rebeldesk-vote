/**
 * Script para atualizar senhas de usuários moradores.
 * 
 * Define a senha de todos os usuários com perfil "morador" como sendo
 * o número de telefone do usuário (sem caracteres especiais).
 * 
 * IMPORTANTE: Se o usuário não tiver telefone, a senha será definida como "123456"
 * 
 * Uso:
 *   node scripts/atualizar-senhas-moradores.js
 * 
 * Requer: DATABASE_URL no .env.local
 */

const { readFileSync, existsSync } = require('fs');
const { Client } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');

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

/**
 * Normaliza o telefone removendo caracteres especiais
 * Ex: "(11) 98765-4321" → "11987654321"
 */
function normalizarTelefone(telefone) {
  if (!telefone) {
    return '123456'; // Senha padrão se não tiver telefone
  }
  
  // Remove todos os caracteres não numéricos
  return telefone.replace(/\D/g, '') || '123456';
}

/**
 * Gera hash da senha usando bcrypt
 */
async function hashSenha(senha) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(senha, salt);
}

async function atualizarSenhasMoradores() {
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

    // Busca todos os usuários moradores
    console.log('🔍 Buscando usuários com perfil "morador"...');
    const moradores = await client.query(
      `SELECT id, nome, email, telefone FROM users WHERE perfil = 'morador' ORDER BY nome`
    );

    if (moradores.rows.length === 0) {
      console.log('✅ Nenhum usuário morador encontrado.');
      await client.end();
      return;
    }

    console.log(`📋 Encontrados ${moradores.rows.length} usuário(s) morador(es) para atualizar:\n`);

    // Inicia transação
    await client.query('BEGIN');

    let atualizados = 0;
    let erros = 0;
    const errosDetalhes = [];
    const senhasGeradas = [];

    // Processa cada morador
    for (const morador of moradores.rows) {
      try {
        const telefoneNormalizado = normalizarTelefone(morador.telefone);
        const passwordHash = await hashSenha(telefoneNormalizado);

        // Atualiza a senha
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [passwordHash, morador.id]
        );

        console.log(`✅ ${morador.nome} (${morador.email}) - Senha: ${telefoneNormalizado}`);
        senhasGeradas.push({
          nome: morador.nome,
          email: morador.email,
          telefone: morador.telefone || '(sem telefone)',
          senha: telefoneNormalizado,
        });

        atualizados++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar ${morador.nome} (${morador.email}):`, error.message);
        erros++;
        errosDetalhes.push({
          nome: morador.nome,
          email: morador.email,
          motivo: error.message,
        });
      }
    }

    // Confirma transação
    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO:');
    console.log('='.repeat(60));
    console.log(`   ✅ Senhas atualizadas: ${atualizados}`);
    console.log(`   ⚠️  Erros: ${erros}`);

    if (errosDetalhes.length > 0) {
      console.log('\n⚠️  Detalhes dos erros:');
      errosDetalhes.forEach((erro) => {
        console.log(`   - ${erro.nome} (${erro.email}): ${erro.motivo}`);
      });
    }

    // Pergunta se quer salvar as senhas em arquivo
    console.log('\n💡 Dica: As senhas foram definidas como o número de telefone (sem caracteres especiais)');
    console.log('   Usuários sem telefone receberam a senha padrão: 123456');

    await client.end();
    console.log('\n✅ Processo concluído com sucesso!');
  } catch (error) {
    // Reverte transação em caso de erro
    await client.query('ROLLBACK');
    console.error('\n❌ Erro fatal. Transação revertida:', error);
    await client.end();
    process.exit(1);
  }
}

// Executa o script
atualizarSenhasMoradores();
