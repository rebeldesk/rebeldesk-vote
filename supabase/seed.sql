-- Script de seed para criar dados iniciais
-- 
-- IMPORTANTE: Execute este script após criar as tabelas para criar
-- o primeiro usuário administrador do sistema.
-- 
-- Credenciais padrão:
-- Email: admin@condominio.com
-- Senha: admin123
-- 
-- ATENÇÃO: Altere a senha após o primeiro login!

-- Insere algumas unidades de exemplo
INSERT INTO unidades (numero) VALUES
  ('101'),
  ('102'),
  ('201'),
  ('202'),
  ('301'),
  ('302')
ON CONFLICT (numero) DO NOTHING;

-- Cria o primeiro usuário administrador
-- Senha: admin123 (hash gerado com bcrypt, salt rounds: 10)
-- Para gerar um novo hash, use: node scripts/generate-password-hash.js "sua_senha"
INSERT INTO users (email, password_hash, nome, telefone, perfil, unidade_id)
VALUES (
  'admin@condominio.com',
  '$2b$10$TWfQrv7o.7Tajt8mIUdBveQEsx4VzBBbJ3O42vJEVrp/FdiPh5KG.', -- admin123
  'Administrador do Sistema',
  '(11) 99999-9999',
  'staff',
  NULL
)
ON CONFLICT (email) DO NOTHING;

