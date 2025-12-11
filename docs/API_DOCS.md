# Documentação da API

Todas as rotas da API estão em `/app/api/` e seguem o padrão REST.

## Autenticação

Todas as rotas (exceto `/api/auth`) requerem autenticação via NextAuth.
O token JWT é enviado automaticamente via cookies.

## Rotas Disponíveis

### Autenticação

#### `POST /api/auth/[...nextauth]`
Rota do NextAuth para gerenciar autenticação (login, logout, callback).

**Não documentada aqui** - gerenciada pelo NextAuth.js.

---

### Usuários

#### `GET /api/usuarios`
Lista todos os usuários.

**Permissões**: Staff, Conselho

**Resposta**:
```json
[
  {
    "id": "uuid",
    "email": "usuario@email.com",
    "nome": "Nome do Usuário",
    "telefone": "(11) 99999-9999",
    "perfil": "morador",
    "unidade_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "unidades": {
      "id": "uuid",
      "numero": "101"
    }
  }
]
```

#### `POST /api/usuarios`
Cria um novo usuário.

**Permissões**: Staff, Conselho

**Body**:
```json
{
  "email": "usuario@email.com",
  "senha": "senha123",
  "nome": "Nome do Usuário",
  "telefone": "(11) 99999-9999",
  "perfil": "morador",
  "unidade_id": "uuid" // opcional, pode ser null
}
```

**Resposta**: 201 Created
```json
{
  "id": "uuid",
  "email": "usuario@email.com",
  "nome": "Nome do Usuário",
  // ... outros campos (sem password_hash)
}
```

**Erros**:
- 400: Dados inválidos
- 409: Email já cadastrado
- 403: Não autorizado

#### `GET /api/usuarios/[id]`
Busca um usuário por ID.

**Permissões**: Staff, Conselho

**Resposta**: 200 OK
```json
{
  "id": "uuid",
  "email": "usuario@email.com",
  // ... outros campos
}
```

#### `PUT /api/usuarios/[id]`
Atualiza um usuário.

**Permissões**: Staff, Conselho

**Body** (todos os campos opcionais):
```json
{
  "email": "novo@email.com",
  "nome": "Novo Nome",
  "telefone": "(11) 88888-8888",
  "perfil": "conselho",
  "unidade_id": "uuid"
}
```

**Resposta**: 200 OK

#### `DELETE /api/usuarios/[id]`
Exclui um usuário.

**Permissões**: Staff apenas

**Resposta**: 200 OK
```json
{
  "success": true
}
```

**Erros**:
- 400: Tentativa de excluir próprio usuário
- 403: Não autorizado

---

### Unidades

#### `GET /api/unidades`
Lista todas as unidades.

**Permissões**: Staff, Conselho

