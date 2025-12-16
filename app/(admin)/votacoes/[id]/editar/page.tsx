/**
 * Página para editar uma votação.
 * 
 * Apenas permite edição quando a votação está em status 'rascunho'.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buscarVotacaoCompleta } from '@/lib/db';
import { VotingForm } from '@/components/admin/VotingForm';

export default async function EditarVotacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const votacaoCompleta = await buscarVotacaoCompleta(id);

  if (!votacaoCompleta) {
    redirect('/votacoes');
  }

  const { votacao, opcoes } = votacaoCompleta;

  // Só permite editar se estiver em rascunho
  if (votacao.status !== 'rascunho') {
    redirect(`/votacoes/${id}`);
  }

  // Formata datas para o formato datetime-local (YYYY-MM-DDTHH:mm)
  const formatarDataParaInput = (dataISO: string) => {
    const data = new Date(dataISO);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
  };

  // Prepara dados iniciais para o formulário
  const initialData = {
    titulo: votacao.titulo,
    descricao: votacao.descricao || '',
    tipo: votacao.tipo,
    modo_auditoria: votacao.modo_auditoria,
    mostrar_parcial: votacao.mostrar_parcial,
    permitir_alterar_voto: votacao.permitir_alterar_voto,
    data_inicio: formatarDataParaInput(votacao.data_inicio),
    data_fim: formatarDataParaInput(votacao.data_fim),
    opcoes: opcoes.map((opcao) => opcao.texto),
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Editar Votação</h1>
      <div className="mt-8">
        <VotingForm votacaoId={id} initialData={initialData} />
      </div>
    </div>
  );
}
