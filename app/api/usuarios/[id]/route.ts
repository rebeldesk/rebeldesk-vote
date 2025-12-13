/**
 * API Route para gerenciar um usuário específico.
 * 
 * GET: Busca um usuário por ID
 * PUT: Atualiza um usuário
 * DELETE: Exclui um usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buscarUsuarioPorId, atualizarUsuario } from '@/lib/db';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isValidTelefone } from '@/lib/utils/masks';

// Schema de validação para atualizar usuário
const atualizarUsuarioSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  telefone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Telefone é opcional
        const numbers = val.replace(/\D/g, '');
        return isValidTelefone(numbers);
      },
      {
        message: 'Telefone deve ter DDD + número completo (10 ou 11 dígitos)',
      }
    ),
  perfil: z.enum(['staff', 'morador']).optional(),
  conselheiro: z.boolean().optional(),
  tipoUsuario: z.enum(['proprietario', 'inquilino']).optional().nullable(),
  procuracaoAtiva: z.boolean().optional(),
  // Aceita string vazia, UUID válido ou null/undefined (compatibilidade)
  unidade_id: z
    .union([z.string().uuid(), z.string().length(0), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === undefined ? null : val)),
  // Array de IDs de unidades (novo)
  unidades_ids: z.array(z.string().uuid()).optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  forcar_troca_senha: z.boolean().optional(),
}).refine((data) => {
  // Se perfil = staff, conselheiro deve ser false e tipoUsuario deve ser null
  if (data.perfil === 'staff') {
    return !data.conselheiro && !data.tipoUsuario && !data.procuracaoAtiva;
  }
  return true;
}, {
  message: 'Staff não pode ter conselheiro, tipoUsuario ou procuracaoAtiva',
  path: ['perfil'],
}).refine((data) => {
  // Se perfil = morador, tipoUsuario é obrigatório
  if (data.perfil === 'morador' && data.tipoUsuario === undefined) {
    // Se está atualizando e não forneceu tipoUsuario, não valida (mantém o existente)
    return true;
  }
  if (data.perfil === 'morador' && data.tipoUsuario === null) {
    return false;
  }
  return true;
}, {
  message: 'Morador deve ter tipoUsuario definido',
  path: ['tipoUsuario'],
}).refine((data) => {
  // Se conselheiro = true, tipoUsuario deve ser proprietario
  if (data.conselheiro && data.tipoUsuario !== undefined && data.tipoUsuario !== 'proprietario') {
    return false;
  }
  return true;
}, {
  message: 'Conselheiro deve ser proprietário',
  path: ['conselheiro'],
}).refine((data) => {
  // Se tipo = proprietario, procuracaoAtiva deve ser false
  if (data.tipoUsuario === 'proprietario' && data.procuracaoAtiva) {
    return false;
  }
  return true;
}, {
  message: 'Proprietário não pode ter procuração ativa',
  path: ['procuracaoAtiva'],
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode ver usuários
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const usuario = await buscarUsuarioPorId(id);

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Remove password_hash da resposta
    const { password_hash, ...usuarioSemSenha } = usuario as any;

    return NextResponse.json(usuarioSemSenha);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode atualizar usuários
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const dados = atualizarUsuarioSchema.parse(body);

    // Prepara dados para atualização (inclui senha se fornecida)
    const dadosAtualizacao: any = {
      email: dados.email,
      nome: dados.nome,
      telefone: dados.telefone,
      perfil: dados.perfil,
      conselheiro: dados.conselheiro,
      tipoUsuario: dados.tipoUsuario,
      procuracaoAtiva: dados.procuracaoAtiva,
    };

    // Inclui forcar_troca_senha se fornecido
    if (dados.forcar_troca_senha !== undefined) {
      dadosAtualizacao.forcar_troca_senha = dados.forcar_troca_senha;
    }

    // Sempre inclui unidade_id se foi fornecido (incluindo null para remover unidade) - compatibilidade
    if (dados.unidade_id !== undefined) {
      dadosAtualizacao.unidade_id = dados.unidade_id;
    }

    // Inclui unidades_ids se fornecido (novo)
    if (dados.unidades_ids !== undefined) {
      dadosAtualizacao.unidades_ids = dados.unidades_ids;
    }

    // Se senha foi fornecida, inclui na atualização
    if (dados.senha) {
      dadosAtualizacao.senha = dados.senha;
    }

    const usuario = await atualizarUsuario(id, dadosAtualizacao);

    // Remove password_hash da resposta
    const { password_hash, ...usuarioSemSenha } = usuario as any;

    return NextResponse.json(usuarioSemSenha);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Apenas staff pode excluir usuários
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Não permite excluir a si mesmo
    if (session.user?.id === id) {
      return NextResponse.json(
        { error: 'Não é possível excluir seu próprio usuário' },
        { status: 400 }
      );
    }

    // Busca o usuário antes de deletar para atualizar flags nas unidades
    const usuarioParaDeletar = await prisma.usuario.findUnique({
      where: { id },
      include: {
        usuarioUnidades: {
          include: {
            unidade: true,
          },
        },
        unidade: true,
      },
    });

    await prisma.usuario.delete({
      where: { id },
    });

    // Atualiza flag procuracaoAtiva nas unidades após deletar
    if (usuarioParaDeletar) {
      const unidadesIds: string[] = [];
      if (usuarioParaDeletar.usuarioUnidades && usuarioParaDeletar.usuarioUnidades.length > 0) {
        unidadesIds.push(...usuarioParaDeletar.usuarioUnidades.map(uu => uu.unidadeId));
      }
      if (usuarioParaDeletar.unidadeId) {
        unidadesIds.push(usuarioParaDeletar.unidadeId);
      }
      const unidadesUnicas = [...new Set(unidadesIds)];

      for (const unidadeId of unidadesUnicas) {
        const inquilinoComProcuração = await prisma.usuario.findFirst({
          where: {
            OR: [
              { usuarioUnidades: { some: { unidadeId } } },
              { unidadeId },
            ],
            tipoUsuario: 'inquilino',
            procuracaoAtiva: true,
          },
        });

        await prisma.unidade.update({
          where: { id: unidadeId },
          data: {
            procuracaoAtiva: !!inquilinoComProcuração,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
}

