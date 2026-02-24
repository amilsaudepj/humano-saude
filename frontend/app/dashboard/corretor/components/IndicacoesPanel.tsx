'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Link2,
  Users,
  MessageCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  Target,
  Eye,
  ArrowUpRight,
  Share2,
  QrCode,
  Rocket,
  CheckCheck,
  Shield,
  Zap,
  TrendingUp,
  XCircle,
  DollarSign,
  CreditCard,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getIndicacoesCorretor,
  getLeadsEconomizarCorretor,
  type LeadEconomizar,
} from '@/app/actions/leads-indicacao';
import type { LeadIndicacao } from '@/app/actions/leads-indicacao';
import { getSolicitacoesIndicadasPorCorretor, type SolicitacaoCorretor } from '@/app/actions/solicitacoes-corretor';
import { createLeadWithCard } from '@/app/actions/corretor-crm';

// =============================================
// STATUS CONFIG
// =============================================

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  simulou: { label: 'Simulou', color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'O lead fez a simulação' },
  entrou_em_contato: { label: 'Em contato', color: 'text-yellow-400', bg: 'bg-yellow-400/10', desc: 'Humano Saúde entrou em contato' },
  em_analise: { label: 'Em análise', color: 'text-purple-400', bg: 'bg-purple-400/10', desc: 'Proposta sendo analisada' },
  proposta_enviada: { label: 'Proposta enviada', color: 'text-orange-400', bg: 'bg-orange-400/10', desc: 'Proposta enviada ao cliente' },
  fechado: { label: '✅ Venda fechada', color: 'text-green-400', bg: 'bg-green-400/10', desc: 'Venda concluída com sucesso!' },
  perdido: { label: 'Não fechou', color: 'text-red-400', bg: 'bg-red-400/10', desc: 'Cliente não fechou' },
};

// =============================================
// BOTÃO ADICIONAR AO CRM
// =============================================

