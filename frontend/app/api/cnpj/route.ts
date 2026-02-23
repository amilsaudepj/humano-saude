import { NextRequest, NextResponse } from 'next/server';
import { validarCNPJ } from '@/lib/validations';

const BRASIL_API_CNPJ = 'https://brasilapi.com.br/api/cnpj/v1';

/**
 * GET /api/cnpj?cnpj=12345678000199
 * Proxy para Brasil API (evita CORS no browser). Server-side ignora restrições do browser.
 */
export async function GET(request: NextRequest) {
  const cnpj = request.nextUrl.searchParams.get('cnpj')?.replace(/\D/g, '') ?? '';
  if (!cnpj || cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }
  if (!validarCNPJ(cnpj)) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }

  try {
    const response = await fetch(`${BRASIL_API_CNPJ}/${cnpj}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    const data = (await response.json()) as { razao_social?: string; nome_fantasia?: string };
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'CNPJ não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ error: 'API indisponível' }, { status: 502 });
    }
    return NextResponse.json({
      razao_social: data.razao_social ?? null,
      nome_fantasia: data.nome_fantasia ?? null,
      empresa: data.razao_social || data.nome_fantasia || null,
    });
  } catch (error) {
    console.error('[api/cnpj]', error);
    return NextResponse.json({ error: 'API indisponível' }, { status: 500 });
  }
}
