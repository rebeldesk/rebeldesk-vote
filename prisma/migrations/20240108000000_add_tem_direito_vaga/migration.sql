-- Migration: Adiciona campo tem_direito_vaga na tabela unidades
-- 
-- Indica se a unidade tem direito a uma vaga de estacionamento.
-- Por padrão, unidades existentes terão direito a vaga (true).
-- Novas unidades terão false como padrão.

ALTER TABLE unidades 
ADD COLUMN tem_direito_vaga BOOLEAN NOT NULL DEFAULT true;

-- Atualiza o padrão para novas unidades (false)
-- Mantém true para unidades existentes
ALTER TABLE unidades 
ALTER COLUMN tem_direito_vaga SET DEFAULT false;

-- Comentário na coluna
COMMENT ON COLUMN unidades.tem_direito_vaga IS 'Indica se a unidade tem direito a uma vaga de estacionamento';
