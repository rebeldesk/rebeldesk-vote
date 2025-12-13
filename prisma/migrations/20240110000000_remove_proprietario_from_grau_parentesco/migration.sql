-- Migration: Remove 'Proprietario' do enum grau_parentesco
-- 
-- Proprietário não é um grau de parentesco, então removemos essa opção.
-- Registros existentes com 'Proprietario' serão convertidos para 'Outro'.

-- Primeiro, atualiza todos os registros existentes de 'Proprietario' para 'Outro'
-- (apenas se a tabela existir e houver registros com 'Proprietario')
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moradores') THEN
    UPDATE moradores 
    SET grau_parentesco = 'Outro' 
    WHERE grau_parentesco = 'Proprietario';
  END IF;
END $$;

-- Agora precisamos recriar o enum sem 'Proprietario'
-- Como não podemos alterar um enum diretamente no PostgreSQL, precisamos:
-- 1. Verificar se o enum existe e tem 'Proprietario'
-- 2. Se sim, criar um novo enum sem 'Proprietario'
-- 3. Alterar a coluna para usar o novo enum
-- 4. Remover o enum antigo
-- 5. Renomear o novo enum

DO $$ 
BEGIN
  -- Verifica se o enum existe e se tem 'Proprietario'
  IF EXISTS (
    SELECT 1 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'grau_parentesco' 
    AND e.enumlabel = 'Proprietario'
  ) THEN
    -- Cria novo enum sem 'Proprietario'
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grau_parentesco_new') THEN
      CREATE TYPE grau_parentesco_new AS ENUM ('Conjuge', 'Filho', 'Pai', 'Mae', 'Outro');
    END IF;

    -- Altera a coluna para usar o novo enum (apenas se a tabela existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moradores') THEN
      ALTER TABLE moradores 
        ALTER COLUMN grau_parentesco TYPE grau_parentesco_new 
        USING grau_parentesco::text::grau_parentesco_new;
    END IF;

    -- Remove o enum antigo
    DROP TYPE IF EXISTS grau_parentesco;

    -- Renomeia o novo enum para o nome original
    ALTER TYPE grau_parentesco_new RENAME TO grau_parentesco;
  END IF;
END $$;
