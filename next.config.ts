import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que o middleware não tente carregar módulos Node.js
  // No Next.js 16, serverComponentsExternalPackages foi movido para fora de experimental
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'pg', '@prisma/adapter-pg'],
  // Configuração do Turbopack (Next.js 16 usa Turbopack por padrão)
  turbopack: {
    // Configurações do Turbopack se necessário
  },
};

export default nextConfig;
