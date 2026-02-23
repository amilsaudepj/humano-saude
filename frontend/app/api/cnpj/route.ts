import { NextRequest, NextResponse } from 'next/server';
import { validarCNPJ } from '@/lib/validations';

const BRASIL_API = 'https://brasilapi.com.br/api/cnpj/v1';
const TIMEOUT_MS = 8_000;
const USER_AGENT = 'HumanoSaude/1.0 (https://humanosaude.com.br)';

/**
 * GET /api/cnpj?cnpj=14digitos
 * Proxy Brasil API. Timeout 8s, User-Agent, JSON sempre.
 * Ex: ?cnpj=27619602000140 → Magazine Luiza
 */
export async function GET(request: NextRequest) {
  const cnpj = request.nextUrl.searchParams.get('cnpj')?.replace(/\D/g, '') ?? '';

  if (!cnpj || cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }
  if (!validarCNPJ(cnpj)) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BRASIL_API}/${cnpj}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);

    const data = (await response.json()) as { razao_social?: string; nome_fantasia?: string };

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'CNPJ não encontrado' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Brasil API indisponível', razao_social: null, nome_fantasia: null, empresa: null },
        { status: 502 }
      );
    }

    return NextResponse.json({
      razao_social: data.razao_social ?? null,
      nome_fantasia: data.nome_fantasia ?? null,
      empresa: data.razao_social || data.nome_fantasia || null,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout ao consultar CNPJ', razao_social: null, nome_fantasia: null, empresa: null },
        { status: 504 }
      );
    }
    console.error('[api/cnpj]', err);
    return NextResponse.json(
      { error: 'Erro ao consultar CNPJ', razao_social: null, nome_fantasia: null, empresa: null },
      { status: 500 }
    );
  }
}
