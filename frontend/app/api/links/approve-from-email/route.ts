import { NextRequest, NextResponse } from 'next/server';
import { getLinksAccessRequests, approveLinksAccessRequest } from '@/app/actions/links-access';
import { enviarEmailLinksAcessoAprovado } from '@/lib/email';
import { verifyLinksApproveToken } from '@/lib/links-approve-token';
import { LINKS_RESTRICTED_PATH } from '@/lib/links-restricted-path';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
  const adminLinksUrl = `${baseUrl}/portal-interno-hks-2026/links-acesso`;

  if (!email || !token) {
    return NextResponse.redirect(`${adminLinksUrl}?erro=link-invalido`);
  }

  const decoded = verifyLinksApproveToken(token);
  if (!decoded || decoded.email !== email.trim().toLowerCase()) {
    return NextResponse.redirect(`${adminLinksUrl}?erro=link-expirado`);
  }

  const requestsRes = await getLinksAccessRequests();
  if (!requestsRes.success || !requestsRes.data) {
    return NextResponse.redirect(`${adminLinksUrl}?erro=erro`);
  }
  const hasRequest = requestsRes.data.some(
    (r) => r.email.toLowerCase() === decoded.email
  );
  if (!hasRequest) {
    return NextResponse.redirect(`${adminLinksUrl}?erro=ja-processado`);
  }

  const approveRes = await approveLinksAccessRequest(decoded.email);
  if (!approveRes.success) {
    return NextResponse.redirect(`${adminLinksUrl}?erro=erro`);
  }

  const linksUrl = `${baseUrl}${LINKS_RESTRICTED_PATH}`;
  await enviarEmailLinksAcessoAprovado({ email: decoded.email, linksUrl });

  return NextResponse.redirect(`${adminLinksUrl}?aprovado=1`);
}
