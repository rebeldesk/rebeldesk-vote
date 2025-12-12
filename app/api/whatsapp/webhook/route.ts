/**
 * Webhook para receber mensagens do Evolution API.
 * 
 * Este endpoint recebe eventos do WhatsApp via Evolution API
 * e processa as mensagens recebidas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processarMensagem } from '@/lib/whatsapp/messageHandler';

/**
 * Valida a assinatura do webhook (se configurado).
 * 
 * @param request - Request do webhook
 * @returns true se válido
 */
function validarAssinatura(request: NextRequest): boolean {
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;

  // Se não há secret configurado, aceita todas as requisições
  if (!webhookSecret) {
    return true;
  }

  // TODO: Implementar validação de assinatura se Evolution API suportar
  // Por enquanto, aceita todas as requisições
  return true;
}

/**
 * Extrai dados da mensagem do Evolution API.
 * 
 * @param body - Body da requisição
 * @returns Dados da mensagem ou null
 */
function extrairDadosMensagem(body: any): {
  telefone: string;
  mensagem: string;
  buttonId?: string;
  listId?: string;
} | null {
  try {
    // Estrutura pode variar conforme a versão da Evolution API
    // Ajuste conforme necessário

    // Mensagem de texto
    if (body.data?.key?.remoteJid) {
      const telefone = body.data.key.remoteJid.replace('@c.us', '').replace('@s.whatsapp.net', '');
      const mensagemTexto = body.data.message?.conversation || 
                           body.data.message?.extendedTextMessage?.text || 
                           '';

      return {
        telefone,
        mensagem: mensagemTexto,
      };
    }

    // Mensagem de botão
    if (body.data?.message?.buttonsResponseMessage) {
      const telefone = body.data.key?.remoteJid?.replace('@c.us', '').replace('@s.whatsapp.net', '') || '';
      const buttonId = body.data.message.buttonsResponseMessage.selectedButtonId;

      return {
        telefone,
        mensagem: '',
        buttonId,
      };
    }

    // Mensagem de lista
    if (body.data?.message?.listResponseMessage) {
      const telefone = body.data.key?.remoteJid?.replace('@c.us', '').replace('@s.whatsapp.net', '') || '';
      const listId = body.data.message.listResponseMessage.singleSelectReply?.selectedRowId;

      return {
        telefone,
        mensagem: '',
        listId,
      };
    }

    // Formato alternativo (webhook direto)
    if (body.phone && body.text) {
      return {
        telefone: body.phone,
        mensagem: body.text,
      };
    }

    // Formato alternativo para botões
    if (body.phone && body.buttonId) {
      return {
        telefone: body.phone,
        mensagem: '',
        buttonId: body.buttonId,
      };
    }

    // Formato alternativo para listas
    if (body.phone && body.listId) {
      return {
        telefone: body.phone,
        mensagem: '',
        listId: body.listId,
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao extrair dados da mensagem:', error);
    return null;
  }
}

/**
 * POST: Recebe webhook do Evolution API.
 */
export async function POST(request: NextRequest) {
  try {
    // Valida assinatura
    if (!validarAssinatura(request)) {
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Log para debug (remover em produção se necessário)
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    // Extrai dados da mensagem
    const dadosMensagem = extrairDadosMensagem(body);

    if (!dadosMensagem) {
      console.warn('Formato de mensagem não reconhecido:', body);
      return NextResponse.json(
        { error: 'Formato de mensagem não reconhecido' },
        { status: 400 }
      );
    }

    // Processa mensagem de forma assíncrona (não bloqueia resposta)
    processarMensagem(
      dadosMensagem.telefone,
      dadosMensagem.mensagem,
      dadosMensagem.buttonId,
      dadosMensagem.listId
    ).catch((error) => {
      console.error('Erro ao processar mensagem:', error);
    });

    // Retorna resposta imediata para o Evolution API
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET: Endpoint de health check.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'whatsapp-webhook',
  });
}

