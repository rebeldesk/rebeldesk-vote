/**
 * Script para corrigir unidades que foram importadas com ".0" no final.
 * 
 * Processo:
 * 1. Para cada unidade com ".0", encontra ou cria a unidade sem ".0"
 * 2. Atualiza todos os vínculos de usuários (usuario_unidades e users.unidade_id)
 * 3. Atualiza todos os votos que referenciam a unidade com ".0"
 * 4. Remove as unidades com ".0" do banco
 * 
 * Uso:
 *   node scripts/corrigir-unidades-ponto-zero.js
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

/**
 * Remove o sufixo ".0" do final de uma string, se existir
 */
function removerPontoZero(numero) {
  if (typeof numero !== 'string') {
    numero = String(numero);
  }
  // Remove ".0" apenas se estiver no final
  if (numero.endsWith('.0')) {
    return numero.slice(0, -2);
  }
  return numero;
}

async function corrigirUnidades() {
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

    // Inicia transação
    await client.query('BEGIN');

    // Busca todas as unidades que terminam com ".0"
    console.log('🔍 Buscando unidades com ".0" no final...');
    const unidadesComPontoZero = await client.query(
      `SELECT id, numero FROM unidades WHERE numero LIKE '%.0' ORDER BY numero`
    );

    if (unidadesComPontoZero.rows.length === 0) {
      console.log('✅ Nenhuma unidade com ".0" encontrada. Nada a corrigir!');
      await client.query('COMMIT');
      await client.end();
      return;
    }

    console.log(`📋 Encontradas ${unidadesComPontoZero.rows.length} unidade(s) para corrigir:\n`);

    let unidadesCorrigidas = 0;
    let vinculosAtualizados = 0;
    let votosAtualizados = 0;
    let unidadesRemovidas = 0;
    let erros = 0;
    const errosDetalhes = [];

    // Processa cada unidade
    for (const unidadeComPontoZero of unidadesComPontoZero.rows) {
      const numeroAntigo = unidadeComPontoZero.numero;
      const numeroNovo = removerPontoZero(numeroAntigo);
      const unidadeIdAntigo = unidadeComPontoZero.id;

      console.log(`\n📌 Processando: ${numeroAntigo} → ${numeroNovo}`);

      try {
        // 1. Busca ou cria a unidade correta (sem ".0")
        let unidadeIdNovo;
        const unidadeNova = await client.query(
          'SELECT id FROM unidades WHERE numero = $1',
          [numeroNovo]
        );

        if (unidadeNova.rows.length > 0) {
          unidadeIdNovo = unidadeNova.rows[0].id;
          console.log(`   ✓ Unidade correta já existe (ID: ${unidadeIdNovo})`);
        } else {
          // Cria a unidade correta
          const novaUnidade = await client.query(
            'INSERT INTO unidades (numero) VALUES ($1) RETURNING id',
            [numeroNovo]
          );
          unidadeIdNovo = novaUnidade.rows[0].id;
          console.log(`   ✓ Unidade correta criada (ID: ${unidadeIdNovo})`);
        }

        // 2. Atualiza vínculos em usuario_unidades
        // Primeiro, atualiza os que não causariam duplicatas
        const vinculosAtualizadosResult = await client.query(
          `UPDATE usuario_unidades 
           SET unidade_id = $1 
           WHERE unidade_id = $2 
           AND NOT EXISTS (
             SELECT 1 FROM usuario_unidades uu2
             WHERE uu2.usuario_id = usuario_unidades.usuario_id 
             AND uu2.unidade_id = $1
           )`,
          [unidadeIdNovo, unidadeIdAntigo]
        );
        const vinculosAtualizadosCount = vinculosAtualizadosResult.rowCount || 0;

        // Remove os vínculos restantes que causariam duplicatas
        // (usuários que já têm a unidade correta vinculada)
        const vinculosRemovidosResult = await client.query(
          `DELETE FROM usuario_unidades 
           WHERE unidade_id = $1 
           AND EXISTS (
             SELECT 1 FROM usuario_unidades uu2
             WHERE uu2.usuario_id = usuario_unidades.usuario_id
             AND uu2.unidade_id = $2
           )`,
          [unidadeIdAntigo, unidadeIdNovo]
        );
        const vinculosRemovidosCount = vinculosRemovidosResult.rowCount || 0;

        if (vinculosAtualizadosCount > 0) {
          console.log(`   ✓ ${vinculosAtualizadosCount} vínculo(s) de usuário atualizado(s)`);
          vinculosAtualizados += vinculosAtualizadosCount;
        }
        if (vinculosRemovidosCount > 0) {
          console.log(`   ✓ ${vinculosRemovidosCount} vínculo(s) duplicado(s) removido(s)`);
        }

        // 3. Atualiza users.unidade_id (campo legado)
        const usersAtualizadosResult = await client.query(
          `UPDATE users 
           SET unidade_id = $1 
           WHERE unidade_id = $2`,
          [unidadeIdNovo, unidadeIdAntigo]
        );
        const usersAtualizadosCount = usersAtualizadosResult.rowCount || 0;

        if (usersAtualizadosCount > 0) {
          console.log(`   ✓ ${usersAtualizadosCount} usuário(s) com unidade_id atualizado(s)`);
        }

        // 4. Atualiza votos que referenciam a unidade antiga
        const votosAtualizadosResult = await client.query(
          `UPDATE votos 
           SET unidade_id = $1 
           WHERE unidade_id = $2`,
          [unidadeIdNovo, unidadeIdAntigo]
        );
        const votosAtualizadosCount = votosAtualizadosResult.rowCount || 0;

        if (votosAtualizadosCount > 0) {
          console.log(`   ✓ ${votosAtualizadosCount} voto(s) atualizado(s)`);
          votosAtualizados += votosAtualizadosCount;
        }

        // 5. Remove a unidade com ".0"
        await client.query(
          'DELETE FROM unidades WHERE id = $1',
          [unidadeIdAntigo]
        );
        console.log(`   ✓ Unidade "${numeroAntigo}" removida`);

        unidadesCorrigidas++;
        unidadesRemovidas++;

      } catch (error) {
        console.error(`   ❌ Erro ao processar ${numeroAntigo}:`, error.message);
        erros++;
        errosDetalhes.push({
          antigo: numeroAntigo,
          novo: numeroNovo,
          motivo: error.message,
        });
      }
    }

    // Confirma transação
    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA CORREÇÃO:');
    console.log('='.repeat(60));
    console.log(`   ✅ Unidades processadas: ${unidadesCorrigidas}`);
    console.log(`   🔗 Vínculos de usuários atualizados: ${vinculosAtualizados}`);
    console.log(`   🗳️  Votos atualizados: ${votosAtualizados}`);
    console.log(`   🗑️  Unidades removidas: ${unidadesRemovidas}`);
    console.log(`   ⚠️  Erros: ${erros}`);

    if (errosDetalhes.length > 0) {
      console.log('\n⚠️  Detalhes dos erros:');
      errosDetalhes.forEach((erro) => {
        console.log(`   - ${erro.antigo} → ${erro.novo}: ${erro.motivo}`);
      });
    }

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
corrigirUnidades();
