import { NextRequest, NextResponse } from 'next/server';
import { verifyLinksAccessToken } from '@/lib/auth-jwt';
import { isEmailAllowedForLinks } from '@/app/actions/links-access';

/**
 * GET /api/links/verify?token=xxx
 * Ou Cookie: links_access=xxx
 * Verifica o token e se o e-mail está na lista de permitidos. Retorna { ok: true, email } ou { ok: false }.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || request.cookies.get('links_access')?.value;

  if (!token) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const payload = await verifyLinksAccessToken(token);
  if (!payload?.email) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const allowed = await isEmailAllowedForLinks(payload.email);
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true, email: payload.email }, { status: 200 });
}
