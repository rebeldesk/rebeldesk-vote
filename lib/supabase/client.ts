/**
 * Cliente Supabase para uso no lado do cliente (browser).
 * 
 * Este cliente usa a chave anônima e deve ser usado apenas para
 * operações que não requerem privilégios elevados.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

