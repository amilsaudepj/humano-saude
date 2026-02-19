import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Mapa de rotas → chaves de permissão (Edge-compatible, inlined) ────
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/portal-interno-hks-2026/leads': 'nav_comercial_leads',
  '/portal-interno-hks-2026/funil': 'nav_comercial_pipeline',
  '/portal-interno-hks-2026/crm': 'nav_comercial_crm',
  '/portal-interno-hks-2026/propostas': 'nav_comercial_propostas',
  '/portal-interno-hks-2026/cotacoes': 'nav_comercial_cotacoes',
  '/portal-interno-hks-2026/planos': 'nav_comercial_planos',
  '/portal-interno-hks-2026/contratos': 'nav_comercial_contratos',
  '/portal-interno-hks-2026/vendas': 'nav_comercial_vendas',
  '/portal-interno-hks-2026/meta-ads': 'nav_marketing',
  '/portal-interno-hks-2026/social-flow': 'nav_social_flow',
  '/portal-interno-hks-2026/ai-performance': 'nav_ia_performance',
  '/portal-interno-hks-2026/automacao': 'nav_ia_automacoes',
  '/portal-interno-hks-2026/financeiro': 'nav_financeiro',
  '/portal-interno-hks-2026/producao': 'nav_fin_producao',
  '/portal-interno-hks-2026/faturamento': 'nav_fin_faturamento',
  '/portal-interno-hks-2026/corretores': 'nav_ops_corretores',
  '/portal-interno-hks-2026/usuarios': 'nav_config_usuarios',
  '/portal-interno-hks-2026/configuracoes': 'nav_configuracoes',
  '/portal-interno-hks-2026/clientes': 'nav_ops_clientes',
  '/portal-interno-hks-2026/clientes-portal': 'nav_ops_clientes_portal',
  '/portal-interno-hks-2026/documentos': 'nav_ops_documentos',
  '/portal-interno-hks-2026/tarefas': 'nav_ops_tarefas',
  '/portal-interno-hks-2026/indicacoes': 'nav_ops_indicacoes',
  '/portal-interno-hks-2026/treinamento': 'nav_ops_treinamento',
  '/portal-interno-hks-2026/whatsapp': 'nav_com_whatsapp',
  '/portal-interno-hks-2026/chat': 'nav_com_chat',
  '/portal-interno-hks-2026/email': 'nav_com_email',
  '/portal-interno-hks-2026/notificacoes': 'nav_com_notificacoes',
  '/portal-interno-hks-2026/analytics': 'mkt_view_analytics',
  '/portal-interno-hks-2026/metricas': 'mkt_view_analytics',
  '/portal-interno-hks-2026/cockpit': 'mkt_view_analytics',
  '/portal-interno-hks-2026/performance': 'mkt_view_analytics',
  '/portal-interno-hks-2026/relatorios': 'mkt_view_analytics',
  '/portal-interno-hks-2026/insights': 'nav_ia_insights',
  '/portal-interno-hks-2026/scanner': 'nav_ia_scanner',
  '/portal-interno-hks-2026/regras-ia': 'nav_ia_regras',
};

// Resolve permissão necessária pela rota (prefix match)
function getPermissionForRoute(pathname: string): string | null {
  if (ROUTE_PERMISSION_MAP[pathname]) return ROUTE_PERMISSION_MAP[pathname];
  const sorted = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route)) return ROUTE_PERMISSION_MAP[route];
  }
  return null;
}

// Rotas isentas de checagem de permissão granular
const PERMISSION_EXEMPT_ROUTES = [
  '/portal-interno-hks-2026/login',
  '/portal-interno-hks-2026/acesso-negado',
  '/portal-interno-hks-2026', // dashboard home
];

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

      // ─── RBAC: Checagem de permissão granular ──────────────
      const isExempt = PERMISSION_EXEMPT_ROUTES.some(
        (r) => pathname === r || (r === '/portal-interno-hks-2026' && pathname === '/portal-interno-hks-2026/')
      );

      if (!isExempt) {
        const requiredPermission = getPermissionForRoute(pathname);

        if (requiredPermission) {
          // Extrair email do JWT para buscar permissões
          const jwt = await verifyJwt(token);
          const email = jwt?.email;

          if (email) {
            // Admin com role 'admin' no JWT bypass permissões granulares
            if (jwt?.role !== 'admin') {
              try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                if (supabaseUrl && supabaseKey) {
                  const res = await fetch(
                    `${supabaseUrl}/rest/v1/corretores?email=eq.${encodeURIComponent(email)}&select=permissions,role&limit=1`,
                    {
                      headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                      },
                    }
                  );

                  if (res.ok) {
                    const data = await res.json();
                    if (data?.[0]) {
                      const permissions = data[0].permissions as Record<string, boolean> | null;

                      // Se tem permissions definidas e a permissão é false → bloquear
                      if (permissions && permissions[requiredPermission] === false) {
                        const deniedUrl = new URL('/portal-interno-hks-2026/acesso-negado', request.url);
                        deniedUrl.searchParams.set('from', pathname);
                        return NextResponse.redirect(deniedUrl);
                      }
                    }
                  }
                }
              } catch {
                // Falha na checagem de permissão → permitir (fail-open para não bloquear)
              }
            }
          }
        }
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
