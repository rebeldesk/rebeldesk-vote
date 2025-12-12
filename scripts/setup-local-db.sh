#!/bin/bash

# Script para configurar o banco de dados local via Docker
# Este script executa as migrations e o seed no PostgreSQL local

set -e

echo "🚀 Configurando banco de dados local..."

# Verifica se o container está rodando
if ! docker ps | grep -q projeto_votacao_db; then
  echo "❌ Container do banco não está rodando. Execute: docker-compose up -d"
  exit 1
fi

# Aguarda o banco estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
until docker exec projeto_votacao_db pg_isready -U postgres > /dev/null 2>&1; do
  echo "   Aguardando..."
  sleep 1
done

echo "✅ Banco de dados está pronto!"

# Executa a migration
echo "📦 Executando migrations..."
docker exec -i projeto_votacao_db psql -U postgres -d votacao_db < supabase/migrations/001_initial_schema.sql

# Executa o seed (se existir)
if [ -f "supabase/seed.sql" ]; then
  echo "🌱 Executando seed..."
  docker exec -i projeto_votacao_db psql -U postgres -d votacao_db < supabase/seed.sql
fi

echo "✅ Banco de dados configurado com sucesso!"
echo ""
echo "📝 Configure sua DATABASE_URL no .env.local:"
echo "   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/votacao_db"

