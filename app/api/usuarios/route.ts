/**
 * API Route para gerenciar usuários.
 * 
 * GET: Lista todos os usuários
 * POST: Cria um novo usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { criarUsuario } from '@/lib/db';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isValidTelefone } from '@/lib/utils/masks';

// Schema de validação para criar usuário
const criarUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome: z.string().min(1, 'Nome é obrigatório'),
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
  perfil: z.enum(['staff', 'morador']),
  conselheiro: z.boolean().optional().default(false),
  tipoUsuario: z.enum(['proprietario', 'inquilino']).optional().nullable(),
  procuracaoAtiva: z.boolean().optional().default(false),
  // Aceita string vazia, UUID válido ou null/undefined (compatibilidade)
  unidade_id: z
    .union([z.string().uuid(), z.string().length(0), z.null(), z.undefined()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === undefined ? null : val)),
  // Array de IDs de unidades (novo)
  unidades_ids: z.array(z.string().uuid()).optional(),
  forcar_troca_senha: z.boolean().optional().default(false),
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
  if (data.perfil === 'morador') {
    return data.tipoUsuario !== null && data.tipoUsuario !== undefined;
  }
  return true;
}, {
  message: 'Morador deve ter tipoUsuario definido',
  path: ['tipoUsuario'],
}).refine((data) => {
  // Se conselheiro = true, tipoUsuario deve ser proprietario
  if (data.conselheiro && data.tipoUsuario !== 'proprietario') {
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

export async function GET() {
  try {
    const session = await auth();

    // Apenas staff pode listar usuários
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const usuarios = await prisma.usuario.findMany({
      include: {
        unidade: {
          select: {
            id: true,
            numero: true,
          },
        },
        usuarioUnidades: {
          include: {
            unidade: {
              select: {
                id: true,
                numero: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove passwordHash e formata resposta
    const usuariosFormatados = usuarios.map((u) => {
      const { passwordHash, ...rest } = u;
      const unidades = rest.usuarioUnidades?.map(uu => ({
        id: uu.unidade.id,
        numero: uu.unidade.numero,
      })) || [];
      
      return {
        ...rest,
        unidade_id: rest.unidadeId, // Mantido para compatibilidade
        created_at: rest.createdAt,
        updated_at: rest.updatedAt,
        unidades: unidades.length > 0 ? unidades : (rest.unidade ? [{
          id: rest.unidade.id,
          numero: rest.unidade.numero,
        }] : []),
      };
    });

    return NextResponse.json(usuariosFormatados);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Apenas staff pode criar usuários
    if (!session || session.user?.perfil !== 'staff') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const dados = criarUsuarioSchema.parse(body);

    const usuario = await criarUsuario({
      email: dados.email,
      senha: dados.senha,
      nome: dados.nome,
      telefone: dados.telefone || '',
      perfil: dados.perfil,
      conselheiro: dados.conselheiro || false,
      tipoUsuario: dados.tipoUsuario || null,
      procuracaoAtiva: dados.procuracaoAtiva || false,
      unidade_id: dados.unidade_id, // Mantido para compatibilidade
      unidades_ids: dados.unidades_ids, // Novo: array de unidades
      forcar_troca_senha: dados.forcar_troca_senha || false,
    });

    // Remove passwordHash da resposta
    const { passwordHash, ...usuarioSemSenha } = usuario as any;

    return NextResponse.json(usuarioSemSenha, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Email já cadastrado') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

