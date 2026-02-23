import { NextRequest, NextResponse } from 'next/server';
import { validarCNPJ } from '@/lib/validations';

const BRASIL_API_CNPJ = 'https://brasilapi.com.br/api/cnpj/v1';
const FETCH_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/** GET /api/cnpj/consulta?cnpj=12345678000199 — Consulta CNPJ na Brasil API e retorna razão social e nome fantasia */
export async function GET(request: NextRequest) {
  try {
    const cnpj = request.nextUrl.searchParams.get('cnpj')?.replace(/\D/g, '') ?? '';
    if (cnpj.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ deve ter 14 dígitos' },
        { status: 400 }
      );
    }
    if (!validarCNPJ(cnpj)) {
      return NextResponse.json(
        { error: 'CNPJ inválido' },
        { status: 400 }
      );
    }

    let lastRes: Response | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetchWithTimeout(`${BRASIL_API_CNPJ}/${cnpj}`);
        lastRes = res;
        if (res.ok) break;
        if (res.status === 404) {
          return NextResponse.json(
            { error: 'CNPJ não encontrado' },
            { status: 404 }
          );
        }
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        console.warn('[api/cnpj/consulta] Brasil API não-OK', { cnpj, status: res.status });
        return NextResponse.json(
          {
            error: 'Serviço de consulta temporariamente indisponível. Preencha o nome da empresa manualmente.',
            service_unavailable: true,
          },
          { status: 502 }
        );
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        console.error('[api/cnpj/consulta]', err);
        return NextResponse.json(
          {
            error: 'Serviço de consulta temporariamente indisponível. Preencha o nome da empresa manualmente.',
            service_unavailable: true,
          },
          { status: 502 }
        );
      }
    }

    if (!lastRes?.ok) {
      return NextResponse.json(
        {
          error: 'Serviço de consulta temporariamente indisponível. Preencha o nome da empresa manualmente.',
          service_unavailable: true,
        },
        { status: 502 }
      );
    }

    const data = (await lastRes.json()) as {
      razao_social?: string;
      nome_fantasia?: string;
    };
    return NextResponse.json({
      razao_social: data.razao_social ?? null,
      nome_fantasia: data.nome_fantasia ?? null,
      empresa: data.razao_social || data.nome_fantasia || null,
    });
  } catch (e) {
    console.error('[api/cnpj/consulta]', e);
    return NextResponse.json(
      {
        error: 'Serviço de consulta temporariamente indisponível. Preencha o nome da empresa manualmente.',
        service_unavailable: true,
      },
      { status: 502 }
    );
  }
}
