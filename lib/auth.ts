/**
 * Configuração do NextAuth.js para autenticação customizada.
 * 
 * Este arquivo configura o NextAuth com provider de credenciais,
 * usando nosso próprio sistema de autenticação no Supabase.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { PerfilUsuario } from '@/types';

/**
 * Configuração do NextAuth.
 * 
 * Usa provider de credenciais customizado que:
 * 1. Busca o usuário no banco por email
 * 2. Verifica a senha usando bcrypt
 * 3. Retorna os dados do usuário na sessão
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          console.log('[Auth] Credenciais não fornecidas');
          return null;
        }

        try {
          // Lazy load do Prisma e verificarSenha para evitar carregar no Edge Runtime
          const { verificarSenha } = await import('./password');
          const { prisma } = await import('./prisma');
          
          // Busca usuário no banco com password_hash usando Prisma
          const userData = await prisma.usuario.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              nome: true,
              perfil: true,
              unidadeId: true,
              passwordHash: true,
            },
          });

          if (!userData) {
            console.log('[Auth] Usuário não encontrado:', credentials.email);
            return null;
          }

          if (!userData.passwordHash) {
            console.error('[Auth] Usuário sem passwordHash:', credentials.email);
            return null;
          }

          // Verifica senha
          const senhaValida = await verificarSenha(
            credentials.senha as string,
            userData.passwordHash
          );

          if (!senhaValida) {
            console.log('[Auth] Senha inválida para:', credentials.email);
            return null;
          }

          console.log('[Auth] Login bem-sucedido para:', credentials.email);

          // Retorna dados do usuário (sem passwordHash)
          return {
            id: userData.id,
            email: userData.email,
            name: userData.nome,
            perfil: userData.perfil,
            unidade_id: userData.unidadeId,
          };
        } catch (error) {
          console.error('[Auth] Erro na autenticação:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.perfil = (user as any).perfil;
        token.unidade_id = (user as any).unidade_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.perfil = token.perfil as PerfilUsuario;
        session.user.unidade_id = token.unidade_id as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

