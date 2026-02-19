import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createServiceClient } from '@/lib/supabase';
import { signToken } from '@/lib/auth-jwt';
import { checkRateLimit, loginLimiter } from '@/lib/rate-limit';
import { registrarLogin } from '@/lib/login-tracker';

export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, loginLimiter);
    if (blocked) return blocked;

    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const senha = String(body?.senha || '').trim();

    if (!email || !senha) {
      return NextResponse.json({ success: false, message: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const sb = createServiceClient();

    const { data: account, error } = await sb
      .from('portal_client_accounts')
      .select('id, nome, email, senha_hash, status')
      .ilike('email', email)
      .maybeSingle();

    if (error || !account) {
      return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 401 });
    }

    if (account.status !== 'ativo') {
      return NextResponse.json({ success: false, message: 'Sua conta está indisponível. Fale com a equipe.' }, { status: 403 });
    }

    const senhaOk = await bcrypt.compare(senha, String(account.senha_hash || ''));
    if (!senhaOk) {
      return NextResponse.json({ success: false, message: 'Credenciais inválidas.' }, { status: 401 });
    }

    await sb
      .from('portal_client_accounts')
      .update({ ultimo_login_em: new Date().toISOString() })
      .eq('id', account.id);

    // Registrar login em user_login_logs para auditoria (não bloqueante)
    try {
      await registrarLogin(String(account.email), 'user', request, String(account.id));
    } catch {
      // Não atrapalha o fluxo de login — registrarLogin já faz log interno em caso de erro
    }

    const token = await signToken({
      email: String(account.email),
      role: 'cliente',
      cliente_id: String(account.id),
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso.',
      cliente: {
        id: account.id,
        nome: account.nome,
        email: account.email,
      },
    });

    response.cookies.set('cliente_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, message: 'Erro interno no login.' }, { status: 500 });
  }
}
