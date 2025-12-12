/**
 * Processador de mensagens WhatsApp.
 * 
 * Gerencia o fluxo de conversação, comandos e interações
 * com os moradores via WhatsApp.
 */

import { buscarUsuarioPorTelefone } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { unidadeJaVotou, buscarVotacaoCompleta, registrarVoto } from '@/lib/db';
import {
  criarSessaoComCodigo,
  validarCodigo,
  sessaoVerificada,
  buscarSessao,
  registrarVotoWhatsApp,
} from './verification';
import { sendMessage, sendButtons, sendList, validarConfiguracao } from './evolution';
import {
  normalizarTelefone,
  formatarVotacao,
  formatarListaVotacoes,
  criarBotoesVotacao,
} from './utils';

/**
 * Estados da conversa do usuário.
 */
type EstadoConversa =
  | 'aguardando_verificacao'
  | 'menu_principal'
  | 'listando_votacoes'
  | 'votando'
  | 'confirmando_voto';

/**
 * Contexto da conversa do usuário.
 */
interface ContextoConversa {
  estado: EstadoConversa;
  votacaoId?: string;
  opcoesSelecionadas?: string[];
}

/**
 * Processa uma mensagem recebida do WhatsApp.
 * 
 * @param telefone - Número de telefone do remetente
 * @param mensagem - Texto da mensagem recebida
 * @param buttonId - ID do botão clicado (se aplicável)
 * @param listId - ID do item da lista selecionado (se aplicável)
 */
export async function processarMensagem(
  telefone: string,
  mensagem: string,
  buttonId?: string,
  listId?: string
): Promise<void> {
  // Valida configuração
  if (!validarConfiguracao()) {
    console.error('Evolution API não configurada corretamente');
    return;
  }

  const telefoneNormalizado = normalizarTelefone(telefone);

  // Busca ou cria sessão
  let sessao = await buscarSessao(telefoneNormalizado);
  const usuario = await buscarUsuarioPorTelefone(telefoneNormalizado);

  // Se não encontrou usuário, informa que precisa estar cadastrado
  if (!usuario) {
    await sendMessage(
      telefoneNormalizado,
      '❌ *Telefone não cadastrado*\n\n' +
        'Este número não está cadastrado no sistema. ' +
        'Entre em contato com a administração do condomínio para cadastrar seu telefone.'
    );
    return;
  }

  // Se não tem unidade, não pode votar
  if (!usuario.unidade_id) {
    await sendMessage(
      telefoneNormalizado,
      '❌ *Unidade não vinculada*\n\n' +
        'Seu usuário não está vinculado a uma unidade. ' +
        'Entre em contato com a administração do condomínio.'
    );
    return;
  }

  // Verifica se está verificado
  const verificado = sessao ? await sessaoVerificada(telefoneNormalizado) : false;

  if (!verificado) {
    // Processa verificação
    await processarVerificacao(telefoneNormalizado, mensagem, usuario.id);
    return;
  }

  // Processa comandos e interações
  const comando = buttonId || listId || mensagem.trim().toLowerCase();

  // Se clicou em botão ou selecionou item da lista
  if (buttonId || listId) {
    await processarInteracao(telefoneNormalizado, comando, usuario);
    return;
  }

  // Processa comandos de texto
  await processarComando(telefoneNormalizado, comando, usuario);
}

/**
 * Processa a verificação do código.
 */
async function processarVerificacao(
  telefone: string,
  mensagem: string,
  usuarioId: string
): Promise<void> {
  const telefoneNormalizado = normalizarTelefone(telefone);

  // Verifica se a mensagem é um código de 6 dígitos
  const codigo = mensagem.trim().replace(/\D/g, '');

  if (codigo.length === 6) {
    // Tenta validar o código
    try {
      const valido = await validarCodigo(telefoneNormalizado, codigo);

      if (valido) {
        await sendMessage(
          telefoneNormalizado,
          '✅ *Verificação concluída!*\n\n' +
            'Bem-vindo ao sistema de votação do condomínio. ' +
            'Use o menu abaixo para navegar.'
        );
        await mostrarMenuPrincipal(telefoneNormalizado);
      } else {
        await sendMessage(
          telefoneNormalizado,
          '❌ *Código inválido*\n\n' +
            'O código informado está incorreto ou expirou. ' +
            'Verifique e tente novamente.'
        );
      }
    } catch (error: any) {
      await sendMessage(
        telefoneNormalizado,
        `❌ *Erro*\n\n${error.message}`
      );
    }
  } else {
    // Gera e envia novo código
    const codigoGerado = await criarSessaoComCodigo(telefoneNormalizado, usuarioId);

    await sendMessage(
      telefoneNormalizado,
      `🔐 *Código de Verificação*\n\n` +
        `Seu código de verificação é: *${codigoGerado}*\n\n` +
        `Este código expira em 5 minutos.\n` +
        `Envie o código para continuar.`
    );
  }
}

