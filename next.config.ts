import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Exclui módulos Node.js do bundle do Edge Runtime
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Garante que o middleware não tente carregar módulos Node.js
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'pg', '@prisma/adapter-pg'],
  },
};

export default nextConfig;
