/**
 * Cliente Supabase para uso no servidor (Server Components, API Routes).
 * 
 * Este cliente usa a service role key e tem acesso completo ao banco,
 * devendo ser usado apenas em operações server-side.
 * 
 * IMPORTANTE: Nunca exponha a service role key no cliente!
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

/**
 * Cliente Supabase com privilégios de service role.
 * Use apenas em Server Components e API Routes.
 * 
 * Nota: Variáveis de ambiente são validadas em runtime, não em build time.
 */
export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Valida se as variáveis de ambiente estão configuradas.
 * Use esta função antes de operações críticas.
 */
export function validarConfiguracaoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key || url === 'https://placeholder.supabase.co' || key === 'placeholder-key') {
    throw new Error(
      'Variáveis de ambiente do Supabase não configuradas. ' +
      'Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
    );
  }
}

