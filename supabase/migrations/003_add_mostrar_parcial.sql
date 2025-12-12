-- Migration: Adiciona campo mostrar_parcial na tabela votacoes
-- 
-- Este campo permite controlar se os resultados parciais devem ser
-- exibidos para os votantes enquanto a votação está aberta.

ALTER TABLE votacoes
ADD COLUMN mostrar_parcial BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN votacoes.mostrar_parcial IS 'Se true, permite que votantes vejam resultados parciais enquanto a votação está aberta';