**Resposta**: 200 OK
```json
[
  {
    "id": "uuid",
    "numero": "101",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### `POST /api/unidades`
Cria uma nova unidade.

**Permissões**: Staff, Conselho

**Body**:
```json
{
  "numero": "101"
}
```

**Resposta**: 201 Created

**Erros**:
- 400: Dados inválidos
- 409: Número já cadastrado

---

### Votações

#### `GET /api/votacoes`
Lista todas as votações.

**Permissões**: Autenticado

**Resposta**: 200 OK
```json
[
  {
    "id": "uuid",
    "titulo": "Título da Votação",
    "descricao": "Descrição...",
    "tipo": "escolha_unica",
    "modo_auditoria": "anonimo",
    "criado_por": "uuid",
    "data_inicio": "2024-01-01T00:00:00Z",
    "data_fim": "2024-01-31T23:59:59Z",
    "status": "aberta",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "criado_por_user": {
      "id": "uuid",
      "nome": "Nome",
      "email": "email@email.com"
    }
  }
]
```

#### `POST /api/votacoes`
Cria uma nova votação.

**Permissões**: Staff, Conselho

**Body**:
```json
{
  "titulo": "Título da Votação",
  "descricao": "Descrição opcional",
  "tipo": "escolha_unica", // ou "multipla_escolha"
  "modo_auditoria": "anonimo", // ou "rastreado"
  "data_inicio": "2024-01-01T00:00:00Z",
  "data_fim": "2024-01-31T23:59:59Z",
  "opcoes": ["Opção 1", "Opção 2", "Opção 3"] // mínimo 2
}
```

**Resposta**: 201 Created
```json
{
  "id": "uuid",
  "titulo": "Título da Votação",
  // ... outros campos
}
```

**Erros**:
- 400: Dados inválidos ou data_fim <= data_inicio
- 403: Não autorizado

#### `GET /api/votacoes/[id]`
Busca uma votação com suas opções.

**Permissões**: Autenticado

**Resposta**: 200 OK
```json
{
  "votacao": {
    "id": "uuid",
    "titulo": "Título",
    // ... outros campos
  },
  "opcoes": [
    {
      "id": "uuid",
      "votacao_id": "uuid",
      "texto": "Opção 1",
      "ordem": 0,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `PUT /api/votacoes/[id]`
Atualiza uma votação.

**Permissões**: Staff, Conselho

**Body** (todos opcionais):
```json
{
  "titulo": "Novo Título",
  "descricao": "Nova Descrição",
  "data_inicio": "2024-01-01T00:00:00Z",
  "data_fim": "2024-01-31T23:59:59Z",
  "status": "aberta" // "rascunho", "aberta", "encerrada"
}
```

**Resposta**: 200 OK

---

### Votos

#### `POST /api/votacoes/[id]/votos`
Registra um voto em uma votação.

**Permissões**: Autenticado (com unidade vinculada)

**Body**:
```json
{
  "opcoes_ids": ["uuid-opcao-1"] // array mesmo para escolha única
}
```

**Resposta**: 201 Created
```json
{
  "id": "uuid",
  "votacao_id": "uuid",
  "unidade_id": "uuid",
  "opcao_id": "uuid", // para escolha única
  "opcoes_ids": ["uuid"], // para múltipla escolha
  "user_id": "uuid", // apenas se modo_auditoria = 'rastreado'
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Erros**:
- 400: Unidade já votou, votação encerrada, opções inválidas
- 401: Não autenticado
- 403: Usuário sem unidade vinculada

#### `GET /api/votos?votacao_id=[id]`
Busca resultados detalhados de uma votação (auditoria).

**Permissões**: Staff, Conselho, Auditor

**Query Params**:
- `votacao_id`: ID da votação (obrigatório)

**Resposta**: 200 OK
```json
{
  "votacao": {
    // ... dados da votação
  },
  "opcoes": [
    {
      "opcao": {
        "id": "uuid",
        "texto": "Opção 1"
      },
      "votos": 10,
      "percentual": 50.0
    }
  ],
  "total_votos": 20,
  "votos_detalhados": [
    {
      "id": "uuid",
      "unidade_id": "uuid",
      "opcao_id": "uuid",
      "user_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ] // apenas se modo_auditoria = 'rastreado'
}
```

**Erros**:
- 400: votacao_id não fornecido
- 403: Não autorizado ou votação não é rastreada
- 404: Votação não encontrada

---

## Códigos de Status HTTP

- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos
- **401 Unauthorized**: Não autenticado
- **403 Forbidden**: Não autorizado (sem permissão)
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: email duplicado)
- **500 Internal Server Error**: Erro no servidor

## Tratamento de Erros

Todas as respostas de erro seguem o formato:

```json
{
  "error": "Mensagem de erro descritiva",
  "details": [] // opcional, para erros de validação Zod
}
```

## Rate Limiting

Atualmente não implementado. Recomendado para produção.

## Exemplos de Uso

### Criar Usuário
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "email": "novo@email.com",
    "senha": "senha123",
    "nome": "Novo Usuário",
    "perfil": "morador"
  }'
```

### Registrar Voto
```bash
curl -X POST http://localhost:3000/api/votacoes/uuid/votos \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "opcoes_ids": ["uuid-opcao-1"]
  }'
```

