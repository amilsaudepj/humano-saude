import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createServiceClient } from '@/lib/supabase';
import { signToken } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const emailNorm = email.toLowerCase().trim();

    const { data: afiliado, error } = await supabase
      .from('corretor_afiliados')
      .select('id, corretor_id, nome, email, password_hash')
      .eq('email', emailNorm)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    if (error || !afiliado) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 },
      );
    }

    const hash = afiliado.password_hash as string | null;
    if (!hash) {
      return NextResponse.json(
        { error: 'Cadastre uma senha no seu perfil ou use o link que recebeu por e-mail para definir senha.' },
        { status: 401 },
      );
    }

    const senhaOk = await bcrypt.compare(senha, hash);
    if (!senhaOk) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 },
      );
    }

    const token = await signToken({
      email: afiliado.email ?? emailNorm,
      role: 'afiliado',
      afiliado_id: afiliado.id,
      corretor_id: afiliado.corretor_id,
    });

    const response = NextResponse.json({
      success: true,
      token,
      afiliado: {
        id: afiliado.id,
        nome: afiliado.nome,
        email: afiliado.email,
      },
    });

    response.cookies.set('afiliado_token', token, {
      path: '/',
      maxAge: 86400,
      sameSite: 'strict',
      httpOnly: false,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
