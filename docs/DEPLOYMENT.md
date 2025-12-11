# Guia de Deploy

Este documento descreve como fazer o deploy do sistema na Vercel e configurar o Supabase.

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com)
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## Passo 1: Configurar Supabase

### 1.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - Project URL
   - Anon Key
   - Service Role Key

### 1.2 Executar Migrations

1. Acesse o SQL Editor no Supabase
2. Execute o arquivo `supabase/migrations/001_initial_schema.sql`
3. Execute o arquivo `supabase/seed.sql` para criar o usuário admin inicial

### 1.3 Verificar Dados

Execute no SQL Editor para verificar:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar usuário admin
SELECT email, nome, perfil FROM users WHERE perfil = 'staff';
```

## Passo 2: Configurar Variáveis de Ambiente

### 2.1 No Supabase

As variáveis já estão configuradas no projeto. Verifique se estão corretas.

### 2.2 Na Vercel

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
NEXTAUTH_URL=https://seu-projeto.vercel.app
NEXTAUTH_SECRET=<gerar com: openssl rand -base64 32>
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**IMPORTANTE**:
- `NEXTAUTH_URL` deve ser a URL de produção (ou staging)
- `NEXTAUTH_SECRET` deve ser único e seguro
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposta no cliente

## Passo 3: Deploy na Vercel

### 3.1 Conectar Repositório

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte seu repositório Git
3. Selecione o repositório do projeto

### 3.2 Configurar Projeto

A Vercel detecta automaticamente Next.js. Verifique:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (raiz do projeto)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)

### 3.3 Variáveis de Ambiente

Adicione todas as variáveis listadas no Passo 2.2.

### 3.4 Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Acesse a URL fornecida

## Passo 4: Verificar Deploy

### 4.1 Testar Aplicação

1. Acesse a URL de produção
2. Deve redirecionar para `/login`
3. Faça login com:
   - Email: `admin@condominio.com`
   - Senha: `admin123`

### 4.2 Verificar Funcionalidades

- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Lista de usuários funciona
- [ ] Criar usuário funciona
- [ ] Lista de votações funciona
- [ ] Criar votação funciona
- [ ] Votar funciona (área do votante)

## Passo 5: Configurar Domínio Customizado (Opcional)

1. Na Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Atualize `NEXTAUTH_URL` com o novo domínio

## Troubleshooting

### Erro: "NEXTAUTH_SECRET is not set"

- Verifique se a variável está configurada na Vercel
- Reinicie o deploy após adicionar

### Erro: "Supabase connection failed"

- Verifique `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Confirme que as migrations foram executadas

### Erro: "Unauthorized" em todas as rotas

- Verifique se `NEXTAUTH_URL` está correto
- Confirme que `NEXTAUTH_SECRET` está configurado

### Build falha

- Verifique logs na Vercel
- Confirme que todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript

### Votos não são registrados

- Verifique se as migrations foram executadas corretamente
- Confirme que `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Verifique logs do Supabase para erros

## Ambiente de Staging

Para criar um ambiente de staging:

1. Na Vercel, vá em **Settings** → **Git**
2. Configure **Production Branch** (ex: `main`)
3. Configure **Preview Branches** (ex: `develop`)
4. Crie variáveis de ambiente específicas para Preview se necessário

## Monitoramento

### Vercel Analytics

1. Habilite Vercel Analytics no projeto
2. Monitore performance e erros

### Supabase Dashboard

1. Monitore uso de recursos
2. Verifique logs de queries
3. Configure alertas se necessário

## Backup

### Banco de Dados

O Supabase faz backups automáticos. Para backup manual:

1. Acesse **Database** → **Backups** no Supabase
2. Baixe backup quando necessário

### Código

O código está versionado no Git. Para backup completo:

```bash
git clone https://github.com/seu-usuario/projeto-votacao.git
```

## Atualizações

### Deploy de Novas Features

1. Faça commit e push para o repositório
2. A Vercel faz deploy automático
3. Verifique se o deploy foi bem-sucedido

### Atualizar Banco de Dados

1. Crie nova migration em `supabase/migrations/`
2. Execute no SQL Editor do Supabase
3. Teste em staging antes de produção

## Rollback

### Código

1. Na Vercel, vá em **Deployments**
2. Encontre o deployment anterior
3. Clique em **⋯** → **Promote to Production**

### Banco de Dados

1. Acesse **Database** → **Backups** no Supabase
2. Restaure backup anterior se necessário

## Segurança

### Checklist de Segurança

- [ ] `NEXTAUTH_SECRET` é único e seguro
- [ ] `SUPABASE_SERVICE_ROLE_KEY` não está exposta
- [ ] Senha do admin foi alterada após primeiro login
- [ ] HTTPS está habilitado (automático na Vercel)
- [ ] Variáveis de ambiente estão protegidas
- [ ] Logs não contêm informações sensíveis

### Recomendações

1. **Altere a senha do admin** imediatamente após deploy
2. **Use senhas fortes** para todos os usuários
3. **Monitore logs** regularmente
4. **Mantenha dependências atualizadas**
5. **Configure rate limiting** (futuro)

## Suporte

Para problemas:
1. Verifique logs na Vercel
2. Verifique logs no Supabase
3. Consulte documentação do Next.js e Supabase
4. Abra issue no repositório

