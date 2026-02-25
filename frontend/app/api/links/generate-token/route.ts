import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/api-auth';
import { isEmailAllowedForLinks } from '@/app/actions/links-access';
import { signLinksAccessToken } from '@/lib/auth-jwt';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';

/**
 * POST /api/links/generate-token
 * Body: { email: string }
 * Apenas admin. O e-mail deve estar na lista de permitidos. Retorna { url, token }.
 */
export async function POST(request: NextRequest) {
  const authorized = await isAdminAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
  }

  const allowed = await isEmailAllowedForLinks(email);
  if (!allowed) {
    return NextResponse.json({ error: 'E-mail não está na lista de permitidos. Adicione-o no painel primeiro.' }, { status: 403 });
  }

  try {
    const token = await signLinksAccessToken(email);
    const url = `${BASE_URL}/links?token=${encodeURIComponent(token)}`;
    return NextResponse.json({ url, token }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 });
  }
}
