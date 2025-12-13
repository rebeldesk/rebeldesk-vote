-- Migration: Adiciona tabela de moradores
-- 
-- Moradores são pessoas que moram na unidade mas não têm acesso ao sistema.
-- Usado apenas para controle de acesso.

-- Enum para grau de parentesco (cria apenas se não existir)
DO $$ BEGIN
  CREATE TYPE grau_parentesco AS ENUM ('Proprietario', 'Conjuge', 'Filho', 'Pai', 'Mae', 'Outro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de moradores (cria apenas se não existir)
CREATE TABLE IF NOT EXISTS moradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(20) NOT NULL UNIQUE,
  grau_parentesco grau_parentesco NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance (cria apenas se não existir)
CREATE INDEX IF NOT EXISTS idx_moradores_unidade_id ON moradores(unidade_id);
CREATE INDEX IF NOT EXISTS idx_moradores_documento ON moradores(documento);

-- Trigger para atualizar updated_at automaticamente (cria apenas se não existir)
DROP TRIGGER IF EXISTS update_moradores_updated_at ON moradores;
CREATE TRIGGER update_moradores_updated_at BEFORE UPDATE ON moradores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas colunas
COMMENT ON TABLE moradores IS 'Moradores da unidade (sem acesso ao sistema, apenas controle de acesso)';
COMMENT ON COLUMN moradores.documento IS 'Documento único do morador (CPF, RG, etc.)';
COMMENT ON COLUMN moradores.grau_parentesco IS 'Grau de parentesco do morador em relação ao proprietário';
