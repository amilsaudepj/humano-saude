import { NextRequest, NextResponse } from 'next/server';
import { isEmailAllowedForLinks } from '@/app/actions/links-access';
import { signLinksAccessToken } from '@/lib/auth-jwt';

/**
 * POST /api/links/access-with-email
 * Body: { email: string }
 * Se o e-mail estiver na lista de permitidos, retorna um token para acesso à página /links.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) {
    return NextResponse.json({ ok: false, error: 'E-mail é obrigatório' }, { status: 400 });
  }

  const allowed = await isEmailAllowedForLinks(email);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'E-mail não autorizado a acessar esta página.' }, { status: 200 });
  }

  try {
    const token = await signLinksAccessToken(email);
    return NextResponse.json({ ok: true, token }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao gerar acesso' }, { status: 500 });
  }
}
