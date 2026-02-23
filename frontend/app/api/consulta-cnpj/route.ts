import { NextRequest, NextResponse } from 'next/server';
import { validarCNPJ } from '@/lib/validations';

const BRASIL_API = 'https://brasilapi.com.br/api/cnpj/v1';
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

/**
 * GET /api/consulta-cnpj?cnpj=12345678000199
 * Proxy Brasil API. Retorna razao_social, nome_fantasia, municipio.
 * Evita 502: timeout + retry.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('cnpj');
  const cnpj = raw?.replace(/\D/g, '') ?? '';

  if (!cnpj || cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ deve ter 14 dígitos' }, { status: 400 });
  }

  if (!validarCNPJ(cnpj)) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`${BRASIL_API}/${cnpj}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        next: { revalidate: 86400 },
      });
      clearTimeout(timeout);

      const data = (await res.json()) as {
        razao_social?: string;
        nome_fantasia?: string;
        fantasia?: string;
        municipio?: string;
      };

      if (!res.ok) {
        if (res.status === 404) {
          return NextResponse.json(
            { error: 'CNPJ não encontrado', razao_social: null, nome_fantasia: null, municipio: null },
            { status: 404 }
          );
        }
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        return NextResponse.json(
          { error: 'Serviço indisponível. Tente novamente.', razao_social: null, nome_fantasia: null, municipio: null },
          { status: 502 }
        );
      }

      return NextResponse.json({
        razao_social: data.razao_social ?? null,
        nome_fantasia: data.nome_fantasia ?? data.fantasia ?? null,
        municipio: data.municipio ?? null,
      });
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.error('[api/consulta-cnpj]', lastError);
  return NextResponse.json(
    { error: 'Serviço indisponível. Tente novamente.', razao_social: null, nome_fantasia: null, municipio: null },
    { status: 500 }
  );
}
