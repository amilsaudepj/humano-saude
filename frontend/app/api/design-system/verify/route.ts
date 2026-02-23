import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

const SECRET = process.env.DESIGN_SYSTEM_SECRET || process.env.JWT_SECRET || 'design-system-fallback';

function verifyToken(token: string): { email: string } | null {
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
  let data: { email: string; exp: number };
  try {
    data = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!data.email || typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return { email: data.email };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('ds_token')?.value;
    if (!token) {
      return NextResponse.json({ ok: false });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ ok: false });
    }

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('design_system_allowed_emails')
      .select('id')
      .ilike('email', decoded.email)
      .limit(1)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
