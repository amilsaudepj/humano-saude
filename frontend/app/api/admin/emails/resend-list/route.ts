// ─── Listar histórico de emails enviados via API Resend ─────────
// GET: Busca na Resend, busca HTML de cada um, salva tudo em email_logs e retorna a lista

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { syncResendEmailsToDb, type ResendSyncItem } from '@/lib/email-tracking';

const CONCURRENCY = 3;

/** Resposta completa do GET /emails/:id (guardamos tudo) */
interface ResendEmailDetail {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  last_event: string | null;
  html?: string | null;
  text?: string | null;
  bcc?: string[] | null;
  cc?: string[] | null;
  reply_to?: string[] | null;
  scheduled_at?: string | null;
  tags?: Array<{ name: string; value: string }> | null;
  [key: string]: unknown;
}

async function fetchEmailDetail(apiKey: string, emailId: string): Promise<ResendEmailDetail | null> {
  const res = await fetch(`https://api.resend.com/emails/${encodeURIComponent(emailId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as ResendEmailDetail;
}

async function runInChunks<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

interface ResendEmailItem {
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  last_event: string | null;
  bcc?: string[] | null;
  cc?: string[] | null;
  reply_to?: string | null;
  scheduled_at?: string | null;
}

interface ResendListResponse {
  object: string;
  data: ResendEmailItem[];
  has_more?: boolean;
}

/** Formato exibível na tabela (compatível com EmailLog) */
export interface ResendEmailRow {
  id: string;
  resend_id: string;
  to_email: string;
  from_email: string;
  subject: string;
  status: string;
  created_at: string;
  template_name: null;
  opened_count: number;
  clicked_count: number;
  source: 'resend';
  email_type: string;
}

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY não configurada' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error('[emails/resend-list] Resend API error:', undefined, { status: res.status, body: text });
      return NextResponse.json(
        { success: false, error: `Resend API: ${res.status} ${text.slice(0, 200)}` },
        { status: res.status === 401 ? 401 : 502 }
      );
    }

    const json = (await res.json()) as ResendListResponse;
    const items = json.data || [];

    const details = await runInChunks(items, CONCURRENCY, async (e) => {
      const full = await fetchEmailDetail(apiKey, e.id);
      if (full) {
        return {
          id: full.id,
          to: full.to ?? e.to,
          from: full.from ?? e.from,
          subject: full.subject ?? e.subject,
          last_event: full.last_event ?? e.last_event,
          created_at: full.created_at ?? e.created_at,
          html_content: full.html ?? null,
          text_content: full.text ?? null,
          cc: full.cc ?? e.cc ?? null,
          bcc: full.bcc ?? e.bcc ?? null,
          reply_to: full.reply_to ?? e.reply_to ?? null,
          scheduled_at: full.scheduled_at ?? e.scheduled_at ?? null,
          tags: full.tags ?? null,
        };
      }
      return {
        id: e.id,
        to: e.to,
        from: e.from,
        subject: e.subject,
        last_event: e.last_event,
        created_at: e.created_at,
        html_content: null,
        text_content: null,
        cc: e.cc ?? null,
        bcc: e.bcc ?? null,
        reply_to: e.reply_to ?? null,
        scheduled_at: e.scheduled_at ?? null,
        tags: null,
      };
    });

    const normalized: ResendSyncItem[] = details.map((d) => ({
      ...d,
      to: Array.isArray(d.to) ? d.to : [d.to].filter(Boolean),
      cc: d.cc == null ? null : Array.isArray(d.cc) ? d.cc : [d.cc],
      bcc: d.bcc == null ? null : Array.isArray(d.bcc) ? d.bcc : [d.bcc],
      reply_to: d.reply_to == null ? null : Array.isArray(d.reply_to) ? d.reply_to : [d.reply_to],
    }));
    const { synced, errors } = await syncResendEmailsToDb(normalized);
    if (synced > 0 || errors > 0) {
      logger.info('[emails/resend-list] Sync Resend → email_logs (com HTML)', { synced, errors });
    }

    const rows: ResendEmailRow[] = items.map((e: ResendEmailItem) => ({
      id: e.id,
      resend_id: e.id,
      to_email: Array.isArray(e.to) ? e.to[0] ?? '' : String(e.to),
      from_email: e.from ?? '',
      subject: e.subject ?? '',
      status: e.last_event ?? 'sent',
      created_at: e.created_at ?? new Date().toISOString(),
      template_name: null,
      opened_count: 0,
      clicked_count: 0,
      source: 'resend',
      email_type: 'transactional',
    }));

    return NextResponse.json({
      success: true,
      data: {
        emails: rows,
        total: rows.length,
        source: 'resend',
      },
    });
  } catch (err) {
    logger.error('[emails/resend-list] Error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar histórico Resend' },
      { status: 500 }
    );
  }
}
