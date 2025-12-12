/**
 * Script para importar usuários em lote.
 * 
 * Suporta usuários com múltiplas unidades criando uma conta para cada unidade.
 * 
 * Uso:
 *   node scripts/importar-usuarios.js arquivo.csv
 * 
 * Formato do CSV:
 *   nome,email,telefone,unidade
 *   João Silva,joao@email.com,(11) 98765-4321,101
 *   Maria Santos,maria@email.com,,202
 * 
 * Formato do JSON:
 *   [
 *     { "nome": "João Silva", "email": "joao@email.com", "telefone": "(11) 98765-4321", "unidade": "101" },
 *     { "nome": "Maria Santos", "email": "maria@email.com", "unidade": "202" }
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
 * Cria um usuário
 */
async function criarUsuario(client, dados, unidadeId, emailsUsados) {
  const senha = gerarSenha();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(senha, salt);

  // Gera email único de forma mais limpa
  let email = dados.email.toLowerCase().trim();
  const [emailLocal, emailDomain] = email.split('@');
  let emailFinal = email;

  // Verifica se o email original já foi usado nesta importação
  const emailJaUsado = emailsUsados.has(email);
  
  // Verifica se o email já existe no banco
  let emailExisteNoBanco = false;
  const checkOriginal = await client.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  emailExisteNoBanco = checkOriginal.rows.length > 0;

  // Se o email já existe (no banco ou nesta importação), adiciona sufixo com unidade
  if (emailJaUsado || emailExisteNoBanco) {
    const sufixoUnidade = dados.unidade.replace(/[^0-9]/g, ''); // Remove caracteres não numéricos
    
    // Usa formato mais limpo: nome.unidade@dominio.com
    emailFinal = `${emailLocal}.${sufixoUnidade}@${emailDomain}`;
    
    // Verifica se esse email já existe
    let tentativas = 0;
    while (true) {
      const checkResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [emailFinal]
      );

      if (checkResult.rows.length === 0 && !emailsUsados.has(emailFinal)) {
        break; // Email disponível
      }

      // Email já existe, adiciona contador
      tentativas++;
      emailFinal = `${emailLocal}.${sufixoUnidade}_${tentativas}@${emailDomain}`;
    }
  }

  // Marca o email como usado
  emailsUsados.set(emailFinal, true);

  // Cria usuário
  const result = await client.query(
    `INSERT INTO users (email, password_hash, nome, telefone, perfil, unidade_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, nome`,
    [
      emailFinal,
      passwordHash,
      dados.nome.trim(),
      dados.telefone || null,
      'morador',
      unidadeId,
    ]
  );

  return {
    ...result.rows[0],
    senha,
    unidade: dados.unidade,
  };
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

    const resultados = {
      sucesso: [],
      erros: [],
      unidadesCriadas: new Set(),
      emailsUsados: new Map(), // Rastreia emails já usados durante a importação
    };

    // Processa cada registro
    for (let i = 0; i < dados.length; i++) {
      const registro = dados[i];
      
      try {
        // Valida campos obrigatórios
        if (!registro.nome || !registro.email || !registro.unidade) {
          resultados.erros.push({
            linha: i + 2,
            registro,
            erro: 'Campos obrigatórios faltando: nome, email ou unidade',
          });
          continue;
        }

        // Busca ou cria unidade
        const unidadeId = await buscarOuCriarUnidade(client, registro.unidade);
        if (!resultados.unidadesCriadas.has(registro.unidade)) {
          resultados.unidadesCriadas.add(registro.unidade);
        }

        // Cria usuário
        const usuario = await criarUsuario(client, registro, unidadeId, resultados.emailsUsados);
        resultados.sucesso.push(usuario);

        console.log(`✓ ${i + 1}/${dados.length} - ${usuario.nome} (${usuario.email}) → Unidade ${registro.unidade}`);
      } catch (error) {
        resultados.erros.push({
          linha: i + 2,
          registro,
          erro: error.message,
        });
        console.error(`✗ ${i + 1}/${dados.length} - Erro: ${error.message}`);
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Usuários criados: ${resultados.sucesso.length}`);
    console.log(`❌ Erros: ${resultados.erros.length}`);
    console.log(`🏠 Unidades processadas: ${resultados.unidadesCriadas.size}`);

    if (resultados.sucesso.length > 0) {
      console.log('\n📋 USUÁRIOS CRIADOS:');
      console.log('-'.repeat(60));
      resultados.sucesso.forEach((u, idx) => {
        console.log(`${idx + 1}. ${u.nome}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Unidade: ${u.unidade}`);
        console.log(`   Senha: ${u.senha}`);
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
        unidade: u.unidade,
        senha: u.senha,
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
