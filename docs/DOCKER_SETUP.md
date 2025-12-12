# Configuração do Banco de Dados Local com Docker

Este guia explica como configurar e usar o PostgreSQL local via Docker para desenvolvimento, incluindo o Evolution API.

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 22+ (gerenciado via nvm)

## Serviços Incluídos

O `docker-compose.yml` configura três serviços:

1. **PostgreSQL**: Banco de dados compartilhado
   - Banco `votacao_db`: Para o sistema de votação
   - Banco `evolution_db`: Para o Evolution API
   - Porta: `5432`
2. **Redis**: Cache e armazenamento em memória para o Evolution API
   - Porta: `6379`
3. **Evolution API**: API de WhatsApp
   - Porta: `8080`

## Passo a Passo

### 1. Iniciar os Serviços

```bash
docker compose up -d
```

Isso irá:
- Criar um container PostgreSQL 16 com dois bancos de dados
- Criar um container Redis 7 para cache
- Criar o container Evolution API conectado ao PostgreSQL e Redis
- Expor as portas 5432 (PostgreSQL), 6379 (Redis) e 8080 (Evolution API)
- Criar volumes persistentes para os dados

### 2. Configurar o Banco de Dados

Execute o script de setup para criar as tabelas e dados iniciais:

```bash
./scripts/setup-local-db.sh
```

Ou manualmente:

```bash
# Executar migration
docker exec -i projeto_votacao_db psql -U postgres -d votacao_db < supabase/migrations/001_initial_schema.sql

# Executar seed (opcional)
docker exec -i projeto_votacao_db psql -U postgres -d votacao_db < supabase/seed.sql
```

### 3. Configurar Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/votacao_db
```

**Credenciais padrão:**
- Usuário: `postgres`
- Senha: `postgres`
- Banco: `votacao_db`
- Host: `localhost`
- Porta: `5432`

### 4. Verificar Conexão

Teste a conexão com o banco:

```bash
npm run dev
```

Ou use o script de teste:

```bash
node scripts/test-db-connection.js
```

## Evolution API

O Evolution API está configurado para usar o PostgreSQL e Redis, e será iniciado automaticamente após ambos estarem prontos.

- **URL**: http://localhost:8080
- **Banco de dados**: `evolution_db` (criado automaticamente)
- **Redis**: Configurado para usar o banco 6 com prefixo `evolution`
- **Configuração**: As variáveis de ambiente estão definidas no `docker-compose.yml`

### Verificar se o Evolution API está rodando

```bash
curl http://localhost:8080
```

### Ver logs do Evolution API

```bash
docker compose logs -f evolution-api
```

### Ver logs do Redis

```bash
docker compose logs -f redis
```

### Acessar o Redis via CLI

```bash
docker exec -it evolution_redis redis-cli
```

## Comandos Úteis

### Parar todos os serviços
```bash
docker compose down
```

### Parar e remover volumes (apaga todos os dados)
```bash
docker compose down -v
```

### Ver logs do banco
```bash
docker compose logs -f postgres
```

### Ver logs do Evolution API
```bash
docker compose logs -f evolution-api
```

### Ver logs de todos os serviços
```bash
docker compose logs -f
```

### Acessar o banco via psql
```bash
docker exec -it projeto_votacao_db psql -U postgres -d votacao_db
```

### Acessar o banco do Evolution API
```bash
docker exec -it projeto_votacao_db psql -U postgres -d evolution_db
```

### Reiniciar um serviço específico
```bash
docker compose restart postgres
docker compose restart redis
docker compose restart evolution-api
```

### Reiniciar todos os serviços
```bash
docker compose restart
```

## Credenciais do Usuário Admin

Após executar o seed, você pode fazer login com:

- **Email**: `admin@condominio.com`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

## Solução de Problemas

### Erro: "port 5432 is already allocated"

Outro serviço está usando a porta 5432. Você pode:
1. Parar o outro serviço
2. Alterar a porta no `docker-compose.yml` (ex: `"5433:5432"`)

### Erro: "connection refused"

Verifique se os containers estão rodando:
```bash
docker ps
```

Se não estiverem, inicie com:
```bash
docker compose up -d
```

### Evolution API não conecta ao banco ou Redis

Verifique se os serviços estão saudáveis:
```bash
docker compose ps
```

O Evolution API aguarda o PostgreSQL e Redis estarem `healthy` antes de iniciar. Se houver problemas, verifique os logs:
```bash
docker compose logs postgres
docker compose logs redis
docker compose logs evolution-api
```

### Erro: "redis disconnected"

Se você ver erros de Redis desconectado:
1. Verifique se o Redis está rodando: `docker compose ps redis`
2. Verifique os logs: `docker compose logs redis`
3. Reinicie o Redis: `docker compose restart redis`
4. Certifique-se de que o Evolution API está aguardando o Redis estar saudável (já configurado no `depends_on`)

### Resetar tudo completamente

```bash
docker compose down -v
docker compose up -d
./scripts/setup-local-db.sh
```

⚠️ **Atenção**: Isso apagará todos os dados, incluindo do Evolution API!

## Diferenças entre Banco Local e Supabase

- **Local (Docker)**: Ideal para desenvolvimento, sem custos, controle total
- **Supabase**: Usado em produção/staging, tem features extras (auth, storage, etc.)

Você pode alternar entre eles mudando apenas a `DATABASE_URL` no `.env.local`.
