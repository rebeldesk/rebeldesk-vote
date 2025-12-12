-- Migration: Adiciona campo permitir_alterar_voto na tabela votacoes
-- 
-- Este campo permite controlar se os moradores podem alterar seu voto
-- até o fim da votação. Por padrão, permite alteração (true).

ALTER TABLE votacoes
ADD COLUMN permitir_alterar_voto BOOLEAN NOT NULL DEFAULT true;
