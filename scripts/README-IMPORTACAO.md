# Script de Importação de Usuários

Este script permite importar usuários em lote a partir de um arquivo CSV ou JSON.

## Características

- ✅ Suporta usuários com múltiplas unidades (cria uma conta para cada unidade)
- ✅ Cria unidades automaticamente se não existirem
- ✅ Gera senhas aleatórias seguras para cada usuário
- ✅ Gera emails únicos para usuários com múltiplas unidades (adiciona sufixo com número da unidade)
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

1. Cria uma conta separada para cada unidade
2. Gera um email único adicionando o número da unidade:
   - Email original: `alan@gmail.com`
   - Unidade 1401: `alan+1401@gmail.com`
   - Unidade 1402: `alan+1402@gmail.com`

**Exemplo:**
```csv
nome,email,telefone,unidade
ALAN SANTOS,alan@gmail.com,,1401
ALAN SANTOS,alan@gmail.com,,1402
```

Resultado:
- `alan+1401@gmail.com` → Unidade 1401
- `alan+1402@gmail.com` → Unidade 1402

## Exemplo de Saída

```
📦 Conectando ao banco de dados...
✅ Conectado com sucesso
📄 Lendo arquivo...
📊 Encontrados 8 registros para processar

✓ 1/8 - MARCIA SILVA (marcia+904@gmail.com) → Unidade 904
✓ 2/8 - ALAN SANTOS (alan+1401@gmail.com) → Unidade 1401
✓ 3/8 - ALAN SANTOS (alan+1402@gmail.com) → Unidade 1402
...

============================================================
📊 RESUMO DA IMPORTAÇÃO
============================================================
✅ Usuários criados: 8
❌ Erros: 0
🏠 Unidades processadas: 8

📋 USUÁRIOS CRIADOS:
------------------------------------------------------------
1. MARCIA SILVA
   Email: marcia+904@gmail.com
   Unidade: 904
   Senha: IOPlrzLO
...
```

## Requisitos

- Node.js instalado
- Arquivo `.env.local` com `DATABASE_URL` configurada
- Dependências instaladas (`npm install`)

## Notas Importantes

1. **Senhas**: Todas as senhas são geradas aleatoriamente. Salve o relatório para distribuir as senhas aos usuários.

2. **Emails únicos**: O sistema exige emails únicos. Usuários com múltiplas unidades receberão emails modificados.

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
