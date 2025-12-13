-- Migration: Corrigir enum perfil_usuario
-- 
-- Esta migration completa a correção do enum perfil_usuario que falhou parcialmente
-- na migration anterior. Remove 'conselho' e 'auditor' do enum.

-- 1. Verificar se o enum ainda tem 'conselho' ou 'auditor' e recriar se necessário
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
      -- Primeiro, remove o valor padrão
      ALTER TABLE users 
        ALTER COLUMN perfil DROP DEFAULT;
      
      -- Depois, altera o tipo da coluna
      ALTER TABLE users 
        ALTER COLUMN perfil TYPE perfil_usuario_new 
        USING perfil::text::perfil_usuario_new;
      
      -- Por fim, restaura o valor padrão com o novo tipo
      ALTER TABLE users 
        ALTER COLUMN perfil SET DEFAULT 'morador'::perfil_usuario_new;
    END IF;

    -- Remove o enum antigo
    DROP TYPE IF EXISTS perfil_usuario;

    -- Renomeia o novo enum para o nome original
    ALTER TYPE perfil_usuario_new RENAME TO perfil_usuario;
  END IF;
END $$;

-- 2. Definir tipoUsuario para usuários moradores existentes que não têm tipo definido
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'tipo_usuario'
  ) THEN
    UPDATE users 
    SET tipo_usuario = 'proprietario'::tipo_usuario
    WHERE perfil = 'morador'::perfil_usuario 
    AND tipo_usuario IS NULL;
  END IF;
END $$;