function AddToCrmButton({ corretorId, lead, onSuccess }: { corretorId: string; lead: LeadIndicacao; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const tel = (lead.whatsapp || lead.telefone || '').toString().replace(/\D/g, '');
  const handleAdd = async () => {
    if (!tel || tel.length < 10) {
      toast.error('Lead sem telefone válido para adicionar ao CRM');
      return;
    }
    setLoading(true);
    const r = await createLeadWithCard({
      corretor_id: corretorId,
      coluna_slug: 'novo_lead',
      nome: lead.nome || 'Indicado',
      whatsapp: tel,
      email: lead.email || null,
      operadora_atual: lead.operadora_atual || null,
      valor_atual: lead.valor_atual ?? null,
      origem: 'form_indicar_afiliado',
      observacoes: `Indicação${lead.afiliado_nome ? ` via afiliado ${lead.afiliado_nome}` : ''}. Lead id: ${lead.id}`,
    });
    setLoading(false);
    if (r.success) {
      toast.success('Lead adicionado ao seu CRM');
      onSuccess();
    } else {
      toast.error(r.error || 'Erro ao adicionar ao CRM');
    }
  };
  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-lg bg-[#D4AF37]/20 px-2 py-1.5 text-[10px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/30 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
      Ao CRM
    </button>
  );
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function IndicacoesPanel({ corretorId, slug: initialSlug }: { corretorId: string; slug?: string }) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadIndicacao[]>([]);
  const [total, setTotal] = useState(0);
  const [resumo, setResumo] = useState({
    total: 0,
    simularam: 0,
    contataram: 0,
    em_analise: 0,
    fechados: 0,
    taxa_conversao: 0,
  });

  // Slug
  const [slug, setSlug] = useState(initialSlug || '');
  const [slugConfirmado, setSlugConfirmado] = useState(!!initialSlug);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'form_indicar' | 'form_indicar_afiliado'>('todos');
  const [pagina, setPagina] = useState(1);

  // Aba: indicações formulário | leads economizar | indicados para ser corretor
  const [abaIndicacoes, setAbaIndicacoes] = useState<'formulario' | 'economizar' | 'indicados_corretor'>('formulario');
  const [leadsEconomizar, setLeadsEconomizar] = useState<LeadEconomizar[]>([]);
  const [loadingEconomizar, setLoadingEconomizar] = useState(false);
  const [solicitacoesIndicadas, setSolicitacoesIndicadas] = useState<SolicitacaoCorretor[]>([]);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);

  // Link de indicação
  const linkIndicacao = `https://humanosaude.com.br/economizar/${slug}`;

  // Atualizar quando prop muda
  useEffect(() => {
    if (initialSlug) {
      setSlug(initialSlug);
      setSlugConfirmado(true);
    }
  }, [initialSlug]);

  const fetchData = useCallback(async () => {
    if (!slugConfirmado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getIndicacoesCorretor(corretorId, {
      status: statusFiltro,
      busca: busca || undefined,
      pagina,
      limite: 15,
    });
    if (result.success) {
      setLeads(result.data ?? []);
      setTotal(result.total ?? 0);
      if (result.resumo) setResumo(result.resumo);
    }
    setLoading(false);
  }, [corretorId, slugConfirmado, statusFiltro, busca, pagina]);

  const leadsFiltrados = tipoFiltro === 'todos'
    ? leads
    : leads.filter((l) => l.tipo === tipoFiltro);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (abaIndicacoes === 'economizar' && corretorId) {
      setLoadingEconomizar(true);
      getLeadsEconomizarCorretor(corretorId).then((r) => {
        if (r.success && r.data) setLeadsEconomizar(r.data);
        setLoadingEconomizar(false);
      });
    }
  }, [abaIndicacoes, corretorId]);

  useEffect(() => {
    if (abaIndicacoes === 'indicados_corretor' && corretorId) {
      setLoadingSolicitacoes(true);
      getSolicitacoesIndicadasPorCorretor(corretorId).then((r) => {
        if (r.success && r.data) setSolicitacoesIndicadas(r.data);
        setLoadingSolicitacoes(false);
      });
    }
  }, [abaIndicacoes, corretorId]);

  // Polling real-time (a cada 30s)
  useEffect(() => {
    if (!slugConfirmado) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, slugConfirmado]);

  // ── Gerar link automático ──
  const gerarLink = async () => {
    setGerando(true);
    try {
      const res = await fetch('/api/corretor/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gerar_link: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar link');
        return;
      }
      setSlug(data.slug);
      setSlugConfirmado(true);
      toast.success('Link gerado com sucesso!');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setGerando(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkIndicacao);
    setCopiado(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartilharWhatsApp = () => {
    const texto = encodeURIComponent(
      `Descubra quanto você pode economizar no plano de saúde!\n\nUse a calculadora gratuita e veja a diferença:\n${linkIndicacao}\n\nÉ rápido, fácil e sem compromisso!`
    );
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

  const formatCurrency = (v: number | null) =>
    v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#D4AF37]" />
          Minhas Indicações
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Indique a calculadora de economia e acompanhe os leads
        </p>
      </div>

      {/* ================================================== */}
      {/* SEÇÃO 1: GERAR OU EXIBIR LINK */}
      {/* ================================================== */}

      {!slugConfirmado ? (
        /* ── Estado: Sem link → Gerar ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-5">
              <Rocket className="h-8 w-8 text-[#D4AF37]" />
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white mb-3">
              Gere seu link de indicação
            </h3>
            <p className="text-sm text-white/50 mb-6 leading-relaxed max-w-md mx-auto">
              Envie para amigos, familiares e clientes. Quem acessar poderá simular
              a economia no plano de saúde, e o lead aparece aqui no seu painel.
            </p>

            {/* Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { icon: Shield, text: 'Link seguro e rastreável' },
                { icon: Zap, text: 'Leads em tempo real' },
                { icon: Target, text: 'Acompanhe cada indicação' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Icon className="h-4 w-4 text-[#D4AF37] shrink-0" />
                    <span className="text-[11px] text-white/50">{item.text}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={gerarLink}
              disabled={gerando}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#D4AF37] text-black text-sm font-bold hover:bg-[#F6E05E] transition-all disabled:opacity-50"
            >
              {gerando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {gerando ? 'Gerando...' : 'Gerar meu link'}
            </button>
          </div>
        </motion.div>
      ) : (
        /* ── Estado: Link existe → Exibir + ações ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 to-transparent p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Seu link de indicação
              </p>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08]">
                <p className="text-sm text-white/80 truncate font-mono">{linkIndicacao}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copiarLink}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all',
                  copiado
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-[#D4AF37] text-black hover:bg-[#F6E05E]'
                )}
              >
                {copiado ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </>
                )}
              </button>
              <button
                onClick={compartilharWhatsApp}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-500 transition-all"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp
              </button>
              <a
                href={linkIndicacao}
                target="_blank"
                className="p-3 rounded-xl border border-white/[0.08] text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors"
                title="Abrir link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Como funciona */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
            {[
              { icon: Share2, title: 'Compartilhe', desc: 'Envie o link para quem precisa economizar' },
              { icon: QrCode, title: 'Lead simula', desc: 'A pessoa calcula a economia no plano' },
              { icon: Target, title: 'Receba aqui', desc: 'O lead aparece neste painel automaticamente' },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{step.title}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ================================================== */}
      {/* SEÇÃO 2: ABAS + CONTEÚDO (só se tem link) */}
      {/* ================================================== */}
      {slugConfirmado && (
        <>
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            <button
              onClick={() => setAbaIndicacoes('formulario')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                abaIndicacoes === 'formulario'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              Indicações (formulário)
            </button>
            <button
              onClick={() => setAbaIndicacoes('economizar')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                abaIndicacoes === 'economizar'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              Leads pelo Economizar
            </button>
            <button
              onClick={() => setAbaIndicacoes('indicados_corretor')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                abaIndicacoes === 'indicados_corretor'
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              Indicados para ser corretor
            </button>
          </div>

          {abaIndicacoes === 'formulario' && (
          <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total leads', value: resumo.total, icon: Users, color: 'text-white' },
              { label: 'Simularam', value: resumo.simularam, icon: Eye, color: 'text-blue-400' },
              { label: 'Contataram', value: resumo.contataram, icon: MessageCircle, color: 'text-yellow-400' },
              { label: 'Em análise', value: resumo.em_analise, icon: Target, color: 'text-purple-400' },
              { label: 'Fechados', value: resumo.fechados, icon: CheckCircle, color: 'text-green-400' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn('h-4 w-4', item.color)} />
                    {item.label === 'Total leads' && resumo.taxa_conversao > 0 && (
                      <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3" />
                        {resumo.taxa_conversao}%
                      </span>
                    )}
                  </div>
                  <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{item.label}</p>
                </div>
              );
            })}
          </div>

          {/* Filtros (só na aba formulário) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por nome..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
              />
            </div>
            <select
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value as 'todos' | 'form_indicar' | 'form_indicar_afiliado');
                setPagina(1);
              }}
              className="pl-4 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none appearance-none"
            >
              <option value="todos">Todos os tipos</option>
              <option value="form_indicar">Form. indicar (direto)</option>
              <option value="form_indicar_afiliado">Via afiliado</option>
            </select>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <select
                value={statusFiltro}
                onChange={(e) => {
                  setStatusFiltro(e.target.value);
                  setPagina(1);
                }}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none appearance-none"
              >
                <option value="todos">Todos status</option>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de leads */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
              </div>
            ) : leads.length === 0 ? (
              <div className="py-16 text-center">
                <Link2 className="h-10 w-10 mx-auto mb-3 text-white/10" />
                <p className="text-white/30 text-sm">Nenhuma indicação ainda</p>
                <p className="text-white/20 text-xs mt-1">
                  Compartilhe seu link para começar a receber leads
                </p>
              </div>
            ) : leadsFiltrados.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-white/40 text-sm">Nenhum lead neste filtro de tipo</p>
                <p className="text-white/20 text-xs mt-1">Altere o filtro &quot;Todos os tipos&quot;</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Lead</th>
                      <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden sm:table-cell">Tipo</th>
                      <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Status Cliente</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden md:table-cell">Valor Fatura</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden md:table-cell">Plano Novo Est.</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden lg:table-cell">Economia</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden lg:table-cell">Data</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsFiltrados.map((lead) => {
                      const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.simulou;
                      const viaAfiliado = lead.tipo === 'form_indicar_afiliado';
                      return (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                        >
                          {/* NOME COMPLETO + Vidas + Indicadores */}
                          <td className="px-4 py-3">
                            <p className="text-sm text-white font-medium">{lead.nome || 'Lead'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-white/20">{lead.qtd_vidas} vida{lead.qtd_vidas !== 1 ? 's' : ''}</span>
                              {viaAfiliado && lead.afiliado_nome && (
                                <span className="text-[10px] text-violet-400/80 bg-violet-400/10 px-1.5 py-0.5 rounded">via {lead.afiliado_nome}</span>
                              )}
                              {lead.clicou_no_contato && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-green-400/70 bg-green-400/5 px-1.5 py-0.5 rounded">
                                  <MessageCircle className="h-2.5 w-2.5" />
                                  Contatou
                                </span>
                              )}
                            </div>
                          </td>

                          {/* TIPO: direto ou via afiliado */}
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            {viaAfiliado ? (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-500/20 text-violet-400">Via afiliado</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400">Form. indicar</span>
                            )}
                          </td>

                          {/* STATUS CLIENTE (read-only, atualizado pelo admin) */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                title={statusCfg.desc}
                                className={cn(
                                  'inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg',
                                  statusCfg.bg,
                                  statusCfg.color,
                                )}
                              >
                                {lead.status === 'fechado' && <CheckCircle className="h-3 w-3" />}
                                {lead.status === 'perdido' && <XCircle className="h-3 w-3" />}
                                {lead.status === 'em_analise' && <Target className="h-3 w-3" />}
                                {lead.status === 'entrou_em_contato' && <MessageCircle className="h-3 w-3" />}
                                {lead.status === 'simulou' && <Eye className="h-3 w-3" />}
                                {lead.status === 'proposta_enviada' && <TrendingUp className="h-3 w-3" />}
                                {statusCfg.label}
                              </span>
                              <span className="text-[9px] text-white/20">{statusCfg.desc}</span>
                            </div>
                          </td>

                          {/* VALOR DA FATURA (valor atual do cliente) */}
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            {lead.valor_atual ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <CreditCard className="h-3 w-3 text-white/20" />
                                <span className="text-sm text-white font-medium">{formatCurrency(lead.valor_atual)}</span>
                              </div>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          {/* VALOR ESTIMADO PLANO NOVO */}
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            {lead.valor_estimado_min ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <DollarSign className="h-3 w-3 text-[#D4AF37]/40" />
                                <span className="text-sm text-[#D4AF37] font-medium">{formatCurrency(lead.valor_estimado_min)}</span>
                              </div>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          {/* ECONOMIA ESTIMADA */}
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            {lead.economia_estimada ? (
                              <span className="text-sm text-green-400 font-medium">{formatCurrency(lead.economia_estimada)}</span>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </td>

                          {/* DATA */}
                          <td className="px-4 py-3 text-right text-[11px] text-white/30 hidden lg:table-cell">
                            {formatDate(lead.created_at)}
                          </td>

                          {/* ADICIONAR AO CRM */}
                          <td className="px-4 py-3 text-right">
                            <AddToCrmButton corretorId={corretorId} lead={lead} onSuccess={fetchData} />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {total > 15 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <p className="text-xs text-white/30">
                  {(pagina - 1) * 15 + 1}–{Math.min(pagina * 15, total)} de {total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-3 py-1 rounded-lg text-xs text-white/40 hover:text-white disabled:opacity-30"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagina((p) => p + 1)}
                    disabled={pagina * 15 >= total}
                    className="px-3 py-1 rounded-lg text-xs text-white/40 hover:text-white disabled:opacity-30"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
          </>
          )}

          {abaIndicacoes === 'economizar' && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
              {loadingEconomizar ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                </div>
              ) : leadsEconomizar.length === 0 ? (
                <div className="py-16 text-center">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 text-white/10" />
                  <p className="text-white/30 text-sm">Nenhum lead pelo link Economizar ainda</p>
                  <p className="text-white/20 text-xs mt-1">Quem acessar seu link /economizar/{slug} e simular aparecerá aqui</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Lead</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden sm:table-cell">Operadora / Status</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Valor / Economia</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsEconomizar.map((lead) => (
                        <tr key={lead.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="text-sm text-white font-medium">{lead.nome || '—'}</p>
                            {(lead.whatsapp || lead.email) && (
                              <p className="text-[10px] text-white/40 mt-0.5">{lead.whatsapp || lead.email}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-white/70 hidden sm:table-cell">
                            {lead.operadora_atual || '—'} {lead.status && `· ${lead.status}`}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {lead.valor_atual != null && <span className="text-white/70">{formatCurrency(lead.valor_atual)}</span>}
                            {lead.economia_estimada != null && (
                              <span className="text-green-400 ml-2">{formatCurrency(lead.economia_estimada)}</span>
                            )}
                            {lead.valor_atual == null && lead.economia_estimada == null && '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-[11px] text-white/30">{formatDate(lead.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {abaIndicacoes === 'indicados_corretor' && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl">
              {loadingSolicitacoes ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                </div>
              ) : solicitacoesIndicadas.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="h-10 w-10 mx-auto mb-3 text-white/10" />
                  <p className="text-white/30 text-sm">Nenhum indicado para ser corretor</p>
                  <p className="text-white/20 text-xs mt-1">Quem se cadastrar pelo seu link &quot;Seja corretor&quot; aparecerá aqui</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Nome / Contato</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase hidden sm:table-cell">Experiência</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Status</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitacoesIndicadas.map((sol) => (
                        <tr key={sol.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <p className="text-sm text-white font-medium">{sol.nome_completo || '—'}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">{sol.email}</p>
                            {sol.telefone && <p className="text-[10px] text-white/40">{sol.telefone}</p>}
                          </td>
                          <td className="px-4 py-3 text-white/60 hidden sm:table-cell">
                            {sol.experiencia_anos} ano(s) · {sol.operadoras_experiencia?.length ? sol.operadoras_experiencia.join(', ') : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                                sol.status === 'aprovado' && 'bg-green-500/20 text-green-400',
                                sol.status === 'rejeitado' && 'bg-red-500/20 text-red-400',
                                sol.status === 'pendente' && 'bg-yellow-500/20 text-yellow-400'
                              )}
                            >
                              {sol.status === 'pendente' && 'Pendente'}
                              {sol.status === 'aprovado' && 'Aprovado'}
                              {sol.status === 'rejeitado' && 'Rejeitado'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-[11px] text-white/30">{formatDate(sol.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
