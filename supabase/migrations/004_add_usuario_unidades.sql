-- Migration: Adiciona tabela de relacionamento muitos-para-muitos entre usuários e unidades
-- 
-- Esta migration permite que um usuário seja vinculado a múltiplas unidades.
-- Mantém compatibilidade com o campo unidade_id existente (que pode ser removido em migration futura).

-- Tabela de relacionamento usuário-unidade
CREATE TABLE usuario_unidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Garante que um usuário não pode ter a mesma unidade duplicada
  UNIQUE(usuario_id, unidade_id)
);

-- Índices para melhor performance
CREATE INDEX idx_usuario_unidades_usuario_id ON usuario_unidades(usuario_id);
CREATE INDEX idx_usuario_unidades_unidade_id ON usuario_unidades(unidade_id);

-- Migra dados existentes: se um usuário tem unidade_id, cria relacionamento
INSERT INTO usuario_unidades (usuario_id, unidade_id)
SELECT id, unidade_id
FROM users
WHERE unidade_id IS NOT NULL
ON CONFLICT (usuario_id, unidade_id) DO NOTHING;
