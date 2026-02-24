'use client';

import { useState, useEffect, useMemo } from 'react';
import { UserPlus, Share2, Users, Ban, CheckCircle, KeyRound, PlusCircle } from 'lucide-react';
import { PageHeader, StatsCard, StatsGrid, PageLoading } from '../components';
import { getLeads } from '@/app/actions/leads';
import { getIndicacoesOverview } from '@/app/actions/indicacoes-admin';
import type { LeadIndicado } from '@/app/actions/indicacoes-admin';
import {
  listarAfiliadosAdmin,
  desativarAfiliadoAdmin,
  reativarAfiliadoAdmin,
  alterarSenhaAfiliadoAdmin,
} from '@/app/actions/corretor-afiliados';
import { createLeadWithCard } from '@/app/actions/corretor-crm';
import { getCorretores } from '@/app/actions/corretores';
import Link from 'next/link';
import { toast } from 'sonner';

const P = '/portal-interno-hks-2026';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-blue-500/20 text-blue-400' },
  contatado: { label: 'Contatado', color: 'bg-yellow-500/20 text-yellow-400' },
  negociacao: { label: 'Negociação', color: 'bg-purple-500/20 text-purple-400' },
  proposta_enviada: { label: 'Proposta', color: 'bg-orange-500/20 text-orange-400' },
  ganho: { label: 'Ganho', color: 'bg-green-500/20 text-green-400' },
  perdido: { label: 'Perdido', color: 'bg-red-500/20 text-red-400' },
};

type Tab = 'quero-ser-afiliado' | 'indicacoes-afiliados' | 'afiliados-cadastrados';

