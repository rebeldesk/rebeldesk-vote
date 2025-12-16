/**
 * Página de detalhes de uma unidade.
 * 
 * Por enquanto, redireciona para a lista de unidades.
 * Esta página pode ser implementada no futuro se necessário.
 */

import { redirect } from 'next/navigation';

export default async function UnidadeDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Por enquanto, apenas redireciona para a lista de unidades
  // Esta página pode ser implementada no futuro se necessário
  redirect('/unidades');
}
