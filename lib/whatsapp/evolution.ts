/**
 * Cliente Evolution API para WhatsApp.
 * 
 * Gerencia comunicação com a Evolution API para envio de mensagens,
 * botões interativos e listas.
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || '';

/**
 * Formata número de telefone para formato WhatsApp (com código do país).
 * 
 * @param telefone - Número de telefone
 * @returns Telefone formatado (ex: 5511987654321@c.us)
 */
function formatarTelefoneWhatsApp(telefone: string): string {
  // Remove caracteres não numéricos
  let numero = telefone.replace(/\D/g, '');
  
  // Se não começar com 55 (código do Brasil), adiciona
  if (!numero.startsWith('55')) {
    numero = '55' + numero;
  }
  
  return `${numero}@c.us`;
}

/**
 * Envia uma mensagem de texto simples.
 * 
 * @param telefone - Número de telefone do destinatário
 * @param mensagem - Texto da mensagem
 * @returns Resposta da API
 */
export async function sendMessage(
  telefone: string,
  mensagem: string
): Promise<any> {
  const telefoneFormatado = formatarTelefoneWhatsApp(telefone);

  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: telefoneFormatado,
        textMessage: {
          text: mensagem,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao enviar mensagem: ${error}`);
  }

  return await response.json();
}

/**
 * Envia uma mensagem com botões interativos.
 * 
 * @param telefone - Número de telefone do destinatário
 * @param mensagem - Texto da mensagem
 * @param botoes - Array de botões (máximo 3)
 * @param titulo - Título opcional (máximo 20 caracteres)
 * @param rodape - Rodapé opcional (máximo 60 caracteres)
 * @returns Resposta da API
 */
export async function sendButtons(
  telefone: string,
  mensagem: string,
  botoes: Array<{ id: string; texto: string }>,
  titulo?: string,
  rodape?: string
): Promise<any> {
  const telefoneFormatado = formatarTelefoneWhatsApp(telefone);

  // Limita a 3 botões (limite do WhatsApp)
  const botoesLimitados = botoes.slice(0, 3);

  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendButtons/${EVOLUTION_INSTANCE_NAME}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: telefoneFormatado,
        buttonsMessage: {
          text: mensagem,
          title: titulo || '',
          footerText: rodape || '',
          buttons: botoesLimitados.map((botao) => ({
            buttonId: botao.id,
            buttonText: {
              displayText: botao.texto,
            },
          })),
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao enviar botões: ${error}`);
  }

  return await response.json();
}

/**
 * Envia uma mensagem com lista de opções.
 * 
 * @param telefone - Número de telefone do destinatário
 * @param titulo - Título da lista (máximo 24 caracteres)
 * @param descricao - Descrição da lista (máximo 72 caracteres)
 * @param botaoTexto - Texto do botão (máximo 20 caracteres)
 * @param itens - Array de itens da lista (máximo 10)
 * @param rodape - Rodapé opcional (máximo 60 caracteres)
 * @returns Resposta da API
 */
export async function sendList(
  telefone: string,
  titulo: string,
  descricao: string,
  botaoTexto: string,
  itens: Array<{
    id: string;
    titulo: string;
    descricao?: string;
  }>,
  rodape?: string
): Promise<any> {
  const telefoneFormatado = formatarTelefoneWhatsApp(telefone);

  // Limita a 10 itens (limite do WhatsApp)
  const itensLimitados = itens.slice(0, 10);

  // Agrupa itens em seções (máximo 10 itens por seção)
  const secoes = [
    {
      title: titulo,
      rows: itensLimitados.map((item) => ({
        title: item.titulo,
        description: item.descricao || '',
        rowId: item.id,
      })),
    },
  ];

  const response = await fetch(
    `${EVOLUTION_API_URL}/message/sendList/${EVOLUTION_INSTANCE_NAME}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: telefoneFormatado,
        listMessage: {
          title: titulo,
          description: descricao,
          buttonText: botaoTexto,
          footerText: rodape || '',
          sections: secoes,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao enviar lista: ${error}`);
  }

  return await response.json();
}

/**
 * Verifica se a configuração da Evolution API está válida.
 * 
 * @returns true se configurado corretamente
 */
export function validarConfiguracao(): boolean {
  return !!(
    EVOLUTION_API_URL &&
    EVOLUTION_API_KEY &&
    EVOLUTION_INSTANCE_NAME
  );
}

