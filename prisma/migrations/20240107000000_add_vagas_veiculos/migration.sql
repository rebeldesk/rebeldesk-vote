-- Migration: Adiciona tabelas de vagas e veículos
-- 
-- Cada unidade tem direito a uma vaga de estacionamento.
-- Uma vaga pode estar alugada para outra unidade.
-- Múltiplos veículos (carro e moto) podem estar na mesma vaga.

-- Enum para tipo de veículo
CREATE TYPE tipo_veiculo AS ENUM ('carro', 'moto');

-- Tabela de vagas (uma por unidade)
CREATE TABLE vagas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unidade_id UUID NOT NULL UNIQUE REFERENCES unidades(id) ON DELETE CASCADE,
  esta_alugada BOOLEAN NOT NULL DEFAULT false,
  unidade_alugada_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de veículos
CREATE TABLE veiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  vaga_id UUID REFERENCES vagas(id) ON DELETE SET NULL,
  placa VARCHAR(10) NOT NULL UNIQUE,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  tipo tipo_veiculo NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_vagas_unidade_id ON vagas(unidade_id);
CREATE INDEX idx_vagas_unidade_alugada_id ON vagas(unidade_alugada_id);
CREATE INDEX idx_veiculos_unidade_id ON veiculos(unidade_id);
CREATE INDEX idx_veiculos_vaga_id ON veiculos(vaga_id);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vagas_updated_at BEFORE UPDATE ON vagas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
