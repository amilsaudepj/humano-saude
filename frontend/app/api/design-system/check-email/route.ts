import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

const SECRET = process.env.DESIGN_SYSTEM_SECRET || process.env.JWT_SECRET || 'design-system-fallback';
const TOKEN_MAX_AGE_SEC = 86400; // 24h

function sign(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SEC;
  const payload = JSON.stringify({ email: email.toLowerCase().trim(), exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return NextResponse.json({ allowed: false, error: 'E-mail obrigatório' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('design_system_allowed_emails')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ allowed: false });
    }

    const token = sign(email);
    return NextResponse.json({ allowed: true, token });
  } catch {
    return NextResponse.json({ allowed: false }, { status: 500 });
  }
}
