import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const PYTHON_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * GET /api/health
 * Health check consolidado de todos os serviços
 */
export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // 1. Supabase
  const supaStart = Date.now();
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('insurance_leads').select('id').limit(1);
    checks.supabase = {
      status: error ? 'degraded' : 'healthy',
      latency: Date.now() - supaStart,
      ...(error ? { error: error.message } : {}),
    };
  } catch (err) {
    checks.supabase = {
      status: 'down',
      latency: Date.now() - supaStart,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // 2. Python Backend
  const pyStart = Date.now();
  try {
    const resp = await fetch(`${PYTHON_API}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await resp.json();
    checks.python_backend = {
      status: data.status === 'healthy' ? 'healthy' : 'degraded',
      latency: Date.now() - pyStart,
    };
  } catch (err) {
    checks.python_backend = {
      status: 'down',
      latency: Date.now() - pyStart,
      error: err instanceof Error ? err.message : 'Unreachable',
    };
  }

  // 3. Resend (Email) — não fazemos chamada à API aqui para não consumir rate limit (2 req/s no Free).
  // Use GET /api/email-check quando precisar validar Resend. O envio de emails segue normal nas rotas (leads, etc.).
  checks.resend = process.env.RESEND_API_KEY ? { status: 'configured' } : { status: 'unconfigured' };

  // 4. Meta Ads API
  const metaToken = process.env.META_ACCESS_TOKEN;
  if (metaToken) {
    const metaStart = Date.now();
    try {
      const resp = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${metaToken}`,
        { signal: AbortSignal.timeout(5000) },
      );
      checks.meta_ads = {
        status: resp.ok ? 'healthy' : 'degraded',
        latency: Date.now() - metaStart,
        ...(!resp.ok ? { error: `HTTP ${resp.status}` } : {}),
      };
    } catch (err) {
      checks.meta_ads = {
        status: 'down',
        latency: Date.now() - metaStart,
        error: err instanceof Error ? err.message : 'Unreachable',
      };
    }
  } else {
    checks.meta_ads = { status: 'unconfigured' };
  }

  // 5. Next.js (always healthy if we got here)
  checks.nextjs = { status: 'healthy', latency: 0 };

  // Overall status: só serviços com status real (healthy/degraded/down) entram; configured/unconfigured não afetam
  const configuredChecks = Object.values(checks).filter(
    (c) => ['healthy', 'degraded', 'down'].includes(c.status),
  );
  const allHealthy = configuredChecks.every((c) => c.status === 'healthy');
  const anyDown = configuredChecks.some((c) => c.status === 'down');

  const overall = configuredChecks.length === 0 ? 'healthy' : allHealthy ? 'healthy' : anyDown ? 'degraded' : 'partial';

  return NextResponse.json({
    status: overall,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    timestamp: new Date().toISOString(),
    services: checks,
  });
}
