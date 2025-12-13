-- Migration: Seed do usuário admin inicial
-- 
-- Cria o usuário admin padrão do sistema:
-- Email: admin@rebeldesk.com
-- Senha: senha123
-- Perfil: staff

-- Insere o usuário admin apenas se não existir
INSERT INTO users (id, email, password_hash, nome, perfil, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'admin@rebeldesk.com',
  '$2b$10$GPRQa8qhLpinCY.lBkZvG.kQv5MAm8V.R4/FzC/cmnxNOsNbU7zxi', -- hash de "senha123"
  'Administrador',
  'staff',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
