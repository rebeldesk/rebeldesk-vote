-- Migration: Reestruturar Perfis e Adicionar Tipo/Status de Usuário
-- 
-- Esta migration:
-- 1. Remove 'conselho' e 'auditor' do enum perfil_usuario
-- 2. Adiciona enum tipo_usuario (proprietario, inquilino)
-- 3. Adiciona campos conselheiro, tipo_usuario, procuracao_ativa na tabela users
-- 4. Migra dados existentes (conselho -> morador com conselheiro=true, auditor -> morador)
-- 5. Adiciona campo procuracao_ativa na tabela unidades

-- 1. Criar enum tipo_usuario (idempotente)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario') THEN
    CREATE TYPE tipo_usuario AS ENUM ('proprietario', 'inquilino');
  END IF;
END $$;

-- 2. Adicionar novos campos na tabela users (idempotente)
DO $$ 
BEGIN
  -- Adicionar conselheiro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'conselheiro'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN conselheiro BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Adicionar tipo_usuario
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'tipo_usuario'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN tipo_usuario tipo_usuario;
  END IF;

  -- Adicionar procuracao_ativa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'procuracao_ativa'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN procuracao_ativa BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3. Migrar dados existentes: conselho -> morador com conselheiro = true
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'perfil'
  ) THEN
    UPDATE users 
    SET perfil = 'morador'::perfil_usuario, conselheiro = true 
    WHERE perfil = 'conselho'::perfil_usuario;
  END IF;
END $$;

-- 4. Migrar dados existentes: auditor -> morador (sem conselho)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'perfil'
  ) THEN
    UPDATE users 
    SET perfil = 'morador'::perfil_usuario, conselheiro = false 
    WHERE perfil = 'auditor'::perfil_usuario;
  END IF;
END $$;

-- 5. Recriar enum perfil_usuario sem conselho e auditor
-- Como não podemos alterar um enum diretamente no PostgreSQL, precisamos:
-- 1. Criar um novo enum sem 'conselho' e 'auditor'
-- 2. Alterar a coluna para usar o novo enum
-- 3. Remover o enum antigo
-- 4. Renomear o novo enum
DO $$ 
BEGIN
  -- Verifica se o enum existe e se tem 'conselho' ou 'auditor'
  IF EXISTS (
    SELECT 1 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'perfil_usuario' 
    AND (e.enumlabel = 'conselho' OR e.enumlabel = 'auditor')
  ) THEN
    -- Cria novo enum sem 'conselho' e 'auditor'
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario_new') THEN
      CREATE TYPE perfil_usuario_new AS ENUM ('staff', 'morador');
    END IF;

    -- Altera a coluna para usar o novo enum (apenas se a tabela existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
      ALTER TABLE users 
        ALTER COLUMN perfil TYPE perfil_usuario_new 
        USING perfil::text::perfil_usuario_new;
    END IF;

    -- Remove o enum antigo
    DROP TYPE IF EXISTS perfil_usuario;

    -- Renomeia o novo enum para o nome original
    ALTER TYPE perfil_usuario_new RENAME TO perfil_usuario;
  END IF;
END $$;

-- 6. Adicionar campo procuracao_ativa na tabela unidades (idempotente)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'unidades' AND column_name = 'procuracao_ativa'
  ) THEN
    ALTER TABLE unidades 
    ADD COLUMN procuracao_ativa BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Comentários nas colunas
COMMENT ON COLUMN users.conselheiro IS 'Indica se o morador é membro do conselho';
COMMENT ON COLUMN users.tipo_usuario IS 'Tipo de usuário morador: proprietario ou inquilino';
COMMENT ON COLUMN users.procuracao_ativa IS 'Indica se o inquilino tem procuração ativa para votar';
COMMENT ON COLUMN unidades.procuracao_ativa IS 'Indica se existe inquilino com procuração ativa nesta unidade';
