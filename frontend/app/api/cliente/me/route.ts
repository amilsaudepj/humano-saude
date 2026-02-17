import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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

    const { data: account, error } = await sb
      .from('portal_client_accounts')
      .select('id, nome, email, telefone, status, lead_id, dados_resumo, solicitou_documentacao_completa, solicitou_documentacao_em, created_at, updated_at')
      .eq('id', payload.cliente_id)
      .maybeSingle();

    if (error || !account) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada' }, { status: 404 });
    }

    let lead: Record<string, unknown> | null = null;
    if (account.lead_id) {
      const { data: leadData } = await sb
        .from('insurance_leads')
        .select('id, nome, email, whatsapp, status, origem, operadora_atual, valor_atual, economia_estimada, valor_proposto, created_at')
        .eq('id', account.lead_id)
        .maybeSingle();
      lead = (leadData as Record<string, unknown>) || null;
    }

    return NextResponse.json({
      success: true,
      account,
      lead,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Erro ao carregar portal do cliente' }, { status: 500 });
  }
}
