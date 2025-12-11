/**
 * API Route para gerenciar usuários.
 * 
 * GET: Lista todos os usuários
 * POST: Cria um novo usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { criarUsuario, listarUnidades } from '@/lib/db';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';

// Schema de validação para criar usuário
const criarUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().optional(),
  perfil: z.enum(['staff', 'conselho', 'auditor', 'morador']),
  unidade_id: z.string().uuid().nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    // Apenas staff e conselho podem listar usuários
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { data, error } = await supabaseServer
      .from('users')
      .select(`
        id,
        email,
        nome,
        telefone,
        perfil,
        unidade_id,
        created_at,
        updated_at,
        unidades:unidade_id (
          id,
          numero
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
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

    // Apenas staff e conselho podem criar usuários
    if (!session || (session.user?.perfil !== 'staff' && session.user?.perfil !== 'conselho')) {
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
      unidade_id: dados.unidade_id || null,
    });

    // Remove password_hash da resposta
    const { password_hash, ...usuarioSemSenha } = usuario as any;

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