/**
 * Processa comandos de texto.
 */
async function processarComando(
  telefone: string,
  comando: string,
  usuario: any
): Promise<void> {
  const comandos: Record<string, () => Promise<void>> = {
    menu: () => mostrarMenuPrincipal(telefone),
    ajuda: () => mostrarAjuda(telefone),
    votacoes: () => listarVotacoes(telefone, usuario),
    help: () => mostrarAjuda(telefone),
    inicio: () => mostrarMenuPrincipal(telefone),
  };

  const comandoNormalizado = comando.toLowerCase().trim();

  if (comandos[comandoNormalizado]) {
    await comandos[comandoNormalizado]();
  } else {
    await sendMessage(
      telefone,
      '❓ *Comando não reconhecido*\n\n' +
        'Use o menu abaixo ou envie um dos comandos:\n' +
        '• *menu* - Mostrar menu principal\n' +
        '• *votacoes* - Ver votações disponíveis\n' +
        '• *ajuda* - Ver ajuda'
    );
    await mostrarMenuPrincipal(telefone);
  }
}

/**
 * Processa interações (botões e listas).
 */
async function processarInteracao(
  telefone: string,
  comando: string,
  usuario: any
): Promise<void> {
  // Menu principal
  if (comando === 'menu_ver_votacoes') {
    await listarVotacoes(telefone, usuario);
    return;
  }

  if (comando === 'menu_ajuda') {
    await mostrarAjuda(telefone);
    return;
  }

  // Seleção de votação (formato: votacao_<id>)
  if (comando.startsWith('votacao_')) {
    const votacaoId = comando.replace('votacao_', '');
    await mostrarOpcoesVotacao(telefone, votacaoId, usuario);
    return;
  }

  // Seleção de opção de voto (formato: opcao_<votacaoId>_<opcaoId>)
  if (comando.startsWith('opcao_')) {
    const partes = comando.replace('opcao_', '').split('_');
    const votacaoId = partes[0];
    const opcaoId = partes.slice(1).join('_'); // Pode ter múltiplos IDs separados por _
    
    await processarVoto(telefone, votacaoId, opcaoId, usuario);
    return;
  }

  // Comando não reconhecido
  await sendMessage(telefone, '❓ Comando não reconhecido. Use o menu para navegar.');
  await mostrarMenuPrincipal(telefone);
}

/**
 * Mostra o menu principal.
 */
async function mostrarMenuPrincipal(telefone: string): Promise<void> {
  await sendButtons(
    telefone,
    '🏠 *Menu Principal*\n\nEscolha uma opção:',
    [
      { id: 'menu_ver_votacoes', texto: '📊 Ver Votações' },
      { id: 'menu_ajuda', texto: '❓ Ajuda' },
    ],
    'Sistema de Votação',
    'Condomínio'
  );
}

/**
 * Mostra ajuda.
 */
async function mostrarAjuda(telefone: string): Promise<void> {
  await sendMessage(
    telefone,
    '📖 *Ajuda*\n\n' +
      '• Use o menu para navegar pelas opções\n' +
      '• Selecione uma votação para ver detalhes\n' +
      '• Escolha suas opções de voto\n' +
      '• Confirme seu voto\n\n' +
      'Comandos disponíveis:\n' +
      '• *menu* - Mostrar menu\n' +
      '• *votacoes* - Ver votações\n\n' +
      'Para mais informações, entre em contato com a administração.'
  );
}

/**
 * Lista votações disponíveis.
 */
