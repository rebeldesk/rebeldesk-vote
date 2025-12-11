/**
 * Extensão de tipos do NextAuth para incluir campos customizados na sessão.
 */

import 'next-auth';
import type { PerfilUsuario } from './index';

declare module 'next-auth' {
  interface User {
    perfil?: PerfilUsuario;
    unidade_id?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      perfil: PerfilUsuario;
      unidade_id: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    perfil: PerfilUsuario;
    unidade_id: string | null;
  }
}

