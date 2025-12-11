/**
 * Configuração do NextAuth.js para autenticação customizada.
 * 
 * Este arquivo configura o NextAuth com provider de credenciais,
 * usando nosso próprio sistema de autenticação no Supabase.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { buscarUsuarioPorEmail, verificarSenha } from './db';
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
          return null;
        }

        try {
          // Busca usuário no banco com password_hash
          const { supabaseServer } = await import('./supabase/server');
          const { data: userData, error } = await supabaseServer
            .from('users')
            .select('id, email, nome, perfil, unidade_id, password_hash')
            .eq('email', credentials.email as string)
            .single();

          if (error || !userData || !userData.password_hash) {
            return null;
          }

          // Verifica senha
          const senhaValida = await verificarSenha(
            credentials.senha as string,
            userData.password_hash
          );

          if (!senhaValida) {
            return null;
          }

          // Retorna dados do usuário (sem password_hash)
          return {
            id: userData.id,
            email: userData.email,
            name: userData.nome,
            perfil: userData.perfil,
            unidade_id: userData.unidade_id,
          };
        } catch (error) {
          console.error('Erro na autenticação:', error);
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

