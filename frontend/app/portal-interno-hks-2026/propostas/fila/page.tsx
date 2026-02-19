'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, RefreshCw, Save, Rocket, Loader2, X, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  listPropostasFilaAdmin,
  updatePropostaFilaStatus,
  type PropostaFilaItem,
  type PropostaFilaStatus,
} from '@/app/actions/propostas-fila';
import {
  PROPOSTA_FILA_STATUS,
  PROPOSTA_FILA_STATUS_BADGE_CLASS,
  PROPOSTA_FILA_STATUS_LABELS,
} from '@/lib/propostas-fila-status';
import { criarProducaoFromFila, getOperadorasParaSelect } from '@/app/actions/producao-integrada';

type StatusFilter = PropostaFilaStatus | 'todas';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

export default function PropostasFilaAdminPage() {
  const [items, setItems] = useState<PropostaFilaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, PropostaFilaStatus>>({});
  const [obsDrafts, setObsDrafts] = useState<Record<string, string>>({});

  // Implantação modal state
  const [implantarItem, setImplantarItem] = useState<PropostaFilaItem | null>(null);
  const [implantarForm, setImplantarForm] = useState({
    valor_mensalidade: '',
    percentual_comissao: '100',
    numero_parcelas: '12',
    modalidade: '',
    operadora_id: '',
    subproduto: '',
    observacoes: '',
  });
  const [savingImplantar, setSavingImplantar] = useState(false);
  const [operadoras, setOperadoras] = useState<{ id: string; nome: string }[]>([]);

  const loadItems = useCallback(async () => {
    setLoading(true);

    const result = await listPropostasFilaAdmin();
    if (result.success && result.data) {
      setItems(result.data);
      setStatusDrafts((prev) => {
        const next: Record<string, PropostaFilaStatus> = { ...prev };
        result.data?.forEach((item) => {
          next[item.id] = item.status;
        });
        return next;
      });
      setObsDrafts((prev) => {
        const next: Record<string, string> = { ...prev };
        result.data?.forEach((item) => {
          if (next[item.id] === undefined) {
            next[item.id] = item.status_observacao || '';
          }
        });
        return next;
      });
    } else if (result.error) {
      toast.error('Não foi possível carregar a fila de propostas.', {
        description: result.error,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadItems]);

  // Load operadoras for implantation modal
  useEffect(() => {
    getOperadorasParaSelect().then((res) => {
      if (res.success) setOperadoras(res.data || []);
    });
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'todas' && item.status !== statusFilter) return false;

      if (!normalizedSearch) return true;

      const leadName = item.lead?.nome?.toLowerCase() || '';
      const leadPhone = item.lead?.whatsapp?.toLowerCase() || '';
      const corretorName = item.corretor?.nome?.toLowerCase() || '';
      const category = item.categoria?.toLowerCase() || '';

      return (
        leadName.includes(normalizedSearch) ||
        leadPhone.includes(normalizedSearch) ||
        corretorName.includes(normalizedSearch) ||
        category.includes(normalizedSearch)
      );
    });
  }, [items, search, statusFilter]);

  const handleSaveStatus = useCallback(
    async (itemId: string) => {
      const status = statusDrafts[itemId];
      if (!status) return;

      // If changing to implantada, open the implantation modal instead
      if (status === 'implantada') {
        const item = items.find(i => i.id === itemId);
        if (item) {
          setImplantarItem(item);
          setImplantarForm({
            valor_mensalidade: '',
            percentual_comissao: '100',
            numero_parcelas: '12',
            modalidade: item.categoria || '',
            operadora_id: '',
            subproduto: '',
            observacoes: obsDrafts[itemId] || '',
          });
        }
        return;
      }

      setUpdatingId(itemId);
      const result = await updatePropostaFilaStatus({
        fila_id: itemId,
        status,
        observacao: obsDrafts[itemId] || null,
      });

      if (result.success && result.data) {
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? result.data || item : item)),
        );
        toast.success('Status da proposta atualizado.');
      } else {
        toast.error('Falha ao atualizar status.', {
          description: result.error || 'Erro desconhecido.',
        });
      }

      setUpdatingId(null);
    },
    [items, obsDrafts, statusDrafts],
  );

  const handleImplantar = async () => {
    if (!implantarItem) return;
    if (!implantarForm.valor_mensalidade) {
      toast.error('Informe o valor da mensalidade');
      return;
    }

    setSavingImplantar(true);

    // 1. Update status to implantada
    const statusResult = await updatePropostaFilaStatus({
      fila_id: implantarItem.id,
      status: 'implantada',
      observacao: implantarForm.observacoes || null,
    });

    if (!statusResult.success) {
      toast.error('Erro ao atualizar status', { description: statusResult.error });
      setSavingImplantar(false);
      return;
    }

    // 2. Create production + commissions
    const prodResult = await criarProducaoFromFila({
      fila_id: implantarItem.id,
      operadora_id: implantarForm.operadora_id || undefined,
      valor_mensalidade: parseFloat(implantarForm.valor_mensalidade),
      modalidade: implantarForm.modalidade || undefined,
      subproduto: implantarForm.subproduto || undefined,
      percentual_comissao: parseFloat(implantarForm.percentual_comissao) || 100,
      numero_parcelas: parseInt(implantarForm.numero_parcelas) || 12,
      observacoes: implantarForm.observacoes || undefined,
    });

    setSavingImplantar(false);

    if (prodResult.success) {
      toast.success('🎉 Proposta implantada! Produção e comissões geradas automaticamente.', {
        description: 'O corretor já pode ver no painel dele.',
        duration: 5000,
      });
      setImplantarItem(null);
      void loadItems();
    } else {
      // Still update the items list since status was changed
      if (statusResult.data) {
        setItems((prev) =>
          prev.map((item) => (item.id === implantarItem.id ? statusResult.data || item : item)),
        );
      }
      toast.warning('Status atualizado, mas erro ao gerar produção.', {
        description: prodResult.error,
      });
      setImplantarItem(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Fila de propostas</h1>
          <p className="mt-1 text-sm text-white/60">
            Propostas recebidas dos corretores para envio e acompanhamento com operadora.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-black/30 text-white hover:bg-black/50"
          onClick={() => {
            void loadItems();
          }}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card data-tour="admin-fila-filtros" className="border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-4 w-4 text-[#D4AF37]" />
            Filtros
          </CardTitle>
          <CardDescription className="text-white/60">
            Refine por status, corretor ou lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-white/75">Buscar</Label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Lead, telefone, corretor ou categoria"
              className="border-white/20 bg-black/40 text-white placeholder:text-white/45"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-white/75">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="border-white/20 bg-black/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/20 bg-[#0a0a0a] text-white">
                <SelectItem value="todas">Todas</SelectItem>
                {PROPOSTA_FILA_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PROPOSTA_FILA_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card data-tour="admin-fila-lista" className="border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white">Itens da fila</CardTitle>
          <CardDescription className="text-white/60">
            {filteredItems.length} proposta(s) filtrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-white/55">Carregando propostas...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-white/55">Nenhuma proposta encontrada com os filtros atuais.</p>
          ) : (
            filteredItems.map((item) => {
              const draftStatus = statusDrafts[item.id] || item.status;
              const isUpdating = updatingId === item.id;

              return (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {item.lead?.nome || 'Lead sem nome'}
                      </p>
                      <p className="text-xs text-white/50">
                        {item.lead?.whatsapp || 'Sem telefone'} · Corretor: {item.corretor?.nome || 'Não informado'}
                      </p>
                      <p className="text-xs text-white/45">
                        Categoria: {item.categoria || 'Não informada'} · Recebida em {formatDate(item.created_at)}
                      </p>
                    </div>

                    <Badge variant="outline" className={PROPOSTA_FILA_STATUS_BADGE_CLASS[item.status]}>
                      {PROPOSTA_FILA_STATUS_LABELS[item.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-white/65">Atualizar status</Label>
                      <Select
                        value={draftStatus}
                        onValueChange={(value) => {
                          setStatusDrafts((prev) => ({
                            ...prev,
                            [item.id]: value as PropostaFilaStatus,
                          }));
                        }}
                      >
                        <SelectTrigger className="border-white/20 bg-black/40 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/20 bg-[#0a0a0a] text-white">
                          {PROPOSTA_FILA_STATUS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {PROPOSTA_FILA_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs text-white/65">Observação operacional</Label>
                      <Input
                        value={obsDrafts[item.id] || ''}
                        onChange={(event) => {
                          setObsDrafts((prev) => ({
                            ...prev,
                            [item.id]: event.target.value,
                          }));
                        }}
                        placeholder="Ex: aguardando retorno da operadora"
                        className="border-white/20 bg-black/40 text-white placeholder:text-white/45"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-white/60 md:grid-cols-4">
                    <p>Enviada: {formatDate(item.enviada_operadora_em)}</p>
                    <p>Análise: {formatDate(item.em_analise_em)}</p>
                    <p>Boleto: {formatDate(item.boleto_gerado_em)}</p>
                    <p>Implantada: {formatDate(item.implantada_em)}</p>
                  </div>

                  <div className="flex justify-end gap-2">
                    {item.status !== 'implantada' && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                        onClick={() => {
                          setImplantarItem(item);
                          setImplantarForm({
                            valor_mensalidade: '',
                            percentual_comissao: '100',
                            numero_parcelas: '12',
                            modalidade: item.categoria || '',
                            operadora_id: '',
                            subproduto: '',
                            observacoes: obsDrafts[item.id] || '',
                          });
                        }}
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Implantar
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() => {
                        void handleSaveStatus(item.id);
                      }}
                      disabled={isUpdating}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isUpdating ? 'Salvando...' : 'Salvar status'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ===== MODAL DE IMPLANTAÇÃO ===== */}
      {implantarItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setImplantarItem(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-green-400" />
                    Implantar Proposta
                  </h2>
                  <p className="text-sm text-white/40 mt-1">
                    {implantarItem.lead?.nome || 'Lead'} — {implantarItem.corretor?.nome || 'Corretor'}
                  </p>
                </div>
                <button onClick={() => setImplantarItem(null)} className="p-2 rounded-lg hover:bg-white/10 text-white/50">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                <p className="text-xs text-green-400">
                  Ao implantar, será criada automaticamente uma <strong>Produção</strong> para o corretor com <strong>parcelas de comissão</strong> calculadas conforme os valores informados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Valor Mensalidade (R$) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="number"
                      step="0.01"
                      value={implantarForm.valor_mensalidade}
                      onChange={(e) => setImplantarForm(f => ({ ...f, valor_mensalidade: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/40"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">% Comissão (1ª parcela)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={implantarForm.percentual_comissao}
                    onChange={(e) => setImplantarForm(f => ({ ...f, percentual_comissao: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-green-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Nº Parcelas</label>
                  <input
                    type="number"
                    value={implantarForm.numero_parcelas}
                    onChange={(e) => setImplantarForm(f => ({ ...f, numero_parcelas: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-green-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Modalidade</label>
                  <select
                    value={implantarForm.modalidade}
                    onChange={(e) => setImplantarForm(f => ({ ...f, modalidade: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-green-500/40"
                  >
                    <option value="">Selecione...</option>
                    <option value="Individual">Individual</option>
                    <option value="Familiar">Familiar</option>
                    <option value="PME">PME</option>
                    <option value="Adesão">Adesão</option>
                    <option value="Individual Odonto">Individual Odonto</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Operadora</label>
                  <select
                    value={implantarForm.operadora_id}
                    onChange={(e) => setImplantarForm(f => ({ ...f, operadora_id: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-green-500/40"
                  >
                    <option value="">Selecione...</option>
                    {operadoras.map(o => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Subproduto</label>
                  <input
                    type="text"
                    value={implantarForm.subproduto}
                    onChange={(e) => setImplantarForm(f => ({ ...f, subproduto: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/40"
                    placeholder="Ex: Unimed Básico"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/50 mb-1 block">Observações</label>
                  <textarea
                    value={implantarForm.observacoes}
                    onChange={(e) => setImplantarForm(f => ({ ...f, observacoes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/40 resize-none"
                    placeholder="Observações..."
                  />
                </div>
              </div>

              {/* Preview */}
              {implantarForm.valor_mensalidade && (
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-3">
                  <p className="text-xs text-[#D4AF37] font-semibold mb-2">Prévia do Cálculo de Comissão</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-white/40">1ª Parcela</p>
                      <p className="text-sm font-bold text-[#D4AF37]">
                        R$ {(parseFloat(implantarForm.valor_mensalidade) * (parseFloat(implantarForm.percentual_comissao) || 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Recorrente (30%)</p>
                      <p className="text-sm font-bold text-white/70">
                        R$ {(parseFloat(implantarForm.valor_mensalidade) * 0.3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40">Total Estimado</p>
                      <p className="text-sm font-bold text-purple-400">
                        R$ {(
                          parseFloat(implantarForm.valor_mensalidade) * (parseFloat(implantarForm.percentual_comissao) || 100) / 100 +
                          parseFloat(implantarForm.valor_mensalidade) * 0.3 * ((parseInt(implantarForm.numero_parcelas) || 12) - 1)
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setImplantarItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImplantar}
                  disabled={savingImplantar || !implantarForm.valor_mensalidade}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingImplantar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  Implantar e Gerar Comissões
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
