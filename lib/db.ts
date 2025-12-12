/**
 * Helpers e utilitários para interação com o banco de dados usando Prisma.
 * 
 * Este arquivo contém funções auxiliares para operações comuns
 * no banco de dados, garantindo consistência e reutilização.
 */

import { prisma } from './prisma';
import { hashSenha, verificarSenha } from './password';
import type {
  Usuario,
  Unidade,
  Votacao,
  OpcaoVotacao,
  Voto,
  CriarUsuarioDTO,
  AtualizarUsuarioDTO,
  CriarVotacaoDTO,
  RegistrarVotoDTO,
  ResultadoVotacao,
} from '@/types';
import { Prisma } from '@prisma/client';

// Re-exporta funções de senha para manter compatibilidade
export { hashSenha, verificarSenha };

/**
 * Busca um usuário por email.
 * 
 * @param email - Email do usuário
 * @returns Usuário encontrado ou null
 */
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    return null;
  }

  // Converte para o tipo Usuario (sem passwordHash)
  const { passwordHash, unidadeId, createdAt, updatedAt, ...rest } = usuario;
  return {
    ...rest,
    unidade_id: unidadeId,
    created_at: createdAt?.toISOString() || new Date().toISOString(),
    updated_at: updatedAt?.toISOString() || new Date().toISOString(),
  } as Usuario;
}

/**
 * Busca um usuário por ID.
 * 
 * @param id - ID do usuário
 * @returns Usuário encontrado ou null
 */
export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    return null;
  }

  const { passwordHash, unidadeId, createdAt, updatedAt, ...rest } = usuario;
  return {
    ...rest,
    unidade_id: unidadeId,
    created_at: createdAt?.toISOString() || new Date().toISOString(),
    updated_at: updatedAt?.toISOString() || new Date().toISOString(),
  } as Usuario;
}

/**
 * Cria um novo usuário no banco.
 * 
 * @param dados - Dados do usuário a ser criado
 * @returns Usuário criado
 * @throws {Error} Se o email já existir ou houver erro na criação
 */
export async function criarUsuario(dados: CriarUsuarioDTO): Promise<Usuario> {
  // Verifica se o email já existe
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: dados.email },
  });

  if (usuarioExistente) {
    throw new Error('Email já cadastrado');
  }

  // Hash da senha
  const passwordHash = await hashSenha(dados.senha);

  const usuario = await prisma.usuario.create({
    data: {
      email: dados.email,
      passwordHash,
      nome: dados.nome,
      telefone: dados.telefone || null,
      perfil: dados.perfil,
      unidadeId: dados.unidade_id || null,
    },
  });

  const { passwordHash: _, unidadeId, createdAt, updatedAt, ...rest } = usuario;
  return {
    ...rest,
    unidade_id: unidadeId,
    created_at: createdAt?.toISOString() || new Date().toISOString(),
    updated_at: updatedAt?.toISOString() || new Date().toISOString(),
  } as Usuario;
}

/**
 * Atualiza um usuário existente.
 * 
 * @param id - ID do usuário
 * @param dados - Dados a serem atualizados
 * @returns Usuário atualizado
 */
export async function atualizarUsuario(
  id: string,
  dados: AtualizarUsuarioDTO & { senha?: string }
): Promise<Usuario> {
  // Prepara dados de atualização
  const dadosUpdate: any = {
    email: dados.email,
    nome: dados.nome,
    telefone: dados.telefone,
    perfil: dados.perfil,
  };

  // Se unidade_id foi fornecido (incluindo null), atualiza
  if (dados.unidade_id !== undefined) {
    dadosUpdate.unidadeId = dados.unidade_id;
  }

  // Se senha foi fornecida, atualiza o hash
  if (dados.senha) {
    dadosUpdate.passwordHash = await hashSenha(dados.senha);
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: dadosUpdate,
  });

  const { passwordHash, unidadeId, createdAt, updatedAt, ...rest } = usuario;
  return {
    ...rest,
    unidade_id: unidadeId,
    created_at: createdAt?.toISOString() || new Date().toISOString(),
    updated_at: updatedAt?.toISOString() || new Date().toISOString(),
  } as Usuario;
}

/**
 * Lista todas as unidades.
 * 
 * @returns Lista de unidades
 */
export async function listarUnidades(): Promise<Unidade[]> {
  const unidades = await prisma.unidade.findMany({
    orderBy: { numero: 'asc' },
  });

  return unidades.map((u) => ({
    id: u.id,
    numero: u.numero,
    created_at: u.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: u.updatedAt?.toISOString() || new Date().toISOString(),
  })) as Unidade[];
}

/**
 * Cria uma nova unidade.
 * 
 * @param numero - Número da unidade
 * @returns Unidade criada
 */
