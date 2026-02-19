import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/auth-jwt';
import { checkRateLimit, loginLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { registrarLogin } from '@/lib/login-tracker';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || '').trim();
const ADMIN_PASSWORD_LEGACY = (process.env.ADMIN_PASSWORD || '').trim();

async function validatePassword(input: string): Promise<boolean> {
  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(input, ADMIN_PASSWORD_HASH);
  }
  if (ADMIN_PASSWORD_LEGACY) {
    logger.warn('ADMIN_PASSWORD em plaintext detectada. Migre para ADMIN_PASSWORD_HASH.', {
      action: 'npx tsx scripts/generate-password-hash.ts',
    });
    return input === ADMIN_PASSWORD_LEGACY;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, loginLimiter);
    if (blocked) return blocked;

    const { email, password } = await request.json();
    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();

    if (!ADMIN_EMAIL) {
      logger.error('ADMIN_EMAIL não configurado nas variáveis de ambiente');
      return NextResponse.json(
        { success: false, message: 'Configuração do servidor incompleta' },
        { status: 500 },
      );
    }

    if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD_LEGACY) {
      logger.error('Nenhuma senha admin configurada (ADMIN_PASSWORD_HASH ou ADMIN_PASSWORD)');
      return NextResponse.json(
        { success: false, message: 'Configuração do servidor incompleta' },
        { status: 500 },
      );
    }

    if (trimmedEmail !== ADMIN_EMAIL) {
      logger.warn('Tentativa de login admin com email inválido', { email: trimmedEmail });
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' },
        { status: 401 },
      );
    }

    const isValid = await validatePassword(trimmedPassword);
    if (!isValid) {
      logger.warn('Tentativa de login admin com senha inválida', { email: trimmedEmail });
      return NextResponse.json(
        { success: false, message: 'Credenciais inválidas' },
        { status: 401 },
      );
    }

    const token = await signToken({ email: ADMIN_EMAIL, role: 'admin' });

    // Registrar login
    await registrarLogin(ADMIN_EMAIL, 'admin', request);

    const response = NextResponse.json({
      success: true,
      token,
      message: 'Login bem-sucedido',
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    // Cookie marcador legível pelo JavaScript do cliente
    // (não contém dados sensíveis — apenas sinaliza sessão admin ativa)
    response.cookies.set('admin_session', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    logger.info('Login admin bem-sucedido', { email: ADMIN_EMAIL });

    return response;
  } catch (error) {
    logger.error('Erro no login admin', error);
    return NextResponse.json(
      { success: false, message: 'Erro no servidor' },
      { status: 500 },
    );
  }
}
