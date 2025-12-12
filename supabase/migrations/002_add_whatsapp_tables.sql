-- Migration: Adicionar tabelas para integração WhatsApp
-- 
-- Este arquivo cria as tabelas necessárias para a funcionalidade
-- de votação via WhatsApp:
-- - whatsapp_sessions: Sessões e códigos de verificação
-- - whatsapp_votos: Rastreamento de votos feitos via WhatsApp

-- Tabela de sessões WhatsApp
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone VARCHAR(20) NOT NULL UNIQUE,
  usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
  codigo_verificacao VARCHAR(10),
  codigo_expira_em TIMESTAMP WITH TIME ZONE,
  verificado_em TIMESTAMP WITH TIME ZONE,
  tentativas_verificacao INTEGER NOT NULL DEFAULT 0,
  ultima_tentativa_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de votos via WhatsApp (auditoria)
CREATE TABLE whatsapp_votos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voto_id UUID NOT NULL REFERENCES votos(id) ON DELETE CASCADE,
  telefone VARCHAR(20) NOT NULL,
  mensagem_recebida TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_whatsapp_sessions_telefone ON whatsapp_sessions(telefone);
CREATE INDEX idx_whatsapp_sessions_usuario_id ON whatsapp_sessions(usuario_id);
CREATE INDEX idx_whatsapp_votos_voto_id ON whatsapp_votos(voto_id);
CREATE INDEX idx_whatsapp_votos_telefone ON whatsapp_votos(telefone);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