async function listarVotacoes(telefone: string, usuario: any): Promise<void> {
  const agora = new Date();

  // Busca votações abertas
  const votacoes = await prisma.votacao.findMany({
    where: {
      status: 'aberta',
      dataInicio: { lte: agora },
      dataFim: { gte: agora },
    },
    include: {
      opcoes: {
        orderBy: { ordem: 'asc' },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Filtra votações onde a unidade ainda não votou
  const votacoesDisponiveis = await Promise.all(
    votacoes.map(async (votacao) => {
      const jaVotou = await unidadeJaVotou(votacao.id, usuario.unidade_id);
      return {
        votacao,
        jaVotou,
      };
    })
  );

  const votacoesParaVotar = votacoesDisponiveis.filter((v) => !v.jaVotou);

  if (votacoesParaVotar.length === 0) {
    await sendMessage(
      telefone,
      '📭 *Nenhuma votação disponível*\n\n' +
        'Não há votações abertas no momento ou você já votou em todas.'
    );
    await mostrarMenuPrincipal(telefone);
    return;
  }

  // Cria lista de votações
  const itens = votacoesParaVotar.map((item, index) => ({
    id: `votacao_${item.votacao.id}`,
    titulo: `${index + 1}. ${item.votacao.titulo}`,
    descricao: `Até ${new Date(item.votacao.dataFim).toLocaleDateString('pt-BR')}`,
  }));

  await sendList(
    telefone,
    'Votações Disponíveis',
    'Selecione uma votação para ver detalhes e votar',
    'Ver Votações',
    itens,
    'Sistema de Votação'
  );
}

/**
 * Mostra opções de uma votação.
 */
async function mostrarOpcoesVotacao(
  telefone: string,
  votacaoId: string,
  usuario: any
): Promise<void> {
  const resultado = await buscarVotacaoCompleta(votacaoId);

  if (!resultado) {
    await sendMessage(telefone, '❌ Votação não encontrada.');
    await mostrarMenuPrincipal(telefone);
    return;
  }

  const { votacao, opcoes } = resultado;

  // Verifica se ainda está aberta
  const agora = new Date();
  if (votacao.status !== 'aberta' || new Date(votacao.data_fim) < agora) {
    await sendMessage(telefone, '❌ Esta votação não está mais aberta para votação.');
    await mostrarMenuPrincipal(telefone);
    return;
  }

  // Verifica se já votou
  const jaVotou = await unidadeJaVotou(votacaoId, usuario.unidade_id);
  if (jaVotou) {
    await sendMessage(telefone, '✅ Você já votou nesta votação.');
    await mostrarMenuPrincipal(telefone);
    return;
  }

  // Formata votação
  const textoVotacao = formatarVotacao(votacao, opcoes);

  // Cria botões para opções
  if (votacao.tipo === 'escolha_unica') {
    // Escolha única: botões para cada opção
    const botoes = opcoes.map((opcao) => ({
      id: `opcao_${votacaoId}_${opcao.id}`,
      texto: opcao.texto.substring(0, 20), // Limita tamanho
    }));

    await sendButtons(
      telefone,
      textoVotacao + '\n\n*Selecione sua opção:*',
      botoes.slice(0, 3), // Máximo 3 botões
      'Votação',
      'Escolha uma opção'
    );
  } else {
    // Múltipla escolha: lista
    const itens = opcoes.map((opcao) => ({
      id: `opcao_${votacaoId}_${opcao.id}`,
      titulo: opcao.texto.substring(0, 24),
      descricao: 'Toque para selecionar',
    }));

    await sendList(
      telefone,
      'Opções de Voto',
      'Selecione uma ou mais opções',
      'Selecionar',
      itens,
      'Você pode selecionar múltiplas opções'
    );
  }
}

/**
 * Processa o voto do usuário.
 */
async function processarVoto(
  telefone: string,
  votacaoId: string,
  opcaoId: string,
  usuario: any
): Promise<void> {
  try {
    // Para múltipla escolha, pode ter múltiplos IDs separados por _
    const opcoesIds = opcaoId.split('_').filter((id) => id.length > 0);

    if (opcoesIds.length === 0) {
      await sendMessage(telefone, '❌ Nenhuma opção selecionada.');
      return;
    }

    // Registra o voto
    const voto = await registrarVoto(
      votacaoId,
      usuario.unidade_id,
      opcoesIds,
      usuario.id // Para votações rastreadas
    );

    // Registra voto via WhatsApp para auditoria
    await registrarVotoWhatsApp(voto.id, telefone);

    await sendMessage(
      telefone,
      '✅ *Voto registrado com sucesso!*\n\n' +
        'Seu voto foi registrado e será contabilizado no resultado da votação.\n\n' +
        'Obrigado por participar!'
    );

    await mostrarMenuPrincipal(telefone);
  } catch (error: any) {
    await sendMessage(
      telefone,
      `❌ *Erro ao registrar voto*\n\n${error.message}`
    );
  }
}

