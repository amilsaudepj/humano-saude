import { NextRequest, NextResponse } from 'next/server';
import { verifyConfirmEmailToken } from '@/lib/auth-jwt';
import { marcarEmailCorretorConfirmado } from '@/app/actions/corretor-ops';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
const DASHBOARD_PATH = '/dashboard/corretor';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      `${BASE_URL}${DASHBOARD_PATH}/login?erro=link_invalido`
    );
  }

  const payload = await verifyConfirmEmailToken(token);

  if (!payload?.corretor_id) {
    return NextResponse.redirect(
      `${BASE_URL}${DASHBOARD_PATH}/login?erro=link_expirado`
    );
  }

  const result = await marcarEmailCorretorConfirmado(payload.corretor_id);

  if (!result.success) {
    return NextResponse.redirect(
      `${BASE_URL}${DASHBOARD_PATH}/login?erro=erro_confirmar`
    );
  }

  return NextResponse.redirect(
    `${BASE_URL}${DASHBOARD_PATH}?email_confirmado=1`
  );
}
