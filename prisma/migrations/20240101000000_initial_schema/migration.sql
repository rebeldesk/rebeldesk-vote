-- Migration inicial: Schema completo do sistema de votação condominial
-- 
-- Este arquivo cria todas as tabelas necessárias para o sistema:
-- - users: Usuários do sistema
-- - unidades: Unidades do condomínio
-- - votacoes: Votações criadas
-- - opcoes_votacao: Opções de cada votação
-- - votos: Votos registrados

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum para perfis de usuário
CREATE TYPE perfil_usuario AS ENUM ('staff', 'conselho', 'auditor', 'morador');

-- Enum para tipo de votação
CREATE TYPE tipo_votacao AS ENUM ('escolha_unica', 'multipla_escolha');

-- Enum para modo de auditoria
CREATE TYPE modo_auditoria AS ENUM ('anonimo', 'rastreado');

-- Enum para status de votação
CREATE TYPE status_votacao AS ENUM ('rascunho', 'aberta', 'encerrada');

-- Tabela de unidades do condomínio
-- IMPORTANTE: Uma unidade pode ter múltiplos moradores ao longo do tempo
-- (aluguel/venda), mas apenas um voto por unidade é permitido por votação.
CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  perfil perfil_usuario NOT NULL DEFAULT 'morador',
  unidade_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de votações
CREATE TABLE votacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo tipo_votacao NOT NULL,
  modo_auditoria modo_auditoria NOT NULL DEFAULT 'anonimo',
  criado_por UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status status_votacao NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT data_fim_apos_inicio CHECK (data_fim > data_inicio)
);

-- Tabela de opções de votação
CREATE TABLE opcoes_votacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  votacao_id UUID NOT NULL REFERENCES votacoes(id) ON DELETE CASCADE,
  texto VARCHAR(500) NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de votos
-- IMPORTANTE: O voto é vinculado à unidade, não ao usuário.
-- Isso permite que quando um morador muda (aluguel/venda),
-- a unidade mantenha seu histórico de votos.
-- 
-- Regras:
-- - Uma unidade só pode votar uma vez por votação (garantido por constraint)
-- - opcao_id: usado para escolha única
-- - opcoes_ids: usado para múltipla escolha (JSON array)
-- - user_id: apenas preenchido se modo_auditoria = 'rastreado'
CREATE TABLE votos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  votacao_id UUID NOT NULL REFERENCES votacoes(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  opcao_id UUID REFERENCES opcoes_votacao(id) ON DELETE CASCADE,
  opcoes_ids JSONB, -- Array de UUIDs para múltipla escolha
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Garante que uma unidade só vota uma vez por votação
  UNIQUE(votacao_id, unidade_id)
);

-- Índices para melhor performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unidade_id ON users(unidade_id);
CREATE INDEX idx_votacoes_status ON votacoes(status);
CREATE INDEX idx_votacoes_criado_por ON votacoes(criado_por);
CREATE INDEX idx_opcoes_votacao_votacao_id ON opcoes_votacao(votacao_id);
CREATE INDEX idx_votos_votacao_id ON votos(votacao_id);
CREATE INDEX idx_votos_unidade_id ON votos(unidade_id);
CREATE INDEX idx_votos_user_id ON votos(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON unidades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votacoes_updated_at BEFORE UPDATE ON votacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

