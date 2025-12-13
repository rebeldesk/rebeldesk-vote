# Sistema de Votação Condominial

Sistema web para gerenciamento de votações em condomínios, desenvolvido com Next.js, Prisma, Supabase e deploy na Vercel.

## Visão Geral

Este sistema permite:
- **Área Administrativa**: Cadastro de usuários, criação de votações e auditoria de resultados (acesso para Staff e Conselho)
- **Área do Votante**: Visualização e participação em votações disponíveis (todos os moradores)

## Arquitetura

- **Frontend**: Next.js 14+ (App Router) com TypeScript
- **Backend**: API Routes do Next.js
- **ORM**: Prisma
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: NextAuth.js com credenciais customizadas
- **Deploy**: Vercel

## Estrutura do Projeto

```
projeto-votacao/
├── app/                    # Rotas e páginas (App Router)
│   ├── (auth)/            # Rotas de autenticação
│   ├── (admin)/           # Área administrativa
│   ├── (votante)/         # Área do votante
│   └── api/               # API Routes
├── components/            # Componentes React
├── lib/                   # Bibliotecas e utilitários
│   ├── prisma.ts         # Cliente Prisma
│   ├── auth.ts           # Configuração NextAuth
│   └── db.ts             # Helpers do banco de dados
├── prisma/                # Schema e migrations do Prisma
│   └── schema.prisma     # Schema do banco de dados
├── types/                 # Definições TypeScript
├── supabase/             # Migrations SQL (legado) e seeds
└── docs/                 # Documentação adicional
```

## Regras de Negócio Principais

1. **Voto por Unidade**: Uma unidade pode alterar seu voto até o fim da votação. O último voto registrado é o que conta (não por usuário)
2. **Histórico de Unidade**: Quando um morador muda (aluguel/venda), a unidade mantém seu histórico de votos
3. **Perfis de Acesso**:
   - **Staff**: Acesso administrativo completo
   - **Conselho**: Acesso administrativo + pode votar
   - **Auditor**: Pode auditar resultados + pode votar
   - **Morador**: Apenas pode votar
4. **Tipos de Votação**: Escolha única ou múltipla escolha
5. **Modos de Auditoria**: Anônimo (sem rastreamento) ou Rastreado (vinculado ao usuário)

## Instalação e Setup

### Pré-requisitos

- Node.js 22+ (gerenciado via nvm)
- Conta no Supabase
- Conta na Vercel (para deploy)

### Passos

1. **Clone o repositório e instale dependências**:
```bash
npm install
```

2. **Configure as variáveis de ambiente**:
```bash
cp .env.local.example .env.local
```

Preencha o `.env.local` com:
- `NEXTAUTH_URL`: URL da aplicação (http://localhost:3000 para dev)
- `NEXTAUTH_SECRET`: Gere com `openssl rand -base64 32`
- `DATABASE_URL`: Connection string do PostgreSQL (Supabase)
  - **⚠️ IMPORTANTE - IPv6**: O Supabase usa IPv6 por padrão. Se sua rede não suporta IPv6, use o **Supavisor** (connection pooler):
  - **Recomendado (Session Mode - IPv4 compatível)**: `postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres`
    - Use "Connection pooling" > "Session mode" no Supabase Dashboard
    - Compatível com IPv4 (resolve problemas de conexão IPv6)
    - Ideal para Prisma migrations e desenvolvimento local
  - **Alternativa (Transaction Pooler)**: `postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
    - Use "Connection pooling" > "Transaction mode" no Supabase Dashboard
    - Ideal para Prisma + Next.js (serverless) em produção
    - Mais eficiente e escalável
  - **Não recomendado (Direct Connection IPv6)**: `postgresql://postgres:[PASSWORD]@db.PROJECT_REF.supabase.co:5432/postgres`
    - Usa IPv6 por padrão e pode falhar em redes sem suporte IPv6
    - Erro comum: "Can't reach database server" ou "Network is unreachable"
  - Encontre em: Supabase Dashboard > Settings > Database > Connection string
  - **Dica**: Se receber erro de conexão, verifique se está usando Supavisor (pooler) ao invés da conexão direta
- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase (opcional, para futuras integrações)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Publishable key do Supabase (opcional)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key do Supabase (opcional)

3. **Configure o banco de dados**:
   - Opção 1 (Recomendado): Use Prisma Migrate
     ```bash
     npx prisma migrate dev
     ```
   - Opção 2: Execute manualmente no Supabase SQL Editor
     - Execute o arquivo `supabase/migrations/001_initial_schema.sql`
     - Execute o arquivo `supabase/seed.sql` para criar o usuário admin inicial

4. **Gere o Prisma Client**:
```bash
npx prisma generate
```

5. **Execute o projeto**:
```bash
npm run dev
```

6. **Acesse a aplicação**:
   - URL: http://localhost:3000
   - Login inicial: admin@condominio.com / admin123
   - **IMPORTANTE**: Altere a senha após o primeiro login!

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Gera build de produção
- `npm run start`: Inicia servidor de produção
- `npm run lint`: Executa o linter
- `npx prisma generate`: Gera o Prisma Client
- `npx prisma migrate dev`: Cria e aplica migrations
- `npx prisma studio`: Abre o Prisma Studio (GUI para visualizar dados)
- `node scripts/generate-password-hash.js "senha"`: Gera hash de senha para uso no seed

## Documentação Adicional

Consulte a pasta `docs/` para documentação detalhada:
- `ARCHITECTURE.md`: Arquitetura e decisões técnicas
- `BUSINESS_RULES.md`: Regras de negócio detalhadas
- `API_DOCS.md`: Documentação das APIs
- `DATABASE_SCHEMA.md`: Schema do banco de dados
- `DEPLOYMENT.md`: Guia de deploy

## Deploy na Vercel

1. **Conecte seu repositório Git à Vercel**

2. **Configure as variáveis de ambiente na Vercel**:
   - Acesse: Vercel Dashboard > Seu Projeto > Settings > Environment Variables
   - Adicione as seguintes variáveis:
     - `DATABASE_URL`: Connection string do PostgreSQL (Supabase)
     - `NEXTAUTH_URL`: URL da aplicação (ex: `https://seu-projeto.vercel.app`)
     - `NEXTAUTH_SECRET`: Secret gerado com `openssl rand -base64 32`
     - `NEXT_PUBLIC_SUPABASE_URL`: (opcional) URL do Supabase
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: (opcional)
     - `SUPABASE_SERVICE_ROLE_KEY`: (opcional)

3. **O build será executado automaticamente**:
   - O script `build` já inclui `prisma generate` antes do build
   - O `postinstall` também gera o Prisma Client após instalação de dependências

4. **Importante**: Certifique-se de que a `DATABASE_URL` está configurada antes do build, pois o Prisma precisa dela para gerar o client.

## Segurança

- Senhas hasheadas com bcrypt (10 salt rounds)
- Tokens JWT via NextAuth
- Validação de inputs com Zod
- Proteção CSRF automática do NextAuth
- Service role key nunca exposta no cliente

## Tecnologias

- Next.js 16+
- React 19+
- TypeScript 5+
- NextAuth.js 5 (beta)
- Supabase
- Tailwind CSS 4
- Zod
- React Hook Form
