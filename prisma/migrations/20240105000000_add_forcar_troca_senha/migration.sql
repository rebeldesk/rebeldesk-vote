-- Migration: Adiciona campo para forçar troca de senha no primeiro login
-- 
-- Este campo permite que o staff marque usuários para forçar troca de senha
-- após o primeiro login. Útil para senhas temporárias ou importação em massa.

-- Adiciona coluna forcar_troca_senha na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS forcar_troca_senha BOOLEAN NOT NULL DEFAULT false;

-- Comentário na coluna
COMMENT ON COLUMN users.forcar_troca_senha IS 'Força o usuário a trocar a senha no próximo login';
