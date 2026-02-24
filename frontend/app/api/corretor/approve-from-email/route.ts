import { NextRequest, NextResponse } from 'next/server';
import { verifyCorretorApproveToken } from '@/lib/corretor-approve-token';
import { aprovarSolicitacao } from '@/app/actions/solicitacoes-corretor';

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('request');
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
  const portalCorretores = `${baseUrl}/portal-interno-hks-2026/corretores/solicitacoes`;

  if (!requestId || !token) {
    return NextResponse.redirect(`${portalCorretores}?erro=link-invalido`);
  }

  const decoded = verifyCorretorApproveToken(token);
  if (!decoded || decoded.solicitacaoId !== requestId) {
    return NextResponse.redirect(`${portalCorretores}?erro=link-expirado`);
  }

  const result = await aprovarSolicitacao(requestId, undefined);

  if (!result.success) {
    const erro = result.error === 'Solicitação já foi processada'
      ? 'ja-processado'
      : 'erro';
    return NextResponse.redirect(`${portalCorretores}?erro=${erro}`);
  }

  return NextResponse.redirect(`${portalCorretores}?aprovado=1`);
}
