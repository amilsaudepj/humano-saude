import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { signToken } from '@/lib/auth-jwt';
import { registrarLogin } from '@/lib/login-tracker';

// =============================================
// Credenciais de teste (DEV ONLY)
// Em produção, remover e usar apenas Supabase Auth
// =============================================
const DEV_USERS = [
  {
    email: 'corretor@humanosaude.com',
    senha: 'humano2026',
    corretor: {
      id: 'dev-corretor-001',
      nome_completo: 'Corretor Teste',
      role: 'corretor',
    },
  },
  {
    email: 'admin@humanosaude.com',
    senha: 'admin2026',
    corretor: {
      id: 'dev-admin-001',
      nome_completo: 'Admin Teste',
      role: 'admin',
    },
  },
];

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

    // =============================================
    // 1. Tentar autenticação via Supabase Auth
    // =============================================
    try {
      const supabase = createServiceClient();

      const { data: corretor, error } = await supabase
        .from('corretores')
        .select('id, nome, role, ativo, metadata')
        .eq('email', email.toLowerCase().trim())
        .eq('ativo', true)
        .single();

      if (corretor && !error) {
        // Validar senha (armazenada em metadata.senha_temporaria)
        const meta = (corretor.metadata as Record<string, unknown>) ?? {};
        const senhaSalva = meta.senha_temporaria as string | undefined;

        if (!senhaSalva || senhaSalva !== senha) {
          return NextResponse.json(
            { error: 'E-mail ou senha inválidos' },
            { status: 401 },
          );
        }

        // JWT assinado com HS256 (24h)
        const token = await signToken({
          email,
          role: (corretor.role as 'admin' | 'corretor') || 'corretor',
          corretor_id: corretor.id,
        });

        // Registrar login
        await registrarLogin(email, 'corretor', request, corretor.id);

        const response = NextResponse.json({
          success: true,
          token,
          corretor: {
            id: corretor.id,
            nome: corretor.nome,
            role: corretor.role,
          },
        });

        response.cookies.set('corretor_token', token, {
          path: '/',
          maxAge: 86400,
          sameSite: 'strict',
          httpOnly: false,
        });

        return response;
      }
    } catch {
      // Supabase não disponível, usar fallback dev
    }

    // =============================================
    // 2. Fallback: Credenciais de desenvolvimento
    // =============================================
    const devUser = DEV_USERS.find(
      (u) => u.email === email.toLowerCase().trim() && u.senha === senha,
    );

    if (!devUser) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 },
      );
    }

    const token = await signToken({
      email: devUser.email,
      role: devUser.corretor.role as 'admin' | 'corretor',
      corretor_id: devUser.corretor.id,
    });

    // Registrar login do dev user
    await registrarLogin(devUser.email, 'corretor', request, devUser.corretor.id);

    const response = NextResponse.json({
      success: true,
      token,
      corretor: devUser.corretor,
    });

    response.cookies.set('corretor_token', token, {
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
