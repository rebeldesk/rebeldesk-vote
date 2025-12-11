# Arquitetura do Sistema

## Visão Geral

O sistema de votação condominial é uma aplicação web full-stack construída com:

- **Frontend**: Next.js 14+ (App Router) com React 19 e TypeScript
- **Backend**: API Routes do Next.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: NextAuth.js v5 (beta) com provider customizado
- **Estilização**: Tailwind CSS 4
- **Validação**: Zod + React Hook Form

## Arquitetura de Camadas

```
┌─────────────────────────────────────┐
│         Frontend (Next.js)           │
│  ┌─────────────┐  ┌──────────────┐ │
│  │   Pages     │  │  Components  │ │
│  └──────┬──────┘  └──────┬───────┘ │
│         │                │          │
│  ┌──────▼────────────────▼───────┐ │
│  │      API Routes                │ │
│  └──────┬────────────────────────┘ │
└─────────┼──────────────────────────┘
          │
┌─────────▼──────────────────────────┐
│      Business Logic (lib/)         │
│  ┌────────────┐  ┌──────────────┐ │
│  │    db.ts   │  │   auth.ts    │ │
│  └──────┬─────┘  └──────┬───────┘ │
└─────────┼────────────────┼────────┘
          │                │
┌─────────▼────────────────▼────────┐
│      Supabase (PostgreSQL)        │
└───────────────────────────────────┘
```

## Fluxo de Dados

### Autenticação

1. Usuário faz login na página `/login`
2. `LoginForm` envia credenciais para NextAuth
3. NextAuth chama `authorize` em `lib/auth.ts`
4. `authorize` busca usuário no banco e verifica senha
5. NextAuth cria sessão JWT e retorna
6. Middleware protege rotas baseado em perfil

### Criação de Votação

1. Admin acessa `/votacoes/nova`
2. Preenche formulário (`VotingForm`)
3. Submete para `/api/votacoes` (POST)
4. API valida dados com Zod
5. Cria votação e opções em transação
6. Retorna votação criada

### Processo de Votação

1. Morador acessa `/votacoes`
2. Vê lista de votações abertas
3. Clica em "Votar" em uma votação
4. Sistema verifica se unidade já votou
5. Morador seleciona opção(ões)
6. Submete para `/api/votacoes/[id]/votos` (POST)
7. Sistema valida e registra voto
8. Confirma sucesso

## Decisões Arquiteturais

### Por que Next.js App Router?
- Server Components por padrão (melhor performance)
- Roteamento baseado em arquivos (simples e intuitivo)
- Suporte nativo a layouts e grupos de rotas
- API Routes integradas

### Por que NextAuth.js?
- Framework maduro para autenticação
- Suporte a múltiplos providers
- Gerenciamento de sessão automático
- Middleware de proteção de rotas

### Por que Supabase?
- PostgreSQL gerenciado (confiável)
- API REST automática
- Cliente TypeScript com tipos gerados
- Migrations versionadas
- Fácil deploy e escalabilidade

### Por que Autenticação Customizada?
- Controle total sobre fluxo de autenticação
- Integração com estrutura de usuários existente
- Flexibilidade para regras de negócio específicas
- Não depende de serviços externos de auth

## Estrutura de Dados

### Relacionamentos

```
users (1) ──┐
            │
            ├── (N) votacoes (criado_por)
            │
            └── (N) votos (user_id, apenas se rastreado)

unidades (1) ──┐
                │
                ├── (N) users (unidade_id)
                │
                └── (N) votos (unidade_id)

votacoes (1) ──┬── (N) opcoes_votacao
               │
               └── (N) votos
```

### Constraints Importantes

1. **UNIQUE(votacao_id, unidade_id)** em `votos`
   - Garante 1 voto por unidade por votação

2. **CHECK (data_fim > data_inicio)** em `votacoes`
   - Valida período de votação

3. **Foreign Keys com CASCADE**
   - Excluir votação exclui opções e votos
   - Excluir unidade exclui votos

## Segurança

### Autenticação
- Senhas hasheadas com bcrypt (10 salt rounds)
- Tokens JWT assinados e verificados pelo NextAuth
- Sessões não persistem no banco (JWT stateless)

### Autorização
- Middleware verifica autenticação
- Layouts verificam perfil do usuário
- APIs validam permissões em cada endpoint

### Validação
- Zod schemas em todos os inputs
- Validação no cliente (UX) e servidor (segurança)
- Sanitização automática do Supabase

### Exposição de Dados
- `password_hash` nunca retornado em APIs
- Service role key apenas server-side
- Variáveis de ambiente para secrets

## Performance

### Otimizações
- Server Components reduzem JavaScript no cliente
- Cache de queries quando apropriado
- Índices no banco para queries frequentes
- Lazy loading de componentes pesados

### Escalabilidade
- Stateless authentication (JWT)
- Supabase escala automaticamente
- Next.js otimiza builds e runtime
- Vercel Edge Network para deploy global

## Padrões de Código

### Server vs Client Components
- **Server Components** (padrão): Para dados, SEO, performance
- **Client Components** ('use client'): Para interatividade, hooks, eventos

### Error Handling
- Try/catch em todas as operações assíncronas
- Mensagens de erro descritivas para usuário
- Logs detalhados para debugging
- Fallbacks para estados de erro

### Type Safety
- TypeScript strict mode
- Tipos explícitos em funções públicas
- Interfaces para estruturas de dados
- Tipos do NextAuth estendidos

## Deploy

### Vercel
- Deploy automático via Git
- Variáveis de ambiente configuradas
- Preview deployments para PRs
- Analytics e monitoring integrados

### Supabase
- Database migrations executadas manualmente
- Seed script para dados iniciais
- Backups automáticos
- Monitoring via dashboard

## Futuras Melhorias

1. **Cache**: Implementar cache de resultados de votação
2. **Notificações**: Email quando nova votação é criada
3. **Exportação**: PDF/Excel dos resultados
4. **Auditoria**: Log de todas as ações administrativas
5. **Testes**: Unit e integration tests
6. **PWA**: Suporte offline básico

