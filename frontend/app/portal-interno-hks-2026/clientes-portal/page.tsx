import { createServiceClient } from '@/lib/supabase';
import { Mail, Phone, Users, FileCheck2, UserPlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
}

export default async function ClientesPortalPage() {
  const sb = createServiceClient();

  const [
    { data: portalData, error },
    { data: leadsData, error: leadsError },
  ] = await Promise.all([
    sb
      .from('portal_client_accounts')
      .select('id, nome, email, telefone, status, lead_id, solicitou_documentacao_completa, solicitou_documentacao_em, ultimo_login_em, created_at, updated_at, dados_resumo')
      .order('created_at', { ascending: false })
      .limit(200),
    sb
      .from('insurance_leads')
      .select('id, nome, email, whatsapp, created_at, valor_atual, economia_estimada, dados_pdf')
      .eq('origem', 'calculadora_economia')
      .order('created_at', { ascending: false })
      .limit(300),
  ]);

  const clientes = portalData || [];
  const portalEmails = new Set(clientes.map((c) => (c.email || '').toLowerCase()).filter(Boolean));
  const leadsSemConta = (leadsData || []).filter((l) => {
    const e = (l.email || '').toLowerCase();
    return e && !portalEmails.has(e);
  });

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto text-white">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Clientes do Portal (Economizar)</h1>
        <p className="mt-1 text-sm text-white/60">
          Usuários criados automaticamente a partir da página /economizar.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Total com conta no portal</p>
            <p className="mt-1 text-2xl font-bold">{clientes.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Solicitaram análise 100%</p>
            <p className="mt-1 text-2xl font-bold">
              {clientes.filter((item) => item.solicitou_documentacao_completa).length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Com login recente</p>
            <p className="mt-1 text-2xl font-bold">
              {clientes.filter((item) => Boolean(item.ultimo_login_em)).length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/50">Cadastros /economizar sem conta</p>
            <p className="mt-1 text-2xl font-bold">{leadsSemConta.length}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.04] text-white/70">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Contato</th>
              <th className="px-4 py-3 text-left font-semibold">Resumo</th>
              <th className="px-4 py-3 text-left font-semibold">Solicitação 100%</th>
              <th className="px-4 py-3 text-left font-semibold">Último login</th>
              <th className="px-4 py-3 text-left font-semibold">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={6} className="px-4 py-5 text-red-300">
                  Erro ao carregar clientes do portal: {error.message}
                </td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-5 text-white/60">
                  Nenhum cliente de portal cadastrado até o momento.
                </td>
              </tr>
            ) : (
              clientes.map((item) => {
                const resumo = item.dados_resumo as {
                  tipo_pessoa?: string;
                  operadora_atual?: string;
                  valor_atual?: number;
                  qtd_vidas?: number;
                };

                return (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-white">{item.nome}</p>
                      <p className="text-xs text-white/50">Status: {item.status}</p>
                      <p className="text-xs text-white/40">Lead: {item.lead_id || '—'}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="inline-flex items-center gap-1 text-white/80"><Mail className="h-3.5 w-3.5" /> {item.email}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-white/70"><Phone className="h-3.5 w-3.5" /> {item.telefone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="inline-flex items-center gap-1 text-white/80"><Users className="h-3.5 w-3.5" /> Tipo: {resumo?.tipo_pessoa || '—'}</p>
                      <p className="mt-1 text-white/70">Operadora: {resumo?.operadora_atual || '—'}</p>
                      <p className="mt-1 text-white/70">Valor: {typeof resumo?.valor_atual === 'number' ? resumo.valor_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</p>
                      <p className="mt-1 text-white/70">Vidas: {resumo?.qtd_vidas || '—'}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="inline-flex items-center gap-1 text-white/80">
                        <FileCheck2 className="h-3.5 w-3.5" />
                        {item.solicitou_documentacao_completa ? 'Sim' : 'Não'}
                      </p>
                      <p className="mt-1 text-xs text-white/50">{formatDate(item.solicitou_documentacao_em)}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-white/70">{formatDate(item.ultimo_login_em)}</td>
                    <td className="px-4 py-3 align-top text-white/70">{formatDate(item.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {leadsSemConta.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Quem já se cadastrou no /economizar (ainda sem conta no portal)
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Leads da calculadora que ainda não têm acesso ao portal. Eles já aparecem aqui para você enxergar quem “já fez”.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.04] text-white/70">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">Contato</th>
                  <th className="px-4 py-3 text-left font-semibold">Resumo</th>
                  <th className="px-4 py-3 text-left font-semibold">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {leadsSemConta.map((lead) => {
                  const dados = lead.dados_pdf as { dados_digitados?: { valor_atual?: number; operadora?: string; tipo_pessoa?: string }; resultado_simulacao?: { qtdVidas?: number } } | null;
                  const digitados = dados?.dados_digitados;
                  return (
                    <tr key={lead.id} className="border-t border-white/10">
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-white">{lead.nome}</p>
                        <p className="text-xs text-amber-400/90">Sem conta no portal</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="inline-flex items-center gap-1 text-white/80"><Mail className="h-3.5 w-3.5" /> {lead.email || '—'}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-white/70"><Phone className="h-3.5 w-3.5" /> {lead.whatsapp ? `+55 ${lead.whatsapp}` : '—'}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-white/80">Operadora: {digitados?.operadora || '—'}</p>
                        <p className="mt-1 text-white/70">Valor: {typeof lead.valor_atual === 'number' ? lead.valor_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (typeof digitados?.valor_atual === 'number' ? digitados.valor_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—')}</p>
                        <p className="mt-1 text-white/70">Economia est.: {typeof lead.economia_estimada === 'number' ? lead.economia_estimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</p>
                        <p className="mt-1 text-white/70">Tipo: {digitados?.tipo_pessoa || (dados?.resultado_simulacao?.qtdVidas != null ? `${dados.resultado_simulacao.qtdVidas} vida(s)` : '—')}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-white/70">{formatDate(lead.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!leadsError && leadsSemConta.length === 0 && clientes.length > 0 && (
        <p className="text-sm text-white/50">Todos os cadastros da calculadora /economizar que existem no sistema já possuem conta no portal.</p>
      )}

      {leadsError && (
        <p className="text-sm text-amber-400/90">Não foi possível carregar a lista de leads da calculadora (tabela insurance_leads). Verifique se a tabela e a coluna origem existem.</p>
      )}
    </div>
  );
}