export async function criarUnidade(numero: string): Promise<Unidade> {
  const unidade = await prisma.unidade.create({
    data: { numero },
  });

  return {
    id: unidade.id,
    numero: unidade.numero,
    created_at: unidade.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: unidade.updatedAt?.toISOString() || new Date().toISOString(),
  } as Unidade;
}

/**
 * Busca uma votação por ID com suas opções.
 * 
 * @param id - ID da votação
 * @returns Votação com opções ou null
 */
export async function buscarVotacaoCompleta(id: string): Promise<{
  votacao: Votacao;
  opcoes: OpcaoVotacao[];
} | null> {
  const votacao = await prisma.votacao.findUnique({
    where: { id },
    include: {
      opcoes: {
        orderBy: { ordem: 'asc' },
      },
    },
  });

  if (!votacao) {
    return null;
  }

  // Formata votação para o tipo esperado
  const votacaoFormatada: Votacao = {
    id: votacao.id,
    titulo: votacao.titulo,
    descricao: votacao.descricao || '',
    tipo: votacao.tipo,
    modo_auditoria: votacao.modoAuditoria,
    mostrar_parcial: votacao.mostrarParcial,
    criado_por: votacao.criadoPor,
    data_inicio: votacao.dataInicio.toISOString(),
    data_fim: votacao.dataFim.toISOString(),
    status: votacao.status,
    created_at: votacao.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: votacao.updatedAt?.toISOString() || new Date().toISOString(),
  };

  const opcoesFormatadas: OpcaoVotacao[] = votacao.opcoes.map((op) => ({
    id: op.id,
    votacao_id: op.votacaoId,
    texto: op.texto,
    ordem: op.ordem,
    created_at: op.createdAt?.toISOString() || new Date().toISOString(),
  }));

  return {
    votacao: votacaoFormatada,
    opcoes: opcoesFormatadas,
  };
}

/**
 * Verifica se uma unidade já votou em uma votação.
 * 
 * IMPORTANTE: Uma unidade só pode votar uma vez por votação.
 * 
 * @param votacaoId - ID da votação
 * @param unidadeId - ID da unidade
 * @returns true se já votou
 */
export async function unidadeJaVotou(
  votacaoId: string,
  unidadeId: string
): Promise<boolean> {
  const voto = await prisma.voto.findUnique({
    where: {
      votacaoId_unidadeId: {
        votacaoId,
        unidadeId,
      },
    },
  });

  return !!voto;
}

/**
 * Busca o voto de uma unidade em uma votação.
 * 
 * @param votacaoId - ID da votação
 * @param unidadeId - ID da unidade
 * @returns Voto encontrado ou null
 */
export async function buscarVotoUnidade(
  votacaoId: string,
  unidadeId: string
): Promise<Voto | null> {
  const voto = await prisma.voto.findUnique({
    where: {
      votacaoId_unidadeId: {
        votacaoId,
        unidadeId,
      },
    },
  });

  if (!voto) {
    return null;
  }

  return {
    id: voto.id,
    votacao_id: voto.votacaoId,
    unidade_id: voto.unidadeId,
    opcao_id: voto.opcaoId,
    opcoes_ids: voto.opcoesIds as string[] | null,
    user_id: voto.userId,
    created_at: voto.createdAt?.toISOString() || new Date().toISOString(),
  } as Voto;
}

/**
 * Registra um voto de uma unidade.
 * 
 * Regras de negócio:
 * - Uma unidade só pode votar uma vez por votação
 * - O voto deve ser registrado antes da data de encerramento
 * - Se a votação for rastreada, o user_id é obrigatório
 * 
 * @param votacaoId - ID da votação
 * @param unidadeId - ID da unidade
 * @param opcoesIds - IDs das opções selecionadas
 * @param userId - ID do usuário (obrigatório se modo_auditoria = 'rastreado')
 * @returns Voto criado
 * @throws {Error} Se a unidade já votou ou se a votação estiver encerrada
 */
