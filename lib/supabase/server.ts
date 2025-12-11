/**
 * Cliente Supabase para uso no servidor (Server Components, API Routes).
 * 
 * Este cliente usa a service role key e tem acesso completo ao banco,
 * devendo ser usado apenas em operações server-side.
 * 
 * IMPORTANTE: Nunca exponha a service role key no cliente!
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
  );
}

/**
 * Cliente Supabase com privilégios de service role.
 * Use apenas em Server Components e API Routes.
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

