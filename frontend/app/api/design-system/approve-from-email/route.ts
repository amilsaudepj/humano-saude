import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';
import { enviarEmailDesignSystemAcessoAprovado } from '@/lib/email';

const SECRET = process.env.DESIGN_SYSTEM_SECRET || process.env.JWT_SECRET || 'design-system-fallback';

function verifyApproveToken(token: string): { requestId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (expectedSig !== sig) return null;
  let data: { requestId: string; exp: number };
  try {
    data = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!data.requestId || typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return { requestId: data.requestId };
}

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('request');
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';

  if (!requestId || !token) {
    return NextResponse.redirect(`${baseUrl}/design-system?erro=link-invalido`);
  }

  const decoded = verifyApproveToken(token);
  if (!decoded || decoded.requestId !== requestId) {
    return NextResponse.redirect(`${baseUrl}/design-system?erro=link-expirado`);
  }

  const supabase = createServiceClient();

  const { data: reqRow, error: fetchErr } = await supabase
    .from('design_system_access_requests')
    .select('id, email, status')
    .eq('id', requestId)
    .single();

  if (fetchErr || !reqRow || reqRow.status !== 'pending') {
    return NextResponse.redirect(`${baseUrl}/design-system?erro=ja-processado`);
  }

  const email = (reqRow.email as string).trim().toLowerCase();

  const { error: insertErr } = await supabase.from('design_system_allowed_emails').insert({ email });
  if (insertErr && insertErr.code !== '23505') {
    return NextResponse.redirect(`${baseUrl}/design-system?erro=erro`);
  }
  await supabase
    .from('design_system_access_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  const designSystemUrl = `${baseUrl}/design-system`;
  await enviarEmailDesignSystemAcessoAprovado({ email, designSystemUrl });

  return NextResponse.redirect(`${baseUrl}/design-system?aprovado=1`);
}
