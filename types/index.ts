/**
 * Tipos e interfaces principais do sistema de votação condominial.
 * 
 * Este arquivo centraliza todas as definições de tipos TypeScript
 * para garantir consistência e facilitar a manutenção.
 */

/**
 * Perfis de usuário no sistema.
 * 
 * - staff: Funcionário do condomínio (acesso administrativo completo, não vota)
 * - morador: Morador do condomínio (pode votar, tem tipo e pode ter status)
 */
export type PerfilUsuario = 'staff' | 'morador';

/**
 * Tipo de usuário morador.
 * 
 * - proprietario: Proprietário da unidade
 * - inquilino: Inquilino da unidade (pode ter procuração ativa)
 */
export type TipoUsuario = 'proprietario' | 'inquilino';

/**
 * Tipo de votação disponível.
 * 
 * - escolha_unica: Votante escolhe apenas uma opção (ex: Sim/Não)
 * - multipla_escolha: Votante pode escolher múltiplas opções (ex: candidatos A, B, C)
 */
export type TipoVotacao = 'escolha_unica' | 'multipla_escolha';

/**
 * Modo de auditoria da votação.
 * 
 * - anonimo: Votos não são rastreados por usuário (privacidade total)
 * - rastreado: Votos são vinculados ao usuário que votou (auditoria completa)
 */
export type ModoAuditoria = 'anonimo' | 'rastreado';

/**
 * Status de uma votação.
 * 
 * - rascunho: Votação criada mas ainda não aberta
 * - aberta: Votação ativa e recebendo votos
 * - encerrada: Votação finalizada, não aceita mais votos
 */
export type StatusVotacao = 'rascunho' | 'aberta' | 'encerrada';

/**
 * Representa um usuário do sistema.
 */
export interface Usuario {
  id: string;
  email: string;
  nome: string;
  telefone: string;
  perfil: PerfilUsuario;
  conselheiro: boolean; // Indica se o morador é membro do conselho
  tipoUsuario: TipoUsuario | null; // Tipo de usuário morador (apenas se perfil = morador)
  procuracaoAtiva: boolean; // Indica se o inquilino tem procuração ativa (apenas se tipo = inquilino)
  unidade_id: string | null; // Mantido para compatibilidade (deprecated)
  unidades?: Unidade[]; // Array de unidades vinculadas (novo)
  created_at: string;
  updated_at: string;
}

/**
 * Representa uma unidade do condomínio.
 * 
 * IMPORTANTE: Uma unidade pode ter múltiplos moradores ao longo do tempo
 * (aluguel/venda), mas apenas um voto por unidade é permitido por votação.
 * O histórico de votos é mantido pela unidade, não pelo usuário.
 */
export interface Unidade {
  id: string;
  numero: string;
  procuracaoAtiva: boolean; // Indica se existe inquilino com procuração ativa nesta unidade
  created_at: string;
  updated_at: string;
}

/**
 * Representa uma votação criada no sistema.
 */
export interface Votacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoVotacao;
  modo_auditoria: ModoAuditoria;
  mostrar_parcial: boolean; // Se true, mostra resultados parciais durante a votação
  permitir_alterar_voto: boolean; // Se true, permite alterar o voto até o fim da votação
  criado_por: string; // user_id
  data_inicio: string;
  data_fim: string;
  status: StatusVotacao;
  created_at: string;
  updated_at: string;
}

/**
 * Representa uma opção de votação.
 */
export interface OpcaoVotacao {
  id: string;
  votacao_id: string;
  texto: string;
  ordem: number;
  created_at: string;
}

/**
 * Representa um voto registrado.
 * 
 * IMPORTANTE: O voto é vinculado à unidade, não ao usuário.
 * Isso permite que quando um morador muda (aluguel/venda),
 * a unidade mantenha seu histórico de votos.
 * 
 * - opcao_id: usado para escolha única
 * - opcoes_ids: usado para múltipla escolha (array JSON)
 * - user_id: apenas preenchido se modo_auditoria = 'rastreado'
 */
export interface Voto {
  id: string;
  votacao_id: string;
  unidade_id: string;
  opcao_id: string | null; // para escolha única
  opcoes_ids: string[] | null; // para múltipla escolha (JSON array)
  user_id: string | null; // apenas se modo_auditoria = 'rastreado'
  created_at: string;
}

/**
 * Dados para criar um novo usuário.
 */
export interface CriarUsuarioDTO {
  email: string;
  senha: string;
  nome: string;
  telefone: string;
  perfil: PerfilUsuario;
  conselheiro?: boolean; // Indica se é membro do conselho (apenas se perfil = morador)
  tipoUsuario?: TipoUsuario; // Tipo de usuário morador (obrigatório se perfil = morador)
  procuracaoAtiva?: boolean; // Indica se tem procuração ativa (apenas se tipo = inquilino)
  unidade_id?: string | null; // Mantido para compatibilidade (deprecated)
  unidades_ids?: string[]; // Array de IDs de unidades (novo)
  forcar_troca_senha?: boolean; // Força troca de senha no próximo login
}

/**
 * Dados para atualizar um usuário.
 */
export interface AtualizarUsuarioDTO {
  email?: string;
  nome?: string;
  telefone?: string;
  perfil?: PerfilUsuario;
  conselheiro?: boolean; // Indica se é membro do conselho (apenas se perfil = morador)
  tipoUsuario?: TipoUsuario; // Tipo de usuário morador (obrigatório se perfil = morador)
  procuracaoAtiva?: boolean; // Indica se tem procuração ativa (apenas se tipo = inquilino)
  unidade_id?: string | null; // Mantido para compatibilidade (deprecated)
  unidades_ids?: string[]; // Array de IDs de unidades (novo)
  forcar_troca_senha?: boolean; // Força troca de senha no próximo login
}

/**
 * Dados para criar uma nova votação.
 */
export interface CriarVotacaoDTO {
  titulo: string;
  descricao: string;
  tipo: TipoVotacao;
  modo_auditoria: ModoAuditoria;
  mostrar_parcial?: boolean; // Se true, mostra resultados parciais durante a votação
  permitir_alterar_voto?: boolean; // Se true, permite alterar o voto até o fim da votação
  data_inicio: string;
  data_fim: string;
  opcoes: string[]; // textos das opções
}

/**
 * Dados para registrar um voto.
 */
export interface RegistrarVotoDTO {
  votacao_id: string;
  opcoes_ids: string[]; // array mesmo para escolha única
}

/**
 * Resultado de uma votação (para exibição).
 */
export interface ResultadoVotacao {
  votacao: Votacao;
  opcoes: Array<{
    opcao: OpcaoVotacao;
    votos: number;
    percentual: number;
  }>;
  total_votos: number;
  votos_detalhados?: Voto[]; // apenas se modo_auditoria = 'rastreado' e usuário tem permissão
}

