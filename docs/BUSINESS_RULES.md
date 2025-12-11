# Regras de Negócio

Este documento detalha todas as regras de negócio do sistema de votação condominial.

## Perfis de Usuário

### Staff
- **Acesso**: Administrativo completo
- **Permissões**:
  - Cadastrar, editar e excluir usuários
  - Criar, editar e gerenciar votações
  - Visualizar e auditar resultados
  - Resetar senhas de usuários
- **Votação**: Não pode votar (não é morador)

### Conselho
- **Acesso**: Administrativo + Votante
- **Permissões**:
  - Criar, editar e gerenciar votações
  - Visualizar e auditar resultados
  - Votar em votações (se for morador)
- **Votação**: Pode votar se tiver unidade vinculada

### Auditor
- **Acesso**: Auditoria + Votante
- **Permissões**:
  - Visualizar resultados detalhados de votações
  - Ver quem votou em quê (apenas em votações rastreadas)
  - Votar em votações (se for morador)
- **Votação**: Pode votar se tiver unidade vinculada

### Morador
- **Acesso**: Apenas votante
- **Permissões**:
  - Visualizar votações disponíveis
  - Votar em votações abertas
- **Votação**: Pode votar

## Sistema de Unidades

### Conceito
- Uma **unidade** é uma propriedade física do condomínio (ex: apartamento 101)
- Um **morador** é uma pessoa que ocupa uma unidade
- Uma unidade pode ter múltiplos moradores ao longo do tempo (aluguel/venda)

### Regras
1. **Voto por Unidade**: Apenas um voto por unidade é permitido por votação
2. **Histórico Preservado**: Quando um morador muda, a unidade mantém seu histórico de votos
3. **Vinculação**: Um usuário pode estar vinculado a uma unidade (ou não, no caso de staff)
4. **Mudança de Morador**: Ao mudar o morador de uma unidade, apenas os dados do usuário mudam, não a unidade

## Votações

### Tipos de Votação

#### Escolha Única
- Votante seleciona apenas uma opção
- Exemplo: "Aprovar reforma do salão?" (Sim/Não)

#### Múltipla Escolha
- Votante pode selecionar múltiplas opções
- Exemplo: "Quais melhorias você prioriza?" (Opção A, B, C, D - pode escolher várias)

### Modos de Auditoria

#### Anônimo
- Votos não são rastreados por usuário
- Apenas contagem de votos por opção
- Privacidade total do votante

#### Rastreado
- Votos são vinculados ao usuário que votou
- Permite auditoria completa (quem votou em quê)
- Apenas usuários com permissão (staff, conselho, auditor) podem ver detalhes

### Status de Votação

#### Rascunho
- Votação criada mas ainda não aberta
- Pode ser editada
- Não aparece para votantes
- Não aceita votos

#### Aberta
- Votação ativa e recebendo votos
- Aparece para todos os moradores
- Não pode ser editada (apenas encerrada)
- Aceita votos dentro do período

#### Encerrada
- Votação finalizada
- Não aceita mais votos
- Resultados podem ser visualizados
- Não pode ser editada

### Regras de Votação

1. **Período**: Voto só é aceito entre data_inicio e data_fim
2. **Status**: Voto só é aceito se status = 'aberta'
3. **Unicidade**: Uma unidade só pode votar uma vez por votação
4. **Validação de Opções**:
   - Escolha única: exatamente 1 opção deve ser selecionada
   - Múltipla escolha: pelo menos 1 opção deve ser selecionada
5. **Rastreamento**: Se modo_auditoria = 'rastreado', user_id é obrigatório

## Validações e Restrições

### Usuários
- Email deve ser único
- Email deve ser válido
- Senha deve ter no mínimo 6 caracteres (recomendado)
- Telefone é opcional
- Unidade é opcional (staff pode não ter)

### Unidades
- Número da unidade deve ser único
- Número é obrigatório

### Votações
- Título é obrigatório
- Data fim deve ser posterior à data início
- Deve ter pelo menos 2 opções
- Criado por deve ser um usuário válido

### Votos
- Unidade deve existir
- Votação deve existir e estar aberta
- Opções selecionadas devem pertencer à votação
- Unidade não pode ter votado anteriormente na mesma votação

## Fluxos de Trabalho

### Criar Votação
1. Admin/Conselho cria votação (status: rascunho)
2. Define título, descrição, tipo, modo auditoria
3. Adiciona opções de votação
4. Define período (data início/fim)
5. Abre votação (status: aberta)
6. Votação fica disponível para votantes

### Votar
1. Morador visualiza votações abertas
2. Seleciona uma votação
3. Sistema verifica se unidade já votou
4. Sistema verifica se está no período
5. Morador seleciona opção(ões)
6. Sistema registra voto
7. Confirmação ao morador

### Encerrar Votação
1. Admin/Conselho acessa votação
2. Clica em "Encerrar"
3. Status muda para 'encerrada'
4. Votação não aceita mais votos
5. Resultados ficam disponíveis

### Auditar Resultados
1. Admin/Conselho/Auditor acessa resultados
2. Visualiza contagem de votos por opção
3. Se modo_auditoria = 'rastreado', pode ver detalhes:
   - Quem votou (usuário)
   - Em que opção votou
   - Quando votou
4. Exportação de resultados (futuro)

## Casos Especiais

### Mudança de Morador
- Quando um morador muda (aluguel/venda):
  1. Novo morador é cadastrado
  2. Vinculado à mesma unidade
  3. Unidade mantém histórico de votos anteriores
  4. Novo morador pode votar em novas votações

### Votação com Período Expirado
- Se data_fim passou mas status ainda é 'aberta':
  - Sistema não aceita novos votos
  - Admin deve encerrar manualmente
  - Sugestão: auto-encerrar (futuro)

### Múltiplos Perfis
- Um usuário pode ter apenas um perfil
- Se conselho/auditor for morador, pode votar
- Se staff não for morador, não pode votar

