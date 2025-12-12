# Script de Importação de Usuários

Este script permite importar usuários em lote a partir de um arquivo CSV ou JSON.

## Características

- ✅ Agrupa usuários por email (cria apenas uma conta por email)
- ✅ Vincula múltiplas unidades ao mesmo usuário automaticamente
- ✅ Cria unidades automaticamente se não existirem
- ✅ Gera senhas aleatórias seguras para novos usuários
- ✅ Detecta usuários já existentes e apenas vincula novas unidades
- ✅ Gera relatório completo da importação

## Como Usar

### 1. Preparar o arquivo de dados

Crie um arquivo CSV ou JSON com os dados dos usuários.

#### Formato CSV:

```csv
nome,email,telefone,unidade
João Silva,joao@email.com,(11) 98765-4321,101
Maria Santos,maria@email.com,,202
Pedro Costa,pedro@email.com,(21) 99876-5432,303
```

**Importante:**
- A primeira linha deve conter os cabeçalhos: `nome,email,telefone,unidade`
- O campo `telefone` é opcional (pode ficar vazio)
- O campo `unidade` deve conter o número da unidade

#### Formato JSON:

```json
[
  {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "(11) 98765-4321",
    "unidade": "101"
  },
  {
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "unidade": "202"
  }
]
```

### 2. Executar o script

```bash
# Para arquivo CSV
npm run importar:usuarios arquivo.csv

# Para arquivo JSON
npm run importar:usuarios arquivo.json

# Ou usando node diretamente
node scripts/importar-usuarios.js arquivo.csv
```

### 3. Verificar o resultado

O script irá:
- Mostrar o progresso em tempo real
- Exibir um resumo ao final
- Salvar um relatório em `importacao-usuarios-relatorio.json` com:
  - Lista de todos os usuários criados
  - Senhas geradas
  - Erros encontrados (se houver)

## Tratamento de Usuários com Múltiplas Unidades

Quando um usuário aparece com o mesmo email em múltiplas unidades, o script:

1. **Agrupa por email**: Identifica todos os registros com o mesmo email
2. **Cria uma única conta**: Cria apenas um usuário com o email original
3. **Vincula todas as unidades**: Conecta todas as unidades ao mesmo usuário através da tabela `usuario_unidades`

**Exemplo:**
```csv
nome,email,telefone,unidade
ALAN SANTOS,alan@gmail.com,,1401
ALAN SANTOS,alan@gmail.com,,1402
```

Resultado:
- **Uma conta criada**: `alan@gmail.com`
- **Duas unidades vinculadas**: 1401 e 1402
- O usuário pode escolher qual unidade usar ao votar

**Vantagens:**
- ✅ Email limpo (sem sufixos)
- ✅ Uma senha para todas as unidades
- ✅ Controle de voto por unidade mantido

## Exemplo de Saída

```
📦 Conectando ao banco de dados...
✅ Conectado com sucesso
📄 Lendo arquivo...
📊 Encontrados 8 registros para processar

📊 Agrupados em 6 usuários únicos

✓ 1/6 - MARCIA SILVA (marcia@gmail.com) [CRIADO]
  → 1 unidade(s): 904
✓ 2/6 - ALAN SANTOS (alan@gmail.com) [CRIADO]
  → 2 unidade(s): 1401, 1402
✓ 3/6 - FATIMA SOUZA (fatima@gmail.com) [CRIADO]
  → 2 unidade(s): 1203, 1204
...

============================================================
📊 RESUMO DA IMPORTAÇÃO
============================================================
📝 Registros processados: 8
👥 Usuários únicos: 6
✅ Usuários criados: 6
🔄 Usuários existentes: 0
🏠 Unidades processadas: 8
🔗 Vínculos criados: 8
❌ Erros: 0

📋 USUÁRIOS PROCESSADOS:
------------------------------------------------------------
1. MARCIA SILVA
   Email: marcia@gmail.com
   Status: CRIADO
   Unidades: 904
   Senha: IOPlrzLO

2. ALAN SANTOS
   Email: alan@gmail.com
   Status: CRIADO
   Unidades: 1401, 1402
   Senha: NkhG4gMd
...
```

## Requisitos

- Node.js instalado
- Arquivo `.env.local` com `DATABASE_URL` configurada
- Dependências instaladas (`npm install`)

## Notas Importantes

1. **Senhas**: Todas as senhas são geradas aleatoriamente. Salve o relatório para distribuir as senhas aos usuários.

2. **Emails únicos**: O sistema exige emails únicos. Usuários com múltiplas unidades são agrupados e todas as unidades são vinculadas à mesma conta.

3. **Unidades**: As unidades são criadas automaticamente se não existirem.

4. **Perfil**: Todos os usuários importados recebem o perfil `morador` por padrão.

5. **Validação**: O script valida que nome, email e unidade estão presentes antes de criar.

## Solução de Problemas

### Erro: "Email já cadastrado"
- O script tenta criar emails únicos automaticamente
- Se ainda assim der erro, verifique se há duplicatas no arquivo

### Erro: "DATABASE_URL não encontrada"
- Certifique-se de ter o arquivo `.env.local` na raiz do projeto
- Verifique se a variável `DATABASE_URL` está configurada corretamente

### Erro ao parsear CSV
- Verifique se o arquivo está no formato correto
- Certifique-se de que a primeira linha contém os cabeçalhos
- Use o arquivo `TEMPLATE-usuarios.csv` como referência
