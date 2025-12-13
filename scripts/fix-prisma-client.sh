#!/bin/bash
# Script para regenerar Prisma Client e limpar cache do Next.js

echo "🔄 Regenerando Prisma Client..."
npx prisma generate

echo "🧹 Limpando cache do Next.js..."
rm -rf .next

echo "✅ Pronto! Agora reinicie o servidor com: npm run dev"