export default function AfiliadosPage() {
  const [tab, setTab] = useState<Tab>('quero-ser-afiliado');
  const [leadsAfiliado, setLeadsAfiliado] = useState<any[]>([]);
  const [leadsIndicacaoAdmin, setLeadsIndicacaoAdmin] = useState<any[]>([]);
  const [indicacoesData, setIndicacoesData] = useState<Awaited<ReturnType<typeof getIndicacoesOverview>>['data']>(null);
  const [afiliadosCadastrados, setAfiliadosCadastrados] = useState<(Awaited<ReturnType<typeof listarAfiliadosAdmin>>['data'])>(undefined);
  const [loading, setLoading] = useState(true);
  const [senhaModal, setSenhaModal] = useState<{ afiliadoId: string; nome: string } | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [crmModal, setCrmModal] = useState<{ lead: LeadIndicado & { corretor_nome?: string }; corretorId?: string } | null>(null);
  const [corretoresList, setCorretoresList] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [leadsRes, leadsIndicRes, indicRes, afilRes, corrRes] = await Promise.all([
      getLeads({ origem: 'landing_seja_afiliado', limit: 500 }),
      getLeads({ origem: 'landing_indicar_admin', limit: 500 }),
      getIndicacoesOverview(),
      listarAfiliadosAdmin(),
      getCorretores({ ativo: true }),
    ]);
    if (leadsRes.success) setLeadsAfiliado(leadsRes.data);
    if (leadsIndicRes.success) setLeadsIndicacaoAdmin(leadsIndicRes.data ?? []);
    if (indicRes.success && indicRes.data) setIndicacoesData(indicRes.data);
    if (afilRes.success) setAfiliadosCadastrados(afilRes.data ?? []);
    if (corrRes.success && corrRes.data) setCorretoresList(corrRes.data.map((c) => ({ id: c.id, nome: c.nome })));
    setLoading(false);
  }

  async function handleDesativar(afiliadoId: string) {
    const r = await desativarAfiliadoAdmin(afiliadoId);
    if (r.success) { toast.success('Afiliado desativado'); loadAll(); } else toast.error(r.error);
  }
  async function handleReativar(afiliadoId: string) {
    const r = await reativarAfiliadoAdmin(afiliadoId);
    if (r.success) { toast.success('Afiliado reativado'); loadAll(); } else toast.error(r.error);
  }
  async function handleAlterarSenha() {
    if (!senhaModal || !novaSenha.trim()) return;
    const r = await alterarSenhaAfiliadoAdmin(senhaModal.afiliadoId, novaSenha.trim());
    if (r.success) { toast.success('Senha alterada'); setSenhaModal(null); setNovaSenha(''); loadAll(); } else toast.error(r.error);
  }
  async function handleAdicionarAoCRM() {
    if (!crmModal?.lead || !crmModal?.corretorId) { toast.error('Selecione um corretor'); return; }
    const tel = (crmModal.lead.whatsapp || (crmModal.lead as any).telefone || '').toString().replace(/\D/g, '');
    const r = await createLeadWithCard({
      corretor_id: crmModal.corretorId,
      coluna_slug: 'novo_lead',
      nome: crmModal.lead.nome || 'Indicado',
      whatsapp: tel || '0000000000',
      email: (crmModal.lead as any).email || null,
      origem: 'form_indicar_afiliado',
      observacoes: `Indicação via afiliado. Lead id: ${crmModal.lead.id}`,
    });
    if (r.success) { toast.success('Lead adicionado ao CRM'); setCrmModal(null); } else toast.error(r.error || 'Erro ao adicionar');
  }

  const indicacoesViaAfiliado = useMemo(() => {
    const flat: (LeadIndicado & { corretor_nome?: string; id?: string })[] = [];
    if (indicacoesData?.corretores) {
      for (const c of indicacoesData.corretores) {
        for (const lead of c.leads || []) {
          if (lead.tipo === 'form_indicar_afiliado') {
            flat.push({ ...lead, corretor_nome: c.nome });
          }
        }
      }
    }
    flat.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return flat;
  }, [indicacoesData]);

  const indicacoesSemVinculo = useMemo(() => {
    return leadsIndicacaoAdmin.map((l) => {
      const corretorNome = (l as { corretor_id?: string }).corretor_id
        ? (corretoresList.find((c) => c.id === (l as { corretor_id?: string }).corretor_id)?.nome ?? 'Helcio Duarte Mattos')
        : '—';
      return {
        id: l.id,
        nome: l.nome,
        whatsapp: l.whatsapp,
        status: l.status || 'novo',
        created_at: l.created_at,
        afiliado_nome: 'Sem vínculo',
        corretor_nome: corretorNome,
      };
    });
  }, [leadsIndicacaoAdmin, corretoresList]);

  const todasIndicacoes = useMemo(() => {
    const merged = [
      ...indicacoesViaAfiliado,
      ...indicacoesSemVinculo.map((l) => ({ ...l, tipo: 'form_indicar_afiliado' as const })),
    ];
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged;
  }, [indicacoesViaAfiliado, indicacoesSemVinculo]);

  if (loading && leadsAfiliado.length === 0 && !indicacoesData) {
    return <PageLoading text="Carregando afiliados..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AFILIADOS"
        description="Quem pediu para ser afiliado e indicações feitas por afiliados"
      />

      <StatsGrid cols={4}>
        <StatsCard label="Quero ser afiliado" value={leadsAfiliado.length} />
        <StatsCard label="Indicações via afiliado" value={indicacoesViaAfiliado.length} />
        <StatsCard
          label="Via afiliado (tipo)"
          value={indicacoesData?.por_tipo?.form_indicar_afiliado ?? 0}
        />
        <StatsCard
          label="Seja afiliado (cadastros)"
          value={indicacoesData?.por_tipo?.seja_afiliado ?? 0}
        />
      </StatsGrid>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
        <button
          onClick={() => setTab('quero-ser-afiliado')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'quero-ser-afiliado'
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Quero ser afiliado
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{leadsAfiliado.length}</span>
        </button>
        <button
          onClick={() => setTab('indicacoes-afiliados')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'indicacoes-afiliados'
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Indicações dos afiliados
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{todasIndicacoes.length}</span>
        </button>
        <button
          onClick={() => setTab('afiliados-cadastrados')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'afiliados-cadastrados'
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="h-4 w-4" />
          Afiliados cadastrados
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{afiliadosCadastrados?.length ?? 0}</span>
        </button>
      </div>

      {tab === 'quero-ser-afiliado' && (
        <div className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Cadastros &quot;Quero ser afiliado&quot;
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Estes leads não aparecem na página de Leads. A coluna Vínculo indica se há corretor associado. Após contato, você pode liberar acesso ao painel do afiliado.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-3 py-3">E-mail</th>
                  <th className="px-3 py-3">WhatsApp</th>
                  <th className="hidden px-3 py-3 md:table-cell">CPF</th>
                  <th className="px-3 py-3">Vínculo</th>
                  <th className="hidden px-3 py-3 lg:table-cell">Observações</th>
                  <th className="px-3 py-3 text-right">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leadsAfiliado.map((lead) => {
                  const cpf = lead.dados_pdf?.dados_digitados?.cpf ?? lead.dados_pdf?.cpf ?? null;
                  const vinculoLabel = lead.corretor_id
                    ? (corretoresList.find((c) => c.id === lead.corretor_id)?.nome ?? 'Corretor')
                    : 'Sem vínculo';
                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-white">{lead.nome || '—'}</td>
                      <td className="px-3 py-3">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-[#D4AF37] hover:underline">
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {lead.whatsapp ? (
                          <a
                            href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                          >
                            {lead.whatsapp}
                          </a>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="hidden px-3 py-3 text-gray-400 md:table-cell">
                        {typeof cpf === 'string' ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <span className={lead.corretor_id ? 'text-[#D4AF37]' : 'text-gray-500'}>
                          {vinculoLabel}
                        </span>
                      </td>
                      <td className="hidden max-w-[200px] truncate px-3 py-3 text-gray-400 lg:table-cell">
                        {lead.observacoes || '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {leadsAfiliado.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <UserPlus className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum cadastro &quot;Quero ser afiliado&quot;</p>
            </div>
          )}
        </div>
      )}

      {tab === 'afiliados-cadastrados' && (
        <div className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
          <div className="border-b border-white/5 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Todos os afiliados (com e sem vínculo)
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Desative ou reative o afiliado; altere a senha de acesso ao painel.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-3 py-3">E-mail</th>
                  <th className="px-3 py-3">Telefone</th>
                  <th className="hidden px-3 py-3 md:table-cell">CPF</th>
                  <th className="px-3 py-3">Corretor</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(afiliadosCadastrados ?? []).map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{a.nome || '—'}</td>
                    <td className="px-3 py-3 text-gray-300">{a.email || '—'}</td>
                    <td className="px-3 py-3 text-gray-400">{a.telefone || '—'}</td>
                    <td className="hidden px-3 py-3 text-gray-400 md:table-cell">
                      {a.cpf ? a.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-400">{a.corretor_nome || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {a.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                      {a.ativo ? (
                        <button type="button" onClick={() => handleDesativar(a.id)} className="rounded bg-red-500/20 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/30" title="Desativar">Desativar</button>
                      ) : (
                        <button type="button" onClick={() => handleReativar(a.id)} className="rounded bg-green-500/20 px-2 py-1 text-[10px] font-medium text-green-400 hover:bg-green-500/30" title="Reativar">Reativar</button>
                      )}
                      <button type="button" onClick={() => setSenhaModal({ afiliadoId: a.id, nome: a.nome })} className="rounded bg-[#D4AF37]/20 px-2 py-1 text-[10px] font-medium text-[#D4AF37] hover:bg-[#D4AF37]/30" title="Alterar senha">Senha</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!afiliadosCadastrados || afiliadosCadastrados.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Users className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum afiliado cadastrado</p>
            </div>
          )}
        </div>
      )}

      {tab === 'indicacoes-afiliados' && (
        <div className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
          <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Indicações feitas por afiliados
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Pessoas indicadas via formulário /indicar por um afiliado (link do corretor). Visão completa em{' '}
                <Link href={`${P}/indicacoes`} className="text-[#D4AF37] hover:underline">
                  Indicações
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Indicado</th>
                  <th className="px-3 py-3">Via afiliado</th>
                  <th className="px-3 py-3">Corretor</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Data</th>
                  <th className="px-3 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todasIndicacoes.map((lead) => {
                  const st = STATUS_CONFIG[lead.status] || { label: lead.status, color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <tr key={lead.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{lead.nome || '—'}</p>
                          {lead.whatsapp && (
                            <a
                              href={`https://wa.me/55${(lead.whatsapp || '').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-green-500 hover:text-green-400"
                            >
                              {lead.whatsapp}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                          {lead.afiliado_nome || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-400">{(lead as any).corretor_nome || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setCrmModal({ lead: lead as LeadIndicado & { corretor_nome?: string } })}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#D4AF37]/20 px-2 py-1.5 text-[10px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/30"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Ao CRM
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {todasIndicacoes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Share2 className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhuma indicação via afiliado ainda</p>
              <Link href={`${P}/indicacoes`} className="mt-2 text-xs text-[#D4AF37] hover:underline">
                Ver todas as indicações
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Modal Alterar senha */}
      {senhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSenhaModal(null)}>
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Alterar senha</h3>
            <p className="text-sm text-gray-400 mb-4">Afiliado: {senhaModal.nome}</p>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setSenhaModal(null); setNovaSenha(''); }} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button type="button" onClick={handleAlterarSenha} className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E]">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar ao CRM */}
      {crmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setCrmModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Adicionar ao CRM</h3>
            <p className="text-sm text-gray-400 mb-4">Lead: {crmModal.lead.nome || '—'} · Atribuir a qual corretor?</p>
            <select
              value={crmModal.corretorId ?? ''}
              onChange={(e) => setCrmModal((m) => m ? { ...m, corretorId: e.target.value || undefined } : null)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white mb-4"
            >
              <option value="">Selecione o corretor</option>
              {corretoresList.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setCrmModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
              <button type="button" onClick={handleAdicionarAoCRM} className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E]">Adicionar ao CRM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
