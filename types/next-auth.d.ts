/**
 * Extensão de tipos do NextAuth para incluir campos customizados na sessão.
 */

import 'next-auth';
import type { PerfilUsuario } from './index';

declare module 'next-auth' {
  interface User {
    perfil?: PerfilUsuario;
    conselheiro?: boolean;
    unidade_id?: string | null;
    forcar_troca_senha?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      perfil: PerfilUsuario;
      conselheiro: boolean;
      unidade_id: string | null;
      forcar_troca_senha?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    perfil: PerfilUsuario;
    conselheiro: boolean;
    unidade_id: string | null;
    forcar_troca_senha?: boolean;
  }
}

