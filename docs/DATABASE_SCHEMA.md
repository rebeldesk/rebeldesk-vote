# Schema do Banco de Dados

Este documento descreve a estrutura completa do banco de dados do sistema.

## Tabelas

### `unidades`

Armazena as unidades do condomínio (apartamentos, casas, etc.).

**IMPORTANTE**: Uma unidade pode ter múltiplos moradores ao longo do tempo (aluguel/venda), mas apenas um voto por unidade é permitido por votação. O histórico de votos é mantido pela unidade, não pelo usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `numero` | VARCHAR(50) | Número da unidade (único) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

**Índices**:
- `numero` (UNIQUE)

---

### `users`

Armazena os usuários do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `email` | VARCHAR(255) | Email do usuário (único) |
| `password_hash` | TEXT | Hash da senha (bcrypt) |
| `nome` | VARCHAR(255) | Nome completo |
| `telefone` | VARCHAR(20) | Telefone (opcional) |
| `perfil` | ENUM | Perfil: 'staff', 'conselho', 'auditor', 'morador' |
| `unidade_id` | UUID (FK) | Unidade vinculada (nullable) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

**Relacionamentos**:
- `unidade_id` → `unidades.id` (ON DELETE SET NULL)

**Índices**:
- `email` (UNIQUE)
- `unidade_id`

**Enums**:
- `perfil_usuario`: 'staff', 'conselho', 'auditor', 'morador'

---

### `votacoes`

Armazena as votações criadas no sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `titulo` | VARCHAR(255) | Título da votação |
| `descricao` | TEXT | Descrição detalhada (opcional) |
| `tipo` | ENUM | Tipo: 'escolha_unica' ou 'multipla_escolha' |
| `modo_auditoria` | ENUM | Modo: 'anonimo' ou 'rastreado' |
| `criado_por` | UUID (FK) | Usuário que criou |
| `data_inicio` | TIMESTAMP | Data/hora de início |
| `data_fim` | TIMESTAMP | Data/hora de término |
| `status` | ENUM | Status: 'rascunho', 'aberta', 'encerrada' |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

**Relacionamentos**:
- `criado_por` → `users.id` (ON DELETE RESTRICT)

**Constraints**:
- `CHECK (data_fim > data_inicio)`: Data de término deve ser posterior à de início

**Índices**:
- `status`
- `criado_por`

**Enums**:
- `tipo_votacao`: 'escolha_unica', 'multipla_escolha'
- `modo_auditoria`: 'anonimo', 'rastreado'
- `status_votacao`: 'rascunho', 'aberta', 'encerrada'

---

### `opcoes_votacao`

Armazena as opções de cada votação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `votacao_id` | UUID (FK) | Votação a que pertence |
| `texto` | VARCHAR(500) | Texto da opção |
| `ordem` | INTEGER | Ordem de exibição |
| `created_at` | TIMESTAMP | Data de criação |

**Relacionamentos**:
- `votacao_id` → `votacoes.id` (ON DELETE CASCADE)

**Índices**:
- `votacao_id`

---

### `votos`

Armazena os votos registrados.

**IMPORTANTE**: O voto é vinculado à unidade, não ao usuário. Isso permite que quando um morador muda (aluguel/venda), a unidade mantenha seu histórico de votos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | Identificador único |
| `votacao_id` | UUID (FK) | Votação |
| `unidade_id` | UUID (FK) | Unidade que votou |
| `opcao_id` | UUID (FK) | Opção escolhida (para escolha única) |
| `opcoes_ids` | JSONB | Array de IDs de opções (para múltipla escolha) |
| `user_id` | UUID (FK) | Usuário que votou (apenas se modo_auditoria = 'rastreado') |
| `created_at` | TIMESTAMP | Data/hora do voto |

**Relacionamentos**:
- `votacao_id` → `votacoes.id` (ON DELETE CASCADE)
- `unidade_id` → `unidades.id` (ON DELETE CASCADE)
- `opcao_id` → `opcoes_votacao.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE SET NULL)

**Constraints**:
- `UNIQUE(votacao_id, unidade_id)`: Garante 1 voto por unidade por votação

**Índices**:
- `votacao_id`
- `unidade_id`
- `user_id`

**Notas**:
- `opcao_id`: Preenchido apenas para votações de escolha única
- `opcoes_ids`: Preenchido para votações de múltipla escolha (array JSON)
- `user_id`: Preenchido apenas se `modo_auditoria = 'rastreado'`

---

## Diagrama de Relacionamentos

```
┌──────────┐
│ unidades │
└────┬─────┘
     │
     │ 1:N
     │
┌────▼─────┐      ┌──────────┐
│  users   │      │ votacoes │
└────┬─────┘      └────┬──────┘
     │                │
     │ N:1            │ 1:N
     │                │
     │                │
┌────▼─────┐      ┌──▼──────────────┐
│  votos   │      │ opcoes_votacao  │
└──────────┘      └─────────────────┘
     │
     │ N:1
     │
┌────▼─────┐
│ unidades │
└──────────┘
```

## Regras de Negócio no Banco

### Constraints

1. **Unicidade de Email**: `users.email` é UNIQUE
2. **Unicidade de Número de Unidade**: `unidades.numero` é UNIQUE
3. **Um Voto por Unidade**: `UNIQUE(votacao_id, unidade_id)` em `votos`
4. **Período Válido**: `data_fim > data_inicio` em `votacoes`

### Triggers

**`update_updated_at_column()`**: Atualiza automaticamente `updated_at` quando um registro é modificado.

Aplicado em:
- `users`
- `unidades`
- `votacoes`

### CASCADE Rules

- Excluir votação → exclui opções e votos
- Excluir unidade → exclui votos da unidade
- Excluir opção → não afeta votos (opcao_id pode ser NULL)

### SET NULL Rules

- Excluir unidade → `users.unidade_id` vira NULL
- Excluir usuário → `votos.user_id` vira NULL (se rastreado)

## Migrations

As migrations estão em `supabase/migrations/001_initial_schema.sql`.

Para aplicar:
1. Acesse o SQL Editor no Supabase
2. Execute o arquivo de migration
3. Execute `supabase/seed.sql` para dados iniciais

## Seed Data

O arquivo `supabase/seed.sql` cria:
- Unidades de exemplo (101, 102, 201, 202, 301, 302)
- Usuário admin inicial (admin@condominio.com / admin123)

**IMPORTANTE**: Altere a senha do admin após o primeiro login!

## Backup e Restore

O Supabase gerencia backups automaticamente. Para backup manual:

```sql
-- Exportar schema
pg_dump -h [host] -U [user] -d [database] --schema-only > schema.sql

-- Exportar dados
pg_dump -h [host] -U [user] -d [database] --data-only > data.sql
```

## Performance

### Índices Criados

- `idx_users_email`: Busca rápida por email
- `idx_users_unidade_id`: Join com unidades
- `idx_votacoes_status`: Filtro por status
- `idx_votacoes_criado_por`: Join com criador
- `idx_opcoes_votacao_votacao_id`: Join com votação
- `idx_votos_votacao_id`: Agregação de votos
- `idx_votos_unidade_id`: Verificação de voto existente
- `idx_votos_user_id`: Auditoria de votos rastreados

### Otimizações Futuras

1. Índice composto em `(votacao_id, unidade_id)` para verificação rápida
2. Materialized views para resultados de votação
3. Particionamento de `votos` por data (se volume crescer)

