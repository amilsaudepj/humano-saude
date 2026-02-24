// ─── Blueprint 14: Admin Email API ───────────────────────────
// GET: List emails with filters, pagination, sorting
// POST: Get email detail by ID (body: { emailId })

import { NextRequest, NextResponse } from 'next/server';
import { listEmails, getEmailDetail, getEmailStats } from '@/lib/email-tracking';
import type { ListEmailsParams, EmailStatus, EmailType } from '@/lib/types/email';
import { logger } from '@/lib/logger';

// ─── GET: List emails ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const action = url.searchParams.get('action');

    // Special action: get stats
    if (action === 'stats') {
      const stats = await getEmailStats();
      return NextResponse.json({ success: true, data: stats });
    }

    const params: ListEmailsParams = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      status: (url.searchParams.get('status') as EmailStatus) || undefined,
      emailType: (url.searchParams.get('emailType') as EmailType) || undefined,
      category: url.searchParams.get('category') || undefined,
      templateName: url.searchParams.get('templateName') || undefined,
      search: url.searchParams.get('search') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      sortBy: (url.searchParams.get('sortBy') as ListEmailsParams['sortBy']) || 'created_at',
      sortOrder: (url.searchParams.get('sortOrder') as ListEmailsParams['sortOrder']) || 'desc',
    };

    const result = await listEmails(params);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar emails';
    logger.error('[api/admin/emails] GET error:', err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── POST: Get email detail ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json();

    if (!emailId) {
      return NextResponse.json(
        { success: false, error: 'emailId é obrigatório' },
        { status: 400 }
      );
    }

    const email = await getEmailDetail(emailId);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: email });
  } catch (err) {
    logger.error('[api/admin/emails] POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar detalhes do email' },
      { status: 500 }
    );
  }
}
