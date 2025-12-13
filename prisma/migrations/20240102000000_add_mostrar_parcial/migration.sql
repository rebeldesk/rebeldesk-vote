-- Migration: Adiciona campo mostrar_parcial na tabela votacoes
-- 
-- Este campo permite controlar se os resultados parciais devem ser
-- exibidos durante a votação (quando status = 'aberta')

ALTER TABLE votacoes
ADD COLUMN mostrar_parcial BOOLEAN NOT NULL DEFAULT false;
