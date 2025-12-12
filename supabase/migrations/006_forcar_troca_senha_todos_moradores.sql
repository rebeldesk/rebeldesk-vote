-- Migration: Marca todos os usuários com perfil "morador" para forçar troca de senha
-- 
-- Este script atualiza o campo forcar_troca_senha para true em todos os usuários
-- com perfil "morador", forçando-os a alterar a senha no próximo login.

UPDATE users 
SET forcar_troca_senha = true,
    updated_at = NOW()
WHERE perfil = 'morador';

-- Mostra quantos usuários foram atualizados
DO $$
DECLARE
    total_atualizados INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_atualizados
    FROM users
    WHERE perfil = 'morador' AND forcar_troca_senha = true;
    
    RAISE NOTICE 'Total de moradores marcados para forçar troca de senha: %', total_atualizados;
END $$;
