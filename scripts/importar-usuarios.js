/**
 * Script para importar usuários em lote.
 * 
 * Agrupa usuários por email e vincula todas as unidades ao mesmo usuário.
 * Se um usuário aparece múltiplas vezes com o mesmo email, cria apenas uma conta
 * e vincula todas as unidades através da tabela usuario_unidades.
 * 
 * Uso:
 *   node scripts/importar-usuarios.js arquivo.csv
 * 
 * Formato do CSV:
 *   nome,email,telefone,unidade
 *   João Silva,joao@email.com,(11) 98765-4321,101
 *   João Silva,joao@email.com,,202  (mesmo usuário, segunda unidade)
 *   Maria Santos,maria@email.com,,202
 * 
 * Formato do JSON:
 *   [
 *     { "nome": "João Silva", "email": "joao@email.com", "telefone": "(11) 98765-4321", "unidade": "101" },
 *     { "nome": "João Silva", "email": "joao@email.com", "unidade": "202" }
 *   ]
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
 * Gera uma senha aleatória segura
 */
function gerarSenha() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let senha = '';
  for (let i = 0; i < 8; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return senha;
}

/**
 * Parse CSV simples (suporta vírgulas dentro de aspas)
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const dados = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse simples - divide por vírgula e remove espaços
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Último valor

    if (values.length >= 3) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = (values[index] || '').replace(/^"|"$/g, '');
      });
      
      // Normaliza o campo de unidade: usa 'unidade' se existir, senão tenta 'numero'
      if (!obj.unidade && obj.numero) {
        obj.unidade = obj.numero;
      }
      // Se tem bloco e numero, pode criar unidade composta
      if (obj.bloco && obj.numero && !obj.unidade) {
        obj.unidade = `${obj.bloco}-${obj.numero}`;
      }
      
      dados.push(obj);
    }
  }

  return dados;
}

/**
 * Busca ou cria uma unidade
 */
