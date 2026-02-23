import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';
import { enviarEmailDesignSystemSolicitacaoAdmin, enviarEmailDesignSystemSolicitacaoRecebida } from '@/lib/email';

const SECRET = process.env.DESIGN_SYSTEM_SECRET || process.env.JWT_SECRET || 'design-system-fallback';
const APPROVE_TOKEN_EXPIRY_SEC = 7 * 24 * 60 * 60;

function signApproveToken(requestId: string): string {
  const exp = Math.floor(Date.now() / 1000) + APPROVE_TOKEN_EXPIRY_SEC;
  const payload = JSON.stringify({ requestId, exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payloadB64 + '.' + sig;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return NextResponse.json({ ok: false, error: 'E-mail obrigatório' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from('design_system_allowed_emails')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, message: 'Você já tem acesso. Use o botão Acessar.' });
    }

    const { data: pending, error: errPending } = await supabase
      .from('design_system_access_requests')
      .select('id')
      .ilike('email', email)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (errPending) {
      const msg = String((errPending as { message?: string }).message || errPending).toLowerCase();
      const code = (errPending as { code?: string }).code;
      const isTableMissing =
        code === '42P01' ||
        msg.includes('does not exist') ||
        msg.includes('não existe') ||
        msg.includes('relation') && msg.includes('exist') ||
        msg.includes('design_system_access_requests') ||
        msg.includes('undefined_table');
      return NextResponse.json({
        ok: false,
        error: isTableMissing
          ? 'Sistema de solicitações ainda não configurado. Avise o administrador para aplicar a migration design_system_access_requests no banco (Supabase → SQL Editor).'
          : 'Erro ao verificar solicitações. Confira se a migration design_system_access_requests foi aplicada no Supabase e tente de novo.',
      }, { status: 503 });
    }
    if (pending) {
      return NextResponse.json({ ok: true, message: 'Solicitação já enviada. Aguarde a aprovação.' });
    }

    const { data: row, error } = await supabase
      .from('design_system_access_requests')
      .insert({ email, status: 'pending' })
      .select('id')
      .single();

    if (error || !row) {
      const msg = String((error as { message?: string })?.message || error || '').toLowerCase();
      const code = (error as { code?: string })?.code;
      const isTableMissing =
        code === '42P01' ||
        msg.includes('does not exist') ||
        msg.includes('não existe') ||
        (msg.includes('relation') && msg.includes('exist')) ||
        msg.includes('design_system_access_requests') ||
        msg.includes('undefined_table');
      return NextResponse.json({
        ok: false,
        error: isTableMissing
          ? 'Sistema de solicitações ainda não configurado. Avise o administrador para aplicar a migration design_system_access_requests no banco (Supabase → SQL Editor).'
          : 'Erro ao registrar solicitação. Confira se a migration design_system_access_requests foi aplicada no Supabase e tente de novo.',
      }, { status: 503 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
    const token = signApproveToken(row.id);
    const approveLink = baseUrl + '/api/design-system/approve-from-email?request=' + encodeURIComponent(row.id) + '&token=' + encodeURIComponent(token);

    await enviarEmailDesignSystemSolicitacaoAdmin({
      emailSolicitante: email,
      approveLink,
    });
    await enviarEmailDesignSystemSolicitacaoRecebida({ email });

    return NextResponse.json({ ok: true, message: 'Solicitação enviada. Você receberá um e-mail de confirmação e outro quando for aprovado.' });
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao enviar solicitação' }, { status: 500 });
  }
}
