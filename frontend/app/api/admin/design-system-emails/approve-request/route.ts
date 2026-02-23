import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { jwtVerify } from 'jose';
import { enviarEmailDesignSystemAcessoAprovado } from '@/lib/email';

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || '');

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET());
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const ok = await requireAdmin(request);
  if (!ok) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const requestId = body?.requestId ?? body?.request;
    if (!requestId) {
      return NextResponse.json({ error: 'requestId obrigatório' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: reqRow, error: fetchErr } = await supabase
      .from('design_system_access_requests')
      .select('id, email, status')
      .eq('id', requestId)
      .single();

    if (fetchErr || !reqRow || reqRow.status !== 'pending') {
      return NextResponse.json({ error: 'Solicitação não encontrada ou já processada' }, { status: 404 });
    }

    const email = (reqRow.email as string).trim().toLowerCase();

    const { error: insertErr } = await supabase.from('design_system_allowed_emails').insert({ email });
    if (insertErr && insertErr.code !== '23505') {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    await supabase
      .from('design_system_access_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
    const designSystemUrl = `${baseUrl}/design-system`;
    await enviarEmailDesignSystemAcessoAprovado({ email, designSystemUrl });

    return NextResponse.json({ ok: true, email });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
