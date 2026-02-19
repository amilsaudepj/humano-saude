'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Search,
  Filter,
  Plus,
  RefreshCw,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Calendar,
  X,
  Loader2,
  Package,
  Eye,
  Edit,
  CheckCircle,
  Upload,
  Receipt,
  Briefcase,
  BarChart3,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getProducoesAdmin,
  getProducaoDetalhes,
  atualizarProducao,
  criarProducaoManual,
  marcarParcelaPaga,
  getCorretoresParaSelect,
  getOperadorasParaSelect,
  getProducaoStats,
  type ProducaoIntegrada,
  type ParcelaComissaoEntry,
  type ProducaoAnexo,
} from '@/app/actions/producao-integrada';

// =============================================
// FORMATTERS
// =============================================

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const statusColors: Record<string, string> = {
  'Implantada': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Em análise': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Cancelada': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Suspensa': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const parcelaStatusColors: Record<string, string> = {
  'pendente': 'bg-yellow-500/20 text-yellow-300',
  'paga': 'bg-green-500/20 text-green-300',
  'atrasada': 'bg-red-500/20 text-red-300',
};

// =============================================
// MAIN PAGE
// =============================================

export default function ProducaoAdminPage() {
  // Data states
  const [producoes, setProducoes] = useState<ProducaoIntegrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalValor, setTotalValor] = useState(0);
  const [totalComissao, setTotalComissao] = useState(0);
  const [stats, setStats] = useState<{
    total_producoes: number;
    total_implantadas: number;
    total_valor_mensalidade: number;
    total_comissao: number;
    total_pago: number;
    total_pendente: number;
  } | null>(null);

  // Filter states
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCorretor, setFiltroCorretor] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    producao: ProducaoIntegrada;
    parcelas: ParcelaComissaoEntry[];
    anexos: ProducaoAnexo[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    valor_mensalidade: 0,
    percentual_comissao: 0,
    status: '',
    observacoes_admin: '',
    modalidade: '',
  });

  // New production modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    corretor_id: '',
    nome_segurado: '',
    cpf_segurado: '',
    numero_proposta: '',
    operadora_id: '',
    modalidade: '',
    subproduto: '',
    valor_mensalidade: '',
    percentual_comissao: '100',
    numero_parcelas: '12',
    observacoes: '',
  });
  const [savingNew, setSavingNew] = useState(false);

  // Selects
  const [corretores, setCorretores] = useState<{ id: string; nome: string; email: string | null }[]>([]);
  const [operadoras, setOperadoras] = useState<{ id: string; nome: string }[]>([]);

  const totalPages = Math.ceil(total / perPage);

  // =============================================
  // LOAD DATA
  // =============================================

  const loadProducoes = useCallback(async () => {
    setLoading(true);
    const result = await getProducoesAdmin({
      busca: busca || undefined,
      corretor_id: filtroCorretor || undefined,
      status: filtroStatus || undefined,
      modalidade: filtroModalidade || undefined,
      page,
      perPage,
    });
    if (result.success) {
      setProducoes(result.data || []);
      setTotal(result.total || 0);
      setTotalValor(result.totalValor || 0);
      setTotalComissao(result.totalComissao || 0);
    } else {
      toast.error('Erro ao carregar produções');
    }
    setLoading(false);
  }, [busca, filtroCorretor, filtroStatus, filtroModalidade, page]);

  const loadStats = useCallback(async () => {
    const result = await getProducaoStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  }, []);

  const loadSelects = useCallback(async () => {
    const [corrRes, opRes] = await Promise.all([
      getCorretoresParaSelect(),
      getOperadorasParaSelect(),
    ]);
    if (corrRes.success) setCorretores(corrRes.data || []);
    if (opRes.success) setOperadoras(opRes.data || []);
  }, []);

  useEffect(() => {
    loadProducoes();
  }, [loadProducoes]);

  useEffect(() => {
    loadStats();
    loadSelects();
  }, [loadStats, loadSelects]);

  // =============================================
  // DETAIL PANEL
  // =============================================

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    setEditMode(false);
    const result = await getProducaoDetalhes(id);
    if (result.success && result.producao) {
      setDetailData({
        producao: result.producao,
        parcelas: result.parcelas || [],
        anexos: result.anexos || [],
      });
      setEditForm({
        valor_mensalidade: result.producao.valor_mensalidade,
        percentual_comissao: result.producao.percentual_comissao,
        status: result.producao.status,
        observacoes_admin: result.producao.observacoes_admin || '',
        modalidade: result.producao.modalidade || '',
      });
    }
    setLoadingDetail(false);
  }, []);

  const handleSaveEdit = async () => {
    if (!selectedId) return;
    const result = await atualizarProducao(selectedId, {
      valor_mensalidade: editForm.valor_mensalidade,
      percentual_comissao: editForm.percentual_comissao,
      status: editForm.status || undefined,
      observacoes_admin: editForm.observacoes_admin,
      modalidade: editForm.modalidade || undefined,
    });
    if (result.success) {
      toast.success('Produção atualizada! Comissões recalculadas.');
      setEditMode(false);
      openDetail(selectedId);
      loadProducoes();
      loadStats();
    } else {
      toast.error(result.error || 'Erro ao salvar');
    }
  };

  const handlePayParcela = async (parcelaId: string) => {
    const result = await marcarParcelaPaga(parcelaId);
    if (result.success) {
      toast.success('Parcela marcada como paga!');
      if (selectedId) openDetail(selectedId);
      loadStats();
    } else {
      toast.error(result.error || 'Erro');
    }
  };

  // =============================================
  // NEW PRODUCTION
  // =============================================

  const handleCreateProducao = async () => {
    if (!newForm.corretor_id || !newForm.nome_segurado || !newForm.valor_mensalidade) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setSavingNew(true);
    const result = await criarProducaoManual({
      corretor_id: newForm.corretor_id,
      nome_segurado: newForm.nome_segurado,
      cpf_segurado: newForm.cpf_segurado || undefined,
      numero_proposta: newForm.numero_proposta || undefined,
      operadora_id: newForm.operadora_id || undefined,
      modalidade: newForm.modalidade || undefined,
      subproduto: newForm.subproduto || undefined,
      valor_mensalidade: parseFloat(newForm.valor_mensalidade),
      percentual_comissao: parseFloat(newForm.percentual_comissao) || 100,
      numero_parcelas: parseInt(newForm.numero_parcelas) || 12,
      observacoes: newForm.observacoes || undefined,
    });
    setSavingNew(false);
    if (result.success) {
      toast.success('Produção criada com sucesso!');
      setShowNewModal(false);
      setNewForm({
        corretor_id: '', nome_segurado: '', cpf_segurado: '', numero_proposta: '',
        operadora_id: '', modalidade: '', subproduto: '', valor_mensalidade: '',
        percentual_comissao: '100', numero_parcelas: '12', observacoes: '',
      });
      loadProducoes();
      loadStats();
    } else {
      toast.error(result.error || 'Erro ao criar produção');
    }
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('');
    setFiltroCorretor('');
    setFiltroModalidade('');
    setPage(1);
  };

  const modalidades = ['Individual', 'Familiar', 'PME', 'Adesão', 'Individual Odonto'];
  const statusOptions = ['Implantada', 'Em análise', 'Cancelada', 'Suspensa'];

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            GESTÃO DE PRODUÇÃO
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gerencie produções, comissões, grades e pagamentos — tudo refletido no painel do corretor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadProducoes(); loadStats(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black font-medium hover:bg-[#E8C25B] transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Produção
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-[11px] text-white/40">Total Produções</span>
          </div>
          <p className="text-xl font-bold text-white">{stats?.total_producoes || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            </div>
            <span className="text-[11px] text-white/40">Implantadas</span>
          </div>
          <p className="text-xl font-bold text-green-400">{stats?.total_implantadas || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-[#D4AF37]" />
            </div>
            <span className="text-[11px] text-white/40">Valor Mensal</span>
          </div>
          <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(stats?.total_valor_mensalidade || 0)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <span className="text-[11px] text-white/40">Total Comissão</span>
          </div>
          <p className="text-xl font-bold text-purple-400">{formatCurrency(stats?.total_comissao || 0)}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-yellow-400" />
            </div>
            <span className="text-[11px] text-white/40">Pendente</span>
          </div>
          <p className="text-xl font-bold text-yellow-400">{formatCurrency(stats?.total_pendente || 0)}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por nome, proposta ou CPF..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
            />
          </div>
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all',
              showFiltros ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {showFiltros ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        <AnimatePresence>
          {showFiltros && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <select
                  value={filtroCorretor}
                  onChange={(e) => { setFiltroCorretor(e.target.value); setPage(1); }}
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                >
                  <option value="">Todos os corretores</option>
                  {corretores.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>

                <select
                  value={filtroStatus}
                  onChange={(e) => { setFiltroStatus(e.target.value); setPage(1); }}
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                >
                  <option value="">Todos os status</option>
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={filtroModalidade}
                  onChange={(e) => { setFiltroModalidade(e.target.value); setPage(1); }}
                  className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                >
                  <option value="">Todas as modalidades</option>
                  {modalidades.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={limparFiltros}
                className="mt-2 flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                <X className="h-3 w-3" /> Limpar filtros
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content: Table + Detail Panel */}
      <div className="flex gap-4">
        {/* Table */}
        <div className={cn(
          'bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl transition-all',
          selectedId ? 'flex-1' : 'w-full'
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Segurado</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden md:table-cell">Corretor</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden lg:table-cell">Proposta</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden lg:table-cell">Modalidade</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Mensalidade</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider hidden md:table-cell">Comissão</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37] mx-auto" />
                      <p className="text-xs text-white/40 mt-2">Carregando produções...</p>
                    </td>
                  </tr>
                ) : producoes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-white/30">
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-base">Nenhuma produção encontrada</p>
                      <p className="text-xs mt-1">Crie uma nova ou aguarde propostas serem implantadas</p>
                    </td>
                  </tr>
                ) : (
                  producoes.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openDetail(p.id)}
                      className={cn(
                        'border-b border-white/[0.04] cursor-pointer transition-all',
                        selectedId === p.id ? 'bg-[#D4AF37]/5' : 'hover:bg-white/[0.02]'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium truncate max-w-[200px]">{p.nome_segurado}</p>
                          <p className="text-[11px] text-white/40">{p.cpf_segurado || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-white/70 text-xs truncate max-w-[150px]">{p.corretor_nome || '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="font-mono text-xs text-blue-400">{p.numero_proposta || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-white/50">{p.modalidade || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-medium">{formatCurrency(p.valor_mensalidade)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-[#D4AF37] font-medium">{formatCurrency(p.valor_comissao_total)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border',
                          statusColors[p.status] || 'bg-white/10 text-white/60 border-white/20'
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(p.id); }}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08]">
              <p className="text-xs text-white/40">{total} produções total</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs disabled:opacity-30 hover:bg-white/10">Anterior</button>
                <span className="px-3 py-1.5 text-xs text-white/60">{page} de {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs disabled:opacity-30 hover:bg-white/10">Próxima</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedId && detailData && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 480, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-xl flex-shrink-0"
            >
              <div className="h-full overflow-y-auto max-h-[calc(100vh-300px)]">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {/* Detail Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{detailData.producao.nome_segurado}</h3>
                        <p className="text-xs text-white/40">{detailData.producao.numero_proposta}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditMode(!editMode)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            editMode ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/10 text-white/50 hover:text-white'
                          )}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedId(null); setDetailData(null); }}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/40 uppercase">Mensalidade</p>
                        {editMode ? (
                          <input
                            type="number"
                            value={editForm.valor_mensalidade}
                            onChange={(e) => setEditForm(f => ({ ...f, valor_mensalidade: parseFloat(e.target.value) || 0 }))}
                            className="w-full mt-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        ) : (
                          <p className="text-lg font-bold text-[#D4AF37]">{formatCurrency(detailData.producao.valor_mensalidade)}</p>
                        )}
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/40 uppercase">% Comissão</p>
                        {editMode ? (
                          <input
                            type="number"
                            value={editForm.percentual_comissao}
                            onChange={(e) => setEditForm(f => ({ ...f, percentual_comissao: parseFloat(e.target.value) || 0 }))}
                            className="w-full mt-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40"
                          />
                        ) : (
                          <p className="text-lg font-bold text-white">{detailData.producao.percentual_comissao}%</p>
                        )}
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/40 uppercase">Total Comissão</p>
                        <p className="text-lg font-bold text-purple-400">{formatCurrency(detailData.producao.valor_comissao_total)}</p>
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/40 uppercase">Status</p>
                        {editMode ? (
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                            className="w-full mt-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40"
                          >
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 border',
                            statusColors[detailData.producao.status] || 'bg-white/10 text-white/60 border-white/20'
                          )}>
                            {detailData.producao.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Corretor info */}
                    <div className="bg-white/[0.04] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <p className="text-[10px] text-white/40 uppercase">Corretor</p>
                      </div>
                      <p className="text-sm text-white font-medium">{detailData.producao.corretor_nome || '—'}</p>
                      <p className="text-xs text-white/40">{detailData.producao.corretor_email}</p>
                    </div>

                    {/* Dados */}
                    <div className="bg-white/[0.04] rounded-xl p-3 space-y-1.5">
                      <p className="text-[10px] text-white/40 uppercase mb-2">Detalhes</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/50">CPF</span>
                        <span className="text-white">{detailData.producao.cpf_segurado || '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/50">Modalidade</span>
                        <span className="text-white">{detailData.producao.modalidade || '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/50">Data Implantação</span>
                        <span className="text-white">{formatDate(detailData.producao.data_implantacao)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/50">Data Produção</span>
                        <span className="text-white">{formatDate(detailData.producao.data_producao)}</span>
                      </div>
                    </div>

                    {/* Observações (edit mode) */}
                    {editMode && (
                      <div className="bg-white/[0.04] rounded-xl p-3">
                        <p className="text-[10px] text-white/40 uppercase mb-2">Observações do Admin</p>
                        <textarea
                          value={editForm.observacoes_admin}
                          onChange={(e) => setEditForm(f => ({ ...f, observacoes_admin: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40 resize-none"
                          placeholder="Observações internas..."
                        />
                      </div>
                    )}

                    {/* Save button */}
                    {editMode && (
                      <button
                        onClick={handleSaveEdit}
                        className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black font-medium hover:bg-[#E8C25B] transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Salvar e Recalcular Comissões
                      </button>
                    )}

                    {/* Parcelas */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-white/40 uppercase font-semibold">
                          Parcelas de Comissão ({detailData.parcelas.length})
                        </p>
                      </div>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {detailData.parcelas.length === 0 ? (
                          <p className="text-xs text-white/30 text-center py-4">Nenhuma parcela gerada</p>
                        ) : (
                          detailData.parcelas.map((parcela) => (
                            <div key={parcela.id} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-3 py-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-white/40 w-6">#{parcela.numero_parcela}</span>
                                <div>
                                  <p className="text-xs text-white">{formatCurrency(parcela.taxa)}</p>
                                  <p className="text-[10px] text-white/40">{formatDate(parcela.data_vencimento)} · {parcela.percentual_comissao}%</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded-full',
                                  parcelaStatusColors[parcela.status_comissao] || 'bg-white/10 text-white/50'
                                )}>
                                  {parcela.status_comissao}
                                </span>
                                {parcela.status_comissao === 'pendente' && (
                                  <button
                                    onClick={() => handlePayParcela(parcela.id)}
                                    className="text-[10px] px-2 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                  >
                                    Pagar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Anexos */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-white/40 uppercase font-semibold flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Anexos ({detailData.anexos.length})
                        </p>
                      </div>
                      {detailData.anexos.length === 0 ? (
                        <p className="text-xs text-white/30 text-center py-3">Nenhum anexo</p>
                      ) : (
                        <div className="space-y-1">
                          {detailData.anexos.map((a) => (
                            <a
                              key={a.id}
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2 hover:bg-white/[0.06] transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-400" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-white truncate">{a.nome}</p>
                                <p className="text-[10px] text-white/40">{a.tipo}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =============================================
          NEW PRODUCTION MODAL
          ============================================= */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowNewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Plus className="h-5 w-5 text-[#D4AF37]" />
                      Nova Produção Manual
                    </h2>
                    <p className="text-sm text-white/40 mt-1">Criar produção com cálculo automático de comissões</p>
                  </div>
                  <button onClick={() => setShowNewModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/50">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Corretor */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/50 mb-1 block">Corretor *</label>
                    <select
                      value={newForm.corretor_id}
                      onChange={(e) => setNewForm(f => ({ ...f, corretor_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                    >
                      <option value="">Selecione o corretor...</option>
                      {corretores.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Nome Segurado */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Nome do Segurado *</label>
                    <input
                      type="text"
                      value={newForm.nome_segurado}
                      onChange={(e) => setNewForm(f => ({ ...f, nome_segurado: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                      placeholder="Nome completo"
                    />
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">CPF</label>
                    <input
                      type="text"
                      value={newForm.cpf_segurado}
                      onChange={(e) => setNewForm(f => ({ ...f, cpf_segurado: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  {/* Número Proposta */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Nº Proposta</label>
                    <input
                      type="text"
                      value={newForm.numero_proposta}
                      onChange={(e) => setNewForm(f => ({ ...f, numero_proposta: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                      placeholder="Número da proposta"
                    />
                  </div>

                  {/* Operadora */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Operadora</label>
                    <select
                      value={newForm.operadora_id}
                      onChange={(e) => setNewForm(f => ({ ...f, operadora_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                    >
                      <option value="">Selecione...</option>
                      {operadoras.map(o => (
                        <option key={o.id} value={o.id}>{o.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Modalidade */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Modalidade</label>
                    <select
                      value={newForm.modalidade}
                      onChange={(e) => setNewForm(f => ({ ...f, modalidade: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/40"
                    >
                      <option value="">Selecione...</option>
                      {modalidades.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Subproduto */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Subproduto</label>
                    <input
                      type="text"
                      value={newForm.subproduto}
                      onChange={(e) => setNewForm(f => ({ ...f, subproduto: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                      placeholder="Ex: Unimed Básico"
                    />
                  </div>

                  {/* Valor Mensalidade */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Valor Mensalidade (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newForm.valor_mensalidade}
                      onChange={(e) => setNewForm(f => ({ ...f, valor_mensalidade: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                      placeholder="0,00"
                    />
                  </div>

                  {/* Percentual Comissão */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">% Comissão (1ª parcela)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newForm.percentual_comissao}
                      onChange={(e) => setNewForm(f => ({ ...f, percentual_comissao: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                    />
                  </div>

                  {/* Número de Parcelas */}
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Nº Parcelas</label>
                    <input
                      type="number"
                      value={newForm.numero_parcelas}
                      onChange={(e) => setNewForm(f => ({ ...f, numero_parcelas: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40"
                    />
                  </div>

                  {/* Observações */}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/50 mb-1 block">Observações</label>
                    <textarea
                      value={newForm.observacoes}
                      onChange={(e) => setNewForm(f => ({ ...f, observacoes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40 resize-none"
                      placeholder="Observações internas..."
                    />
                  </div>

                  {/* Preview */}
                  {newForm.valor_mensalidade && (
                    <div className="sm:col-span-2 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4">
                      <p className="text-xs text-[#D4AF37] font-semibold mb-2">Prévia do Cálculo</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-[10px] text-white/40">1ª Parcela</p>
                          <p className="text-sm font-bold text-[#D4AF37]">
                            {formatCurrency(parseFloat(newForm.valor_mensalidade) * (parseFloat(newForm.percentual_comissao) || 100) / 100)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40">Recorrente</p>
                          <p className="text-sm font-bold text-white/70">
                            {formatCurrency(parseFloat(newForm.valor_mensalidade) * 0.3)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/40">Total Estimado</p>
                          <p className="text-sm font-bold text-purple-400">
                            {formatCurrency(
                              parseFloat(newForm.valor_mensalidade) * (parseFloat(newForm.percentual_comissao) || 100) / 100 +
                              parseFloat(newForm.valor_mensalidade) * 0.3 * (parseInt(newForm.numero_parcelas) - 1 || 11)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateProducao}
                    disabled={savingNew || !newForm.corretor_id || !newForm.nome_segurado || !newForm.valor_mensalidade}
                    className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-black font-medium hover:bg-[#E8C25B] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingNew ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Criar Produção
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
