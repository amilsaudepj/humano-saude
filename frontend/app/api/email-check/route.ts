import { NextResponse } from 'next/server';

/**
 * GET /api/email-check
 * Diagnóstico rápido de email (Resend) para conferir na Vercel.
 * Abra em produção: https://SEU-DOMINIO.vercel.app/api/email-check
 */
export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Humano Saúde <noreply@humanosaude.com.br>';
  const adminEmails = process.env.RESEND_ADMIN_EMAILS || 'comercial@humanosaude.com.br';

  if (!resendKey) {
    return NextResponse.json(
      {
        ok: false,
        resend: 'não configurado',
        message: 'RESEND_API_KEY não está definida na Vercel. Emails de lead (comercial e cliente) não serão enviados.',
        vercel: 'Vercel → Projeto → Settings → Environment Variables → adicione RESEND_API_KEY para Production (e Preview se usar). Depois faça Redeploy.',
      },
      { status: 200 },
    );
  }

  const start = Date.now();
  try {
    const resp = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${resendKey}` },
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        {
          ok: false,
          resend: 'erro',
          status: resp.status,
          latency,
          message: `Resend retornou HTTP ${resp.status}. A key pode estar inválida, expirada ou o domínio precisa ser verificado no Resend.`,
          detail: text.slice(0, 300),
          vercel: 'Confirme que RESEND_API_KEY está correta em Vercel → Settings → Environment Variables.',
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      resend: 'ok',
      latency,
      message: 'Resend configurado. Emails de lead devem ser enviados (comercial + cliente).',
      config: {
        from: fromEmail,
        adminDestinos: adminEmails.split(',').map((e) => e.trim()).filter(Boolean),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        resend: 'erro',
        latency: Date.now() - start,
        message: 'Falha ao conectar na API Resend (rede/timeout).',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 },
    );
  }
}