export async function registrarVoto(
  votacaoId: string,
  unidadeId: string,
  opcoesIds: string[],
  userId?: string
): Promise<Voto> {
  // Busca a votação para validar
  const votacao = await prisma.votacao.findUnique({
    where: { id: votacaoId },
    include: { opcoes: true },
  });

  if (!votacao) {
    throw new Error('Votação não encontrada');
  }

  // Validações
  if (votacao.status !== 'aberta') {
    throw new Error('Votação não está aberta para votação');
  }

  const agora = new Date();
  const dataFim = new Date(votacao.dataFim);
  if (agora > dataFim) {
    throw new Error('Período de votação encerrado');
  }

  // Verifica se já votou
  const jaVotou = await unidadeJaVotou(votacaoId, unidadeId);
  if (jaVotou) {
    throw new Error('Esta unidade já votou nesta votação');
  }

  // Valida tipo de votação
  if (votacao.tipo === 'escolha_unica' && opcoesIds.length !== 1) {
    throw new Error('Votação de escolha única permite apenas uma opção');
  }

  if (votacao.tipo === 'multipla_escolha' && opcoesIds.length === 0) {
    throw new Error('Selecione pelo menos uma opção');
  }

  // Se rastreado, userId é obrigatório
  if (votacao.modoAuditoria === 'rastreado' && !userId) {
    throw new Error('User ID é obrigatório para votações rastreadas');
  }

  // Prepara dados do voto
  const dadosVoto: Prisma.VotoCreateInput = {
    votacao: {
      connect: { id: votacaoId },
    },
    unidade: {
      connect: { id: unidadeId },
    },
    opcoesIds: opcoesIds.length > 1 ? (opcoesIds as Prisma.InputJsonValue) : undefined,
    user: userId ? { connect: { id: userId } } : undefined,
  };

  // Para escolha única, também conecta a opção
  if (votacao.tipo === 'escolha_unica') {
    dadosVoto.opcao = {
      connect: { id: opcoesIds[0] },
    };
  }

  const voto = await prisma.voto.create({
    data: dadosVoto,
  });

  // Formata para o tipo Voto esperado
  return {
    id: voto.id,
    votacao_id: voto.votacaoId,
    unidade_id: voto.unidadeId,
    opcao_id: voto.opcaoId,
    opcoes_ids: voto.opcoesIds as string[] | null,
    user_id: voto.userId,
      created_at: voto.createdAt?.toISOString() || new Date().toISOString(),
  } as Voto;
}

/**
 * Calcula o resultado de uma votação.
 * 
 * @param votacaoId - ID da votação
 * @param incluirDetalhes - Se true, inclui detalhes dos votos (apenas se rastreado)
 * @returns Resultado da votação
 */
export async function calcularResultado(
  votacaoId: string,
  incluirDetalhes = false
): Promise<ResultadoVotacao> {
  const votacao = await prisma.votacao.findUnique({
    where: { id: votacaoId },
    include: {
      opcoes: {
        orderBy: { ordem: 'asc' },
      },
      votos: incluirDetalhes,
    },
  });

  if (!votacao) {
    throw new Error('Votação não encontrada');
  }

  const totalVotos = votacao.votos.length;

  // Calcula votos por opção
  const resultadoOpcoes = votacao.opcoes.map((opcao) => {
    let votos = 0;

    votacao.votos.forEach((voto) => {
      if (votacao.tipo === 'escolha_unica') {
        if (voto.opcaoId === opcao.id) {
          votos++;
        }
      } else {
        // múltipla escolha
        if (voto.opcoesIds && Array.isArray(voto.opcoesIds) && (voto.opcoesIds as string[]).includes(opcao.id)) {
          votos++;
        }
      }
    });

    const percentual = totalVotos > 0 ? (votos / totalVotos) * 100 : 0;

    return {
      opcao: opcao as unknown as OpcaoVotacao,
      votos,
      percentual: Math.round(percentual * 100) / 100, // 2 casas decimais
    };
  });

  // Formata votação para o tipo esperado
  const votacaoFormatada: Votacao = {
    id: votacao.id,
    titulo: votacao.titulo,
    descricao: votacao.descricao || '',
    tipo: votacao.tipo,
    modo_auditoria: votacao.modoAuditoria,
    mostrar_parcial: votacao.mostrarParcial,
    criado_por: votacao.criadoPor,
    data_inicio: votacao.dataInicio.toISOString(),
    data_fim: votacao.dataFim.toISOString(),
    status: votacao.status,
    created_at: votacao.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: votacao.updatedAt?.toISOString() || new Date().toISOString(),
  };

  const resultado: ResultadoVotacao = {
    votacao: votacaoFormatada,
    opcoes: resultadoOpcoes,
    total_votos: totalVotos,
  };

  // Inclui detalhes se solicitado e se for rastreado
  if (incluirDetalhes && votacao.modoAuditoria === 'rastreado') {
    // Busca unidades para os votos
    const unidadesIds = [...new Set(votacao.votos.map((v) => v.unidadeId))];
    const unidades = await prisma.unidade.findMany({
      where: {
        id: {
          in: unidadesIds,
        },
      },
    });

    const unidadesMap = new Map(unidades.map((u) => [u.id, u.numero]));

    resultado.votos_detalhados = votacao.votos.map((v) => ({
      id: v.id,
      votacao_id: v.votacaoId,
      unidade_id: v.unidadeId,
      unidade_numero: unidadesMap.get(v.unidadeId) || v.unidadeId, // Fallback para ID se não encontrar
      opcao_id: v.opcaoId,
      opcoes_ids: v.opcoesIds as string[] | null,
      user_id: v.userId,
      created_at: v.createdAt?.toISOString() || new Date().toISOString(),
    })) as any; // Usando any temporariamente para incluir unidade_numero
  }

  return resultado;
}