async function buscarOuCriarUnidade(client, numero) {
  // Busca unidade existente
  const result = await client.query(
    'SELECT id FROM unidades WHERE numero = $1',
    [numero]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  // Cria nova unidade
  const insertResult = await client.query(
    'INSERT INTO unidades (numero) VALUES ($1) RETURNING id',
    [numero]
  );

  return insertResult.rows[0].id;
}

/**
 * Busca ou cria um usuário por email
 */
async function buscarOuCriarUsuario(client, email, nome, telefone) {
  const emailNormalizado = email.toLowerCase().trim();
  
  // Verifica se o usuário já existe
  const usuarioExistente = await client.query(
    'SELECT id FROM users WHERE email = $1',
    [emailNormalizado]
  );

  if (usuarioExistente.rows.length > 0) {
    return usuarioExistente.rows[0].id;
  }

  // Cria novo usuário
  const senha = gerarSenha();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(senha, salt);

  const result = await client.query(
    `INSERT INTO users (email, password_hash, nome, telefone, perfil)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, nome`,
    [
      emailNormalizado,
      passwordHash,
      nome.trim(),
      telefone || null,
      'morador',
    ]
  );

  return {
    usuarioId: result.rows[0].id,
    email: result.rows[0].email,
    nome: result.rows[0].nome,
    senha,
    criado: true,
  };
}

/**
 * Vincula uma unidade a um usuário
 */
async function vincularUnidadeAoUsuario(client, usuarioId, unidadeId) {
  // Verifica se o vínculo já existe
  const vinculoExistente = await client.query(
    'SELECT id FROM usuario_unidades WHERE usuario_id = $1 AND unidade_id = $2',
    [usuarioId, unidadeId]
  );

  if (vinculoExistente.rows.length > 0) {
    return false; // Já existe
  }

  // Cria o vínculo
  await client.query(
    'INSERT INTO usuario_unidades (usuario_id, unidade_id) VALUES ($1, $2)',
    [usuarioId, unidadeId]
  );

  return true; // Criado
}

async function importarUsuarios() {
  const arquivo = process.argv[2];

  if (!arquivo) {
    console.error('❌ Erro: Arquivo não especificado');
    console.error('   Uso: node scripts/importar-usuarios.js arquivo.csv ou arquivo.json');
    process.exit(1);
  }

  const arquivoPath = path.isAbsolute(arquivo)
    ? arquivo
    : path.join(__dirname, '..', arquivo);

  if (!existsSync(arquivoPath)) {
    console.error(`❌ Erro: Arquivo não encontrado: ${arquivoPath}`);
    process.exit(1);
  }

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
    console.log('✅ Conectado com sucesso');

    console.log('📄 Lendo arquivo...');
    const content = readFileSync(arquivoPath, 'utf-8');
    
    let dados;
    if (arquivoPath.endsWith('.json')) {
      dados = JSON.parse(content);
    } else {
      dados = parseCSV(content);
    }

    console.log(`📊 Encontrados ${dados.length} registros para processar\n`);

    // Agrupa registros por email
    const usuariosPorEmail = new Map();
    
    for (let i = 0; i < dados.length; i++) {
      const registro = dados[i];
      
      // Valida campos obrigatórios
      if (!registro.nome || !registro.email || !registro.unidade) {
        continue;
      }

      const email = registro.email.toLowerCase().trim();
      
      if (!usuariosPorEmail.has(email)) {
        usuariosPorEmail.set(email, {
          nome: registro.nome.trim(),
          email: email,
          telefone: registro.telefone || null, // Usa o primeiro telefone encontrado
          unidades: [],
        });
      }
      
      // Adiciona unidade à lista (evita duplicatas)
      const usuario = usuariosPorEmail.get(email);
      if (!usuario.unidades.includes(registro.unidade)) {
        usuario.unidades.push(registro.unidade);
      }
      
      // Se o telefone atual está vazio e o novo tem valor, atualiza
      if (!usuario.telefone && registro.telefone) {
        usuario.telefone = registro.telefone;
      }
    }

    console.log(`📊 Agrupados em ${usuariosPorEmail.size} usuários únicos\n`);

    const resultados = {
      sucesso: [],
      erros: [],
      unidadesCriadas: new Set(),
      usuariosCriados: new Set(),
      unidadesVinculadas: 0,
    };

    // Processa cada usuário único
    let processados = 0;
    for (const [email, dadosUsuario] of usuariosPorEmail.entries()) {
      try {
        processados++;
        
        // Busca ou cria o usuário
        const resultadoUsuario = await buscarOuCriarUsuario(
          client,
          dadosUsuario.email,
          dadosUsuario.nome,
          dadosUsuario.telefone
        );

        let usuarioId;
        let senha = null;
        let usuarioCriado = false;

        if (typeof resultadoUsuario === 'string') {
          // Usuário já existia
          usuarioId = resultadoUsuario;
        } else {
          // Usuário foi criado
          usuarioId = resultadoUsuario.usuarioId;
          senha = resultadoUsuario.senha;
          usuarioCriado = true;
          resultados.usuariosCriados.add(email);
        }

        // Processa cada unidade do usuário
        const unidadesVinculadas = [];
        for (const numeroUnidade of dadosUsuario.unidades) {
          try {
            // Busca ou cria unidade
            const unidadeId = await buscarOuCriarUnidade(client, numeroUnidade);
            if (!resultados.unidadesCriadas.has(numeroUnidade)) {
              resultados.unidadesCriadas.add(numeroUnidade);
            }

            // Vincula unidade ao usuário
            const vinculado = await vincularUnidadeAoUsuario(client, usuarioId, unidadeId);
            if (vinculado) {
              unidadesVinculadas.push(numeroUnidade);
              resultados.unidadesVinculadas++;
            }
          } catch (error) {
            console.error(`  ⚠️  Erro ao vincular unidade ${numeroUnidade}: ${error.message}`);
          }
        }

        resultados.sucesso.push({
          nome: dadosUsuario.nome,
          email: dadosUsuario.email,
          unidades: dadosUsuario.unidades,
          unidadesVinculadas: unidadesVinculadas,
          senha: senha,
          criado: usuarioCriado,
        });

        const status = usuarioCriado ? 'CRIADO' : 'EXISTENTE';
        console.log(`✓ ${processados}/${usuariosPorEmail.size} - ${dadosUsuario.nome} (${dadosUsuario.email}) [${status}]`);
        console.log(`  → ${dadosUsuario.unidades.length} unidade(s): ${dadosUsuario.unidades.join(', ')}`);
        if (unidadesVinculadas.length < dadosUsuario.unidades.length) {
          console.log(`  → ${unidadesVinculadas.length} nova(s) vinculação(ões)`);
        }
      } catch (error) {
        resultados.erros.push({
          email,
          dadosUsuario,
          erro: error.message,
        });
        console.error(`✗ ${processados}/${usuariosPorEmail.size} - Erro: ${error.message}`);
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`📝 Registros processados: ${dados.length}`);
    console.log(`👥 Usuários únicos: ${usuariosPorEmail.size}`);
    console.log(`✅ Usuários criados: ${resultados.usuariosCriados.size}`);
    console.log(`🔄 Usuários existentes: ${resultados.sucesso.length - resultados.usuariosCriados.size}`);
    console.log(`🏠 Unidades processadas: ${resultados.unidadesCriadas.size}`);
    console.log(`🔗 Vínculos criados: ${resultados.unidadesVinculadas}`);
    console.log(`❌ Erros: ${resultados.erros.length}`);

    if (resultados.sucesso.length > 0) {
      console.log('\n📋 USUÁRIOS PROCESSADOS:');
      console.log('-'.repeat(60));
      resultados.sucesso.forEach((u, idx) => {
        console.log(`${idx + 1}. ${u.nome}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Status: ${u.criado ? 'CRIADO' : 'JÁ EXISTIA'}`);
        console.log(`   Unidades: ${u.unidades.join(', ')}`);
        if (u.senha) {
          console.log(`   Senha: ${u.senha}`);
        }
        if (u.unidadesVinculadas.length < u.unidades.length) {
          console.log(`   ⚠️  ${u.unidades.length - u.unidadesVinculadas.length} unidade(s) já estava(m) vinculada(s)`);
        }
        console.log('');
      });
    }

    if (resultados.erros.length > 0) {
      console.log('\n❌ ERROS:');
      console.log('-'.repeat(60));
      resultados.erros.forEach((e) => {
        console.log(`Linha ${e.linha}: ${e.erro}`);
        console.log(`  Dados: ${JSON.stringify(e.registro)}`);
        console.log('');
      });
    }

    // Salva relatório
    const relatorioPath = path.join(__dirname, '..', 'importacao-usuarios-relatorio.json');
    const relatorio = {
      data: new Date().toISOString(),
      total: dados.length,
      sucesso: resultados.sucesso.length,
      erros: resultados.erros.length,
      usuarios: resultados.sucesso.map(u => ({
        nome: u.nome,
        email: u.email,
        unidades: u.unidades,
        unidadesVinculadas: u.unidadesVinculadas,
        senha: u.senha,
        criado: u.criado,
      })),
      erros_detalhados: resultados.erros,
    };

    require('fs').writeFileSync(relatorioPath, JSON.stringify(relatorio, null, 2));
    console.log(`\n💾 Relatório salvo em: ${relatorioPath}`);

    await client.end();
  } catch (error) {
    console.error('❌ Erro ao importar usuários:', error.message);
    console.error(error.stack);
    await client.end();
    process.exit(1);
  }
}

importarUsuarios();
