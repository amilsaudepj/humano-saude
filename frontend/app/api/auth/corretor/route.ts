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
    // 1. Tentar autenticação via Supabase (corretores)
    // =============================================
    const PRAZO_DIAS_CONFIRMACAO_EMAIL = 7;

    try {
      const supabase = createServiceClient();

      const { data: corretor, error } = await supabase
        .from('corretores')
        .select('id, nome, role, ativo, metadata, email_confirmado_em, created_at, prazo_confirmacao_email_desde')
        .eq('email', email.toLowerCase().trim())
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

        // Conta suspensa
        if (corretor.ativo === false) {
          return NextResponse.json(
            { error: 'Sua conta está suspensa. Entre em contato com o suporte.' },
            { status: 401 },
          );
        }

        // Regra 7 dias: e-mail não confirmado há mais de 7 dias → suspender
        // Isentar corretores de sistema (ex.: sem vínculo - helciodmtt) via env ou lista fixa
        const emailsIsentos = (process.env.CORRETOR_EMAILS_ISENTOS_CONFIRMACAO_EMAIL ?? 'helciodmtt@gmail.com')
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const emailCorretor = (email as string).trim().toLowerCase();
        const isento = emailsIsentos.includes(emailCorretor);

        if (!isento) {
          const emailConfirmadoEm = (corretor as { email_confirmado_em?: string | null }).email_confirmado_em;
          const prazoDesde = (corretor as { prazo_confirmacao_email_desde?: string | null }).prazo_confirmacao_email_desde;
          const createdAt = (corretor as { created_at?: string }).created_at;
          const inicioPrazo = prazoDesde || createdAt;
          if (emailConfirmadoEm == null && inicioPrazo) {
            const inicioEm = new Date(inicioPrazo).getTime();
            const diasDesdeInicio = (Date.now() - inicioEm) / (24 * 60 * 60 * 1000);
            if (diasDesdeInicio >= PRAZO_DIAS_CONFIRMACAO_EMAIL) {
              await supabase
                .from('corretores')
                .update({ ativo: false })
                .eq('id', corretor.id);
              return NextResponse.json(
                { error: 'Sua conta foi suspensa por não confirmação do e-mail em até 7 dias. Entre em contato com o suporte.' },
                { status: 401 },
              );
            }
          }
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
