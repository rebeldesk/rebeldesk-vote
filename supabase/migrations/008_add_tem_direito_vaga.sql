-- Migration: Adiciona campo tem_direito_vaga na tabela unidades
-- 
-- Indica se a unidade tem direito a uma vaga de estacionamento.
-- Por padrão, todas as unidades existentes terão direito a vaga (true).

ALTER TABLE unidades 
ADD COLUMN tem_direito_vaga BOOLEAN NOT NULL DEFAULT true;

-- Comentário na coluna
COMMENT ON COLUMN unidades.tem_direito_vaga IS 'Indica se a unidade tem direito a uma vaga de estacionamento';
