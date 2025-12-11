/**
 * Helpers e utilitários para interação com o banco de dados.
 * 
 * Este arquivo contém funções auxiliares para operações comuns
 * no banco de dados, garantindo consistência e reutilização.
 */

import { supabaseServer } from './supabase/server';
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
import bcrypt from 'bcryptjs';

/**
 * Hash de senha usando bcrypt.
 * 
 * @param senha - Senha em texto plano
 * @returns Hash da senha
 */
export async function hashSenha(senha: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(senha, salt);
}

/**
 * Verifica se a senha corresponde ao hash.
 * 
 * @param senha - Senha em texto plano
 * @param hash - Hash armazenado
 * @returns true se a senha corresponder
 */
export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/**
 * Busca um usuário por email.
 * 
 * @param email - Email do usuário
 * @returns Usuário encontrado ou null
 */
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Usuario;
}

/**
 * Busca um usuário por ID.
 * 
 * @param id - ID do usuário
 * @returns Usuário encontrado ou null
 */
export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Usuario;
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
  const usuarioExistente = await buscarUsuarioPorEmail(dados.email);
  if (usuarioExistente) {
    throw new Error('Email já cadastrado');
  }

  // Hash da senha
  const password_hash = await hashSenha(dados.senha);

  const { data, error } = await supabaseServer
    .from('users')
    .insert({
      email: dados.email,
      password_hash,
      nome: dados.nome,
      telefone: dados.telefone,
      perfil: dados.perfil,
      unidade_id: dados.unidade_id,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Erro ao criar usuário');
  }

  return data as Usuario;
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
  dados: AtualizarUsuarioDTO
): Promise<Usuario> {
  const { data, error } = await supabaseServer
    .from('users')
    .update({
      ...dados,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Erro ao atualizar usuário');
  }

  return data as Usuario;
}

/**
 * Lista todas as unidades.
 * 
 * @returns Lista de unidades
 */
export async function listarUnidades(): Promise<Unidade[]> {
  const { data, error } = await supabaseServer
    .from('unidades')
    .select('*')
    .order('numero', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Unidade[];
}

/**
 * Cria uma nova unidade.
 * 
 * @param numero - Número da unidade
 * @returns Unidade criada
 */
export async function criarUnidade(numero: string): Promise<Unidade> {
  const { data, error } = await supabaseServer
    .from('unidades')
    .insert({ numero })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Unidade;
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
  const { data: votacao, error: errorVotacao } = await supabaseServer
    .from('votacoes')
    .select('*')
    .eq('id', id)
    .single();

  if (errorVotacao || !votacao) {
    return null;
  }

  const { data: opcoes, error: errorOpcoes } = await supabaseServer
    .from('opcoes_votacao')
    .select('*')
    .eq('votacao_id', id)
    .order('ordem', { ascending: true });

  if (errorOpcoes) {
    throw new Error(errorOpcoes.message);
  }

  return {
    votacao: votacao as Votacao,
    opcoes: (opcoes || []) as OpcaoVotacao[],
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
  const { data, error } = await supabaseServer
    .from('votos')
    .select('id')
    .eq('votacao_id', votacaoId)
    .eq('unidade_id', unidadeId)
    .single();

  return !error && !!data;
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
  const votacaoCompleta = await buscarVotacaoCompleta(votacaoId);
  if (!votacaoCompleta) {
    throw new Error('Votação não encontrada');
  }

  const { votacao } = votacaoCompleta;

  // Validações
  if (votacao.status !== 'aberta') {
    throw new Error('Votação não está aberta para votação');
  }

  const agora = new Date();
  const dataFim = new Date(votacao.data_fim);
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
  if (votacao.modo_auditoria === 'rastreado' && !userId) {
    throw new Error('User ID é obrigatório para votações rastreadas');
  }

  // Prepara dados do voto
  const dadosVoto: any = {
    votacao_id: votacaoId,
    unidade_id: unidadeId,
    opcoes_ids: opcoesIds,
    user_id: votacao.modo_auditoria === 'rastreado' ? userId : null,
  };

  // Para escolha única, também preenche opcao_id
  if (votacao.tipo === 'escolha_unica') {
    dadosVoto.opcao_id = opcoesIds[0];
  }

  const { data, error } = await supabaseServer
    .from('votos')
    .insert(dadosVoto)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Erro ao registrar voto');
  }

  return data as Voto;
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
  const votacaoCompleta = await buscarVotacaoCompleta(votacaoId);
  if (!votacaoCompleta) {
    throw new Error('Votação não encontrada');
  }

  const { votacao, opcoes } = votacaoCompleta;

  // Busca todos os votos
  const { data: votos, error } = await supabaseServer
    .from('votos')
    .select('*')
    .eq('votacao_id', votacaoId);

  if (error) {
    throw new Error(error.message);
  }

  const votosArray = (votos || []) as Voto[];
  const totalVotos = votosArray.length;

  // Calcula votos por opção
  const resultadoOpcoes = opcoes.map((opcao) => {
    let votos = 0;

    votosArray.forEach((voto) => {
      if (votacao.tipo === 'escolha_unica') {
        if (voto.opcao_id === opcao.id) {
          votos++;
        }
      } else {
        // múltipla escolha
        if (voto.opcoes_ids && voto.opcoes_ids.includes(opcao.id)) {
          votos++;
        }
      }
    });

    const percentual = totalVotos > 0 ? (votos / totalVotos) * 100 : 0;

    return {
      opcao,
      votos,
      percentual: Math.round(percentual * 100) / 100, // 2 casas decimais
    };
  });

  const resultado: ResultadoVotacao = {
    votacao,
    opcoes: resultadoOpcoes,
    total_votos: totalVotos,
  };

  // Inclui detalhes se solicitado e se for rastreado
  if (incluirDetalhes && votacao.modo_auditoria === 'rastreado') {
    resultado.votos_detalhados = votosArray;
  }

  return resultado;
}

