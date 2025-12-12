/**
 * Página de detalhes de uma votação (admin).
 * 
 * Permite visualizar, editar e gerenciar uma votação.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { buscarVotacaoCompleta } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function VotacaoDetalhesPage({
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{votacao.titulo}</h1>
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              votacao.status === 'aberta'
                ? 'bg-green-100 text-green-800'
                : votacao.status === 'encerrada'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {votacao.status === 'aberta'
              ? 'Aberta'
              : votacao.status === 'encerrada'
              ? 'Encerrada'
              : 'Rascunho'}
          </span>
        </div>
        <div className="flex space-x-2">
          {votacao.status !== 'rascunho' && (
            <Link
              href={`/votacoes/${votacao.id}/resultado`}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Ver Resultados
            </Link>
          )}
        </div>
      </div>

      {votacao.descricao && (
        <p className="mt-4 text-gray-600">{votacao.descricao}</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Informações</h2>
          <dl className="mt-4 space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {votacao.tipo === 'escolha_unica' ? 'Escolha Única' : 'Múltipla Escolha'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Modo de Auditoria</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {votacao.modo_auditoria === 'anonimo' ? 'Anônimo' : 'Rastreado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mostrar Parcial</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {votacao.mostrar_parcial ? 'Sim' : 'Não'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data de Início</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(votacao.data_inicio).toLocaleString('pt-BR')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data de Término</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(votacao.data_fim).toLocaleString('pt-BR')}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Opções</h2>
          <ul className="mt-4 space-y-2">
            {opcoes.map((opcao, index) => (
              <li key={opcao.id} className="flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-900">{opcao.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {votacao.status === 'rascunho' && (
        <div className="mt-8">
          <form
            action={async () => {
              'use server';
              const session = await auth();
              
              if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
                redirect('/dashboard');
              }

              try {
                await prisma.votacao.update({
                  where: { id },
                  data: { status: 'aberta' },
                });
                redirect(`/votacoes/${id}`);
              } catch (error) {
                console.error('Erro ao abrir votação:', error);
                redirect(`/votacoes/${id}?error=Erro ao abrir votação`);
              }
            }}
          >
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Abrir Votação
            </button>
          </form>
        </div>
      )}

      {votacao.status === 'aberta' && (
        <div className="mt-8">
          <form
            action={async () => {
              'use server';
              const session = await auth();
              
              if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
                redirect('/dashboard');
              }

              try {
                await prisma.votacao.update({
                  where: { id },
                  data: { status: 'encerrada' },
                });
                redirect(`/votacoes/${id}`);
              } catch (error) {
                console.error('Erro ao encerrar votação:', error);
                redirect(`/votacoes/${id}?error=Erro ao encerrar votação`);
              }
            }}
          >
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Encerrar Votação
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

