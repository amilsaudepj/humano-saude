import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cliente_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'cliente' || !payload.cliente_id) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const mensagem = String(body?.mensagem || '').trim();

    if (!mensagem || mensagem.length < 5) {
      return NextResponse.json({ success: false, error: 'Mensagem muito curta.' }, { status: 400 });
    }

    const sb = createServiceClient();

    const { data: account, error: accountError } = await sb
      .from('portal_client_accounts')
      .select('id, dados_resumo')
      .eq('id', payload.cliente_id)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json({ success: false, error: 'Conta do cliente não encontrada.' }, { status: 404 });
    }

    const dadosResumo =
      account.dados_resumo && typeof account.dados_resumo === 'object' && !Array.isArray(account.dados_resumo)
        ? (account.dados_resumo as Record<string, unknown>)
        : {};

    const historicoAtual = Array.isArray(dadosResumo.chat_historico)
      ? (dadosResumo.chat_historico as Array<Record<string, unknown>>)
      : [];

    const novoHistorico = [
      ...historicoAtual,
      {
        autor: 'cliente',
        mensagem,
        timestamp: new Date().toISOString(),
      },
    ];

    const { error: updateError } = await sb
      .from('portal_client_accounts')
      .update({
        dados_resumo: {
          ...dadosResumo,
          chat_historico: novoHistorico,
          chat_ultimo_envio_em: new Date().toISOString(),
        },
      })
      .eq('id', payload.cliente_id);

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Não foi possível enviar sua mensagem.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Mensagem enviada para o time comercial.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro ao enviar mensagem.' }, { status: 500 });
  }
}
