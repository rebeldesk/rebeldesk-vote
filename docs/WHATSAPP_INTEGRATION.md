# Integração WhatsApp

Este documento descreve a integração do sistema de votação com WhatsApp usando Evolution API, permitindo que moradores consultem votações abertas e votem diretamente pelo WhatsApp.

## Visão Geral

A integração WhatsApp permite que moradores:
- Consultem votações abertas via WhatsApp
- Votem diretamente pelo WhatsApp usando menu interativo
- Recebam confirmações de voto

## Arquitetura

```
Morador → WhatsApp → Evolution API → Webhook → Sistema → Processamento → Resposta
```

### Componentes

1. **Evolution API**: Serviço que gerencia a conexão com WhatsApp
2. **Webhook**: Endpoint que recebe mensagens do Evolution API (`/api/whatsapp/webhook`)
3. **Message Handler**: Processa mensagens e gerencia fluxo de conversação
4. **Verification System**: Sistema de verificação com código de 6 dígitos
5. **Database**: Armazena sessões e rastreamento de votos via WhatsApp

## Configuração

### 1. Evolution API

Configure a Evolution API conforme a documentação oficial. Você pode usar:
- Evolution API self-hosted (Docker)
- Evolution API cloud (serviço gerenciado)

### 2. Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
# Evolution API
EVOLUTION_API_URL=https://api.evolution.com
EVOLUTION_API_KEY=sua_api_key_aqui
EVOLUTION_INSTANCE_NAME=nome_da_instancia
WHATSAPP_WEBHOOK_SECRET=secret_para_validar_webhooks
```

### 3. Configurar Webhook

No Evolution API, configure o webhook para apontar para:
```
https://seu-dominio.com/api/whatsapp/webhook
```

### 4. Executar Migrations

Execute a migration para criar as tabelas necessárias:

```bash
# Via Prisma
npx prisma migrate dev

# Ou via SQL direto
psql -d seu_banco < supabase/migrations/002_add_whatsapp_tables.sql
```

## Fluxo de Funcionamento

### 1. Primeira Interação (Verificação)

1. Morador envia qualquer mensagem para o número do WhatsApp
2. Sistema busca usuário pelo telefone cadastrado
3. Se encontrado:
   - Gera código de verificação de 6 dígitos
   - Envia código por WhatsApp
   - Armazena código com expiração (5 minutos)
4. Se não encontrado:
   - Informa que precisa estar cadastrado

### 2. Verificação do Código

1. Morador envia código recebido
2. Sistema valida:
   - Código correto
   - Código não expirado
   - Rate limiting (máximo 3 tentativas)
3. Se válido:
   - Marca sessão como verificada
   - Mostra menu principal
4. Se inválido:
   - Incrementa tentativas
   - Informa erro
   - Após 3 tentativas: bloqueia por 15 minutos

### 3. Menu Principal

Após verificação, mostra menu com botões:
- **Ver Votações**: Lista votações abertas
- **Ajuda**: Mostra comandos disponíveis

### 4. Listar Votações

1. Morador clica em "Ver Votações"
2. Sistema busca votações com:
   - `status = 'aberta'`
   - Dentro do período (data_inicio <= agora <= data_fim)
   - Unidade ainda não votou
3. Envia lista formatada com botões para cada votação

### 5. Votar

1. Morador seleciona uma votação
2. Sistema busca opções da votação
3. Envia opções com botões interativos:
   - **Escolha única**: Botões para cada opção (máximo 3)
   - **Múltipla escolha**: Lista de opções (máximo 10)
4. Morador seleciona opção(ões)
5. Sistema valida:
   - Votação ainda está aberta
   - Unidade ainda não votou
   - Opções válidas
6. Registra voto no banco
7. Confirma voto registrado

## Estrutura de Dados

### Tabela: `whatsapp_sessions`

Armazena sessões ativas e códigos de verificação:

- `id`: UUID (PK)
- `telefone`: VARCHAR(20) (UNIQUE) - Número do WhatsApp
- `usuario_id`: UUID (FK) - Usuário vinculado
- `codigo_verificacao`: VARCHAR(10) - Código temporário
- `codigo_expira_em`: TIMESTAMP - Expiração do código
- `verificado_em`: TIMESTAMP - Quando foi verificado
- `tentativas_verificacao`: INTEGER - Contador de tentativas
- `ultima_tentativa_em`: TIMESTAMP - Última tentativa
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Tabela: `whatsapp_votos`

Rastreia votos feitos via WhatsApp (auditoria):

- `id`: UUID (PK)
- `voto_id`: UUID (FK) - Referência ao voto em `votos`
- `telefone`: VARCHAR(20) - Número que votou
- `mensagem_recebida`: TEXT - Mensagem original
- `created_at`: TIMESTAMP

## Comandos Disponíveis

### Comandos de Texto

- `menu` - Mostra menu principal
- `votacoes` - Lista votações disponíveis
- `ajuda` ou `help` - Mostra ajuda

### Interações

- Botões do menu principal
- Seleção de votação
- Seleção de opções de voto

## Segurança

### Rate Limiting

- **Código de verificação**: Máximo 3 tentativas
- **Bloqueio**: 15 minutos após 3 tentativas falhas
- **Expiração**: Código expira em 5 minutos

### Validações

- Telefone deve estar cadastrado no sistema
- Usuário deve ter unidade vinculada
- Votação deve estar aberta
- Unidade não pode votar duas vezes na mesma votação

### Auditoria

- Todos os votos via WhatsApp são rastreados em `whatsapp_votos`
- Mensagem original é armazenada para auditoria
- Sessões são registradas com timestamps

## API Endpoints

### POST `/api/whatsapp/webhook`

Recebe webhooks do Evolution API.

**Body** (formato Evolution API):
```json
{
  "data": {
    "key": {
      "remoteJid": "5511987654321@c.us"
    },
    "message": {
      "conversation": "mensagem de texto"
    }
  }
}
```

**Resposta**:
```json
{
  "success": true
}
```

### GET `/api/whatsapp/webhook`

Health check do webhook.

**Resposta**:
```json
{
  "status": "ok",
  "service": "whatsapp-webhook"
}
```

## Troubleshooting

### Mensagens não são recebidas

1. Verifique se o webhook está configurado no Evolution API
2. Verifique se `EVOLUTION_API_URL` está correto
3. Verifique logs do servidor para erros

### Código de verificação não chega

1. Verifique se `EVOLUTION_API_KEY` está correto
2. Verifique se `EVOLUTION_INSTANCE_NAME` está correto
3. Verifique logs do Evolution API

### Voto não é registrado

1. Verifique se a votação está aberta
2. Verifique se a unidade já não votou
3. Verifique logs do servidor para erros de validação

### Erro "Telefone não cadastrado"

1. Certifique-se de que o telefone está cadastrado no sistema
2. Verifique se o formato do telefone está correto (normalização automática)
3. Telefone deve estar no campo `telefone` do usuário

## Limitações

- **Botões**: Máximo 3 botões por mensagem (limite do WhatsApp)
- **Lista**: Máximo 10 itens por lista (limite do WhatsApp)
- **Texto**: Mensagens limitadas a 4096 caracteres
- **Múltipla escolha**: Requer múltiplas interações (não suporta seleção múltipla em uma única mensagem)

## Melhorias Futuras

- [ ] Suporte a seleção múltipla em uma única interação
- [ ] Notificações push quando nova votação é aberta
- [ ] Histórico de votações do morador
- [ ] Confirmação de voto com comprovante
- [ ] Suporte a mídia (imagens, documentos)

## Referências

- [Evolution API Documentation](https://doc.evolution-api.com/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

