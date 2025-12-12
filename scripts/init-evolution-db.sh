#!/bin/bash
# Script para criar o banco de dados do Evolution API no PostgreSQL
# Este script é executado automaticamente quando o container PostgreSQL é criado pela primeira vez

set -e

echo "📦 Criando banco de dados para Evolution API..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE evolution_db;
    GRANT ALL PRIVILEGES ON DATABASE evolution_db TO $POSTGRES_USER;
EOSQL

echo "✅ Banco de dados 'evolution_db' criado com sucesso!"
