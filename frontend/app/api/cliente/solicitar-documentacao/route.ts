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

    const sb = createServiceClient();

    const { data: account, error: accountError } = await sb
      .from('portal_client_accounts')
      .select('id, lead_id, dados_resumo')
      .eq('id', payload.cliente_id)
      .maybeSingle();

    if (accountError || !account) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada.' }, { status: 404 });
    }

    const dadosResumo =
      account.dados_resumo && typeof account.dados_resumo === 'object' && !Array.isArray(account.dados_resumo)
        ? (account.dados_resumo as Record<string, unknown>)
        : {};

    const solicitadoEm = new Date().toISOString();

    const { error: updateAccountError } = await sb
      .from('portal_client_accounts')
      .update({
        solicitou_documentacao_completa: true,
        solicitou_documentacao_em: solicitadoEm,
        dados_resumo: {
          ...dadosResumo,
          solicitacao_documentacao_completa_em: solicitadoEm,
        },
      })
      .eq('id', payload.cliente_id);

    if (updateAccountError) {
      return NextResponse.json({ success: false, error: 'Erro ao registrar solicitação.' }, { status: 500 });
    }

    if (account.lead_id) {
      await sb
        .from('insurance_leads')
        .update({
          status: 'em_analise',
          updated_at: solicitadoEm,
        })
        .eq('id', account.lead_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação recebida. Nosso time fará a validação completa e entrará em contato.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro ao registrar solicitação.' }, { status: 500 });
  }
}
