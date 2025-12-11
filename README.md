# Sistema de Votação Condominial

Sistema web para gerenciamento de votações em condomínios, desenvolvido com Next.js, Supabase e deploy na Vercel.

## Visão Geral

Este sistema permite:
- **Área Administrativa**: Cadastro de usuários, criação de votações e auditoria de resultados (acesso para Staff e Conselho)
- **Área do Votante**: Visualização e participação em votações disponíveis (todos os moradores)

## Arquitetura

- **Frontend**: Next.js 14+ (App Router) com TypeScript
- **Backend**: API Routes do Next.js
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
│   ├── supabase/         # Clientes Supabase
│   ├── auth.ts           # Configuração NextAuth
│   └── db.ts             # Helpers do banco de dados
├── types/                 # Definições TypeScript
├── supabase/             # Migrations e seeds
└── docs/                 # Documentação adicional
```

## Regras de Negócio Principais

1. **Voto por Unidade**: Uma unidade só pode votar uma vez por votação (não por usuário)
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
- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Publishable key do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key do Supabase

3. **Configure o banco de dados no Supabase**:
   - Acesse o SQL Editor no Supabase
   - Execute o arquivo `supabase/migrations/001_initial_schema.sql`
   - Execute o arquivo `supabase/seed.sql` para criar o usuário admin inicial

4. **Execute o projeto**:
```bash
npm run dev
```

5. **Acesse a aplicação**:
   - URL: http://localhost:3000
   - Login inicial: admin@condominio.com / admin123
   - **IMPORTANTE**: Altere a senha após o primeiro login!

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Gera build de produção
- `npm run start`: Inicia servidor de produção
- `npm run lint`: Executa o linter
- `node scripts/generate-password-hash.js "senha"`: Gera hash de senha para uso no seed

## Documentação Adicional

Consulte a pasta `docs/` para documentação detalhada:
- `ARCHITECTURE.md`: Arquitetura e decisões técnicas
- `BUSINESS_RULES.md`: Regras de negócio detalhadas
- `API_DOCS.md`: Documentação das APIs
- `DATABASE_SCHEMA.md`: Schema do banco de dados
- `DEPLOYMENT.md`: Guia de deploy

## Deploy na Vercel

1. Conecte seu repositório Git à Vercel
2. Configure as variáveis de ambiente na Vercel
3. O deploy será automático a cada push

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
