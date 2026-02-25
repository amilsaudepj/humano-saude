import { NextRequest, NextResponse } from 'next/server';
import { addLinksAccessRequest } from '@/app/actions/links-access';
import { enviarEmailLinksSolicitacaoAdmin, enviarEmailLinksSolicitacaoRecebida } from '@/lib/email';
import { signLinksApproveToken } from '@/lib/links-approve-token';

/**
 * POST /api/links/request-access
 * Body: { email: string, mensagem?: string }
 * Registra uma solicitação de acesso à página /links, envia e-mail ao admin (com link para aprovar) e confirmação ao solicitante.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; mensagem?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ success: false, error: 'E-mail é obrigatório' }, { status: 400 });
  }

  const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim() : undefined;
  const res = await addLinksAccessRequest(email, mensagem);

  if (!res.success) {
    return NextResponse.json({ success: false, error: res.error }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
  const normalizedEmail = email.toLowerCase().trim();
  const token = signLinksApproveToken(normalizedEmail);
  const approveLink = `${baseUrl}/api/links/approve-from-email?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(token)}`;

  await enviarEmailLinksSolicitacaoAdmin({
    emailSolicitante: normalizedEmail,
    mensagem: mensagem || undefined,
    approveLink,
  });
  await enviarEmailLinksSolicitacaoRecebida({ email: normalizedEmail });

  return NextResponse.json({
    success: true,
    message: 'Solicitação enviada. Você receberá um e-mail de confirmação e outro quando for aprovado.',
  }, { status: 200 });
}
