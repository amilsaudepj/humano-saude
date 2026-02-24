// ─── Buscar detalhe de um email na Resend (inclui HTML para preview) ───
// GET: ?emailId=xxx — retorna { html, text, subject, to, from, ... }

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface ResendEmailDetail {
  object: string;
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  html: string | null;
  text: string | null;
  last_event: string | null;
  bcc?: string[] | null;
  cc?: string[] | null;
  reply_to?: string[] | null;
}

export async function GET(request: NextRequest) {
  try {
    const emailId = request.nextUrl.searchParams.get('emailId');
    if (!emailId) {
      return NextResponse.json(
        { success: false, error: 'emailId é obrigatório' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const res = await fetch(`https://api.resend.com/emails/${encodeURIComponent(emailId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('[emails/resend-detail] Resend API error:', undefined, { status: res.status, body: text });
      return NextResponse.json(
        { success: false, error: res.status === 404 ? 'Email não encontrado na Resend' : `Resend: ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      );
    }

    const data = (await res.json()) as ResendEmailDetail;
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        to: data.to,
        from: data.from,
        subject: data.subject,
        created_at: data.created_at,
        last_event: data.last_event,
        html: data.html ?? null,
        text: data.text ?? null,
      },
    });
  } catch (err) {
    logger.error('[emails/resend-detail] Error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar email na Resend' },
      { status: 500 }
    );
  }
}
