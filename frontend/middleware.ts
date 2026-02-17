import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Secret para verificação de JWT no middleware (Edge Runtime)
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || '';
  return new TextEncoder().encode(secret);
}

// Verificar JWT retornando payload ou null
async function verifyJwt(token: string): Promise<{ email: string; role: string; corretor_id?: string } | null> {
  try {
    const secret = getJwtSecret();
    if (secret.length === 0) return null;
    const { payload } = await jwtVerify(token, secret);
    return payload as { email: string; role: string; corretor_id?: string };
  } catch {
    return null;
  }
}

// Verifica token JWT — retorna válido/inválido + role
async function resolveToken(token: string): Promise<{ valid: boolean; role?: string }> {
  const jwt = await verifyJwt(token);
  if (jwt) return { valid: true, role: jwt.role };
  return { valid: false };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // BYPASS: Cron Jobs assinados por CRON_SECRET
  // ============================================
  if (pathname.startsWith('/api/cron/') || pathname.startsWith('/api/social-flow/cron')) {
    const cronSecret = process.env.CRON_SECRET || '';
    const authHeader = request.headers.get('authorization') || '';
    const provided = authHeader.replace('Bearer ', '');

    if (!cronSecret || provided !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized cron request' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // ============================================
  // PROTEÇÃO: Portal interno (UI)
  // ============================================
  if (pathname.startsWith('/portal-interno-hks-2026')) {
    const token = request.cookies.get('admin_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    // Se não tiver token, redireciona para login
    if (!token && pathname !== '/portal-interno-hks-2026/login') {
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Se tiver token, verificar assinatura JWT
    if (token) {
      const result = await resolveToken(token);
      if (!result.valid) {
        // Token inválido/expirado → limpar cookie e redirecionar
        const loginUrl = new URL('/admin-login', request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.set('admin_token', '', { maxAge: 0, path: '/' });
        return response;
      }
    }
  }

  // ============================================
  // PROTEÇÃO: Portal do cliente
  // ============================================
  if (pathname.startsWith('/portal-cliente') && pathname !== '/portal-cliente/login') {
    const token = request.cookies.get('cliente_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      const loginUrl = new URL('/portal-cliente/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const result = await resolveToken(token);
    if (!result.valid || result.role !== 'cliente') {
      const loginUrl = new URL('/portal-cliente/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set('cliente_token', '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  // ============================================
  // PROTEÇÃO: Webhooks (validação básica — tokens verificados dentro das routes)
  // ============================================
  if (pathname.startsWith('/api/webhooks/')) {
    const response = NextResponse.next();
    // Headers de segurança
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }

  // ============================================
  // PROTEÇÃO: API do Cliente (portal-cliente)
  // ============================================
  if (pathname.startsWith('/api/cliente')) {
    const token = request.cookies.get('cliente_token')?.value ||
                  request.cookies.get('admin_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const result = await resolveToken(token);
    if (!result.valid || (result.role !== 'cliente' && result.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Token inválido ou sem permissão' },
        { status: 401 }
      );
    }
  }

  // ============================================
  // PROTEÇÃO: API routes internas (exceto leads, calculadora, auth, e corretor APIs)
  // ============================================
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/leads') && !pathname.startsWith('/api/calculadora') && !pathname.startsWith('/api/webhooks') && !pathname.startsWith('/api/health') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/corretor') && !pathname.startsWith('/api/cliente')) {
    const token = request.cookies.get('admin_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const result = await resolveToken(token);
    if (!result.valid) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  }

  // ============================================
  // PROTEÇÃO: API do Corretor (requer corretor_token OU admin_token)
  // ============================================
  if (pathname.startsWith('/api/corretor')) {
    const token = request.cookies.get('corretor_token')?.value ||
                  request.cookies.get('admin_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const result = await resolveToken(token);
    if (!result.valid) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  }

  // ============================================
  // PROTEÇÃO: Dashboard do Corretor (Multi-Tenant)
  // ============================================
  if (pathname.startsWith('/dashboard/corretor') && pathname !== '/dashboard/corretor/login' && pathname !== '/dashboard/corretor/cadastro' && !pathname.startsWith('/dashboard/corretor/onboarding')) {
    const token = request.cookies.get('corretor_token')?.value ||
                  request.cookies.get('admin_token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      const loginUrl = new URL('/dashboard/corretor/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const result = await resolveToken(token);
    if (!result.valid) {
      const loginUrl = new URL('/dashboard/corretor/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set('corretor_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  // ============================================
  // BLOQUEIO: Rotas legadas (exceto /dashboard/corretor)
  // ============================================
  if ((pathname === '/dashboard' || pathname.startsWith('/dashboard/')) && !pathname.startsWith('/dashboard/corretor')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal-interno-hks-2026/:path*',
    '/portal-cliente/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
