/**
 * Sistema de verificação WhatsApp.
 * 
 * Gerencia códigos de verificação de 6 dígitos,
 * rate limiting e expiração de sessões.
 */

import { prisma } from '@/lib/prisma';
import { normalizarTelefone } from './utils';

/**
 * Tempo de expiração do código de verificação (5 minutos).
 */
const TEMPO_EXPIRACAO_CODIGO = 5 * 60 * 1000; // 5 minutos em milissegundos

/**
 * Tempo de bloqueio após 3 tentativas falhas (15 minutos).
 */
const TEMPO_BLOQUEIO = 15 * 60 * 1000; // 15 minutos em milissegundos

/**
 * Número máximo de tentativas de verificação.
 */
const MAX_TENTATIVAS = 3;

/**
 * Gera um código de verificação de 6 dígitos.
 * 
 * @returns Código de 6 dígitos
 */
export function gerarCodigoVerificacao(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Cria ou atualiza uma sessão WhatsApp com código de verificação.
 * 
 * @param telefone - Número de telefone normalizado
 * @param usuarioId - ID do usuário vinculado
 * @returns Código de verificação gerado
 */
export async function criarSessaoComCodigo(
  telefone: string,
  usuarioId: string
): Promise<string> {
  const telefoneNormalizado = normalizarTelefone(telefone);
  const codigo = gerarCodigoVerificacao();
  const expiraEm = new Date(Date.now() + TEMPO_EXPIRACAO_CODIGO);

  await prisma.whatsAppSession.upsert({
    where: { telefone: telefoneNormalizado },
    update: {
      codigoVerificacao: codigo,
      codigoExpiraEm: expiraEm,
      tentativasVerificacao: 0, // Reseta tentativas ao gerar novo código
      ultimaTentativaEm: null,
    },
    create: {
      telefone: telefoneNormalizado,
      usuarioId,
      codigoVerificacao: codigo,
      codigoExpiraEm: expiraEm,
      tentativasVerificacao: 0,
    },
  });

  return codigo;
}

/**
 * Valida um código de verificação.
 * 
 * @param telefone - Número de telefone normalizado
 * @param codigo - Código a ser validado
 * @returns true se válido, false caso contrário
 * @throws {Error} Se estiver bloqueado por muitas tentativas
 */
export async function validarCodigo(
  telefone: string,
  codigo: string
): Promise<boolean> {
  const telefoneNormalizado = normalizarTelefone(telefone);

  const sessao = await prisma.whatsAppSession.findUnique({
    where: { telefone: telefoneNormalizado },
  });

  if (!sessao) {
    return false;
  }

  // Verifica se está bloqueado
  if (sessao.tentativasVerificacao >= MAX_TENTATIVAS && sessao.ultimaTentativaEm) {
    const tempoDesdeUltimaTentativa = Date.now() - sessao.ultimaTentativaEm.getTime();
    
    if (tempoDesdeUltimaTentativa < TEMPO_BLOQUEIO) {
      const minutosRestantes = Math.ceil((TEMPO_BLOQUEIO - tempoDesdeUltimaTentativa) / 60000);
      throw new Error(
        `Muitas tentativas falhas. Tente novamente em ${minutosRestantes} minuto(s).`
      );
    } else {
      // Bloqueio expirou, reseta tentativas
      await prisma.whatsAppSession.update({
        where: { telefone: telefoneNormalizado },
        data: {
          tentativasVerificacao: 0,
          ultimaTentativaEm: null,
        },
      });
    }
  }

  // Verifica se o código expirou
  if (!sessao.codigoExpiraEm || sessao.codigoExpiraEm < new Date()) {
    await prisma.whatsAppSession.update({
      where: { telefone: telefoneNormalizado },
      data: {
        tentativasVerificacao: sessao.tentativasVerificacao + 1,
        ultimaTentativaEm: new Date(),
      },
    });
    return false;
  }

  // Verifica se o código está correto
  if (sessao.codigoVerificacao !== codigo) {
    await prisma.whatsAppSession.update({
      where: { telefone: telefoneNormalizado },
      data: {
        tentativasVerificacao: sessao.tentativasVerificacao + 1,
        ultimaTentativaEm: new Date(),
      },
    });
    return false;
  }

  // Código válido - marca como verificado
  await prisma.whatsAppSession.update({
    where: { telefone: telefoneNormalizado },
    data: {
      verificadoEm: new Date(),
      codigoVerificacao: null, // Remove código após verificação
      codigoExpiraEm: null,
      tentativasVerificacao: 0,
      ultimaTentativaEm: null,
    },
  });

  return true;
}

/**
 * Verifica se uma sessão WhatsApp está verificada.
 * 
 * @param telefone - Número de telefone normalizado
 * @returns true se verificado
 */
export async function sessaoVerificada(telefone: string): Promise<boolean> {
  const telefoneNormalizado = normalizarTelefone(telefone);

  const sessao = await prisma.whatsAppSession.findUnique({
    where: { telefone: telefoneNormalizado },
    select: { verificadoEm: true },
  });

  return !!sessao?.verificadoEm;
}

/**
 * Busca a sessão WhatsApp de um telefone.
 * 
 * @param telefone - Número de telefone normalizado
 * @returns Sessão encontrada ou null
 */
export async function buscarSessao(telefone: string) {
  const telefoneNormalizado = normalizarTelefone(telefone);

  return await prisma.whatsAppSession.findUnique({
    where: { telefone: telefoneNormalizado },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          perfil: true,
          unidadeId: true,
          unidade: {
            select: {
              id: true,
              numero: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Limpa códigos de verificação expirados.
 * 
 * Esta função pode ser chamada periodicamente para limpar
 * códigos antigos do banco de dados.
 */
export async function limparCodigosExpirados(): Promise<void> {
  const agora = new Date();

  await prisma.whatsAppSession.updateMany({
    where: {
      codigoExpiraEm: {
        lt: agora,
      },
      verificadoEm: null, // Apenas códigos não verificados
    },
    data: {
      codigoVerificacao: null,
      codigoExpiraEm: null,
    },
  });
}

/**
 * Registra um voto feito via WhatsApp para auditoria.
 * 
 * @param votoId - ID do voto registrado
 * @param telefone - Número de telefone que votou
 * @param mensagemRecebida - Mensagem original recebida
 */
export async function registrarVotoWhatsApp(
  votoId: string,
  telefone: string,
  mensagemRecebida?: string
): Promise<void> {
  const telefoneNormalizado = normalizarTelefone(telefone);

  await prisma.whatsAppVoto.create({
    data: {
      votoId,
      telefone: telefoneNormalizado,
      mensagemRecebida: mensagemRecebida || null,
    },
  });
}

