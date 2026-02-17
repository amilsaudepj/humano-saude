'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  Layers,
  RefreshCw,
  Settings2,
  UsersRound,
  Zap,
} from 'lucide-react';

type AlertState = {
  kind: 'success' | 'error';
  text: string;
};

type AudienceType = 'custom' | 'lookalike' | 'saved';

interface ApiBaseResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

interface AudienceRow {
  id: string;
  name: string;
  description: string | null;
  audience_type: AudienceType;
  subtype: string | null;
  status: string;
  approximate_count: number;
  auto_sync: boolean;
  sync_frequency_hours: number;
  last_synced_at: string | null;
  meta_status?: string | null;
  lookalike_spec?: {
    country?: string;
    ratio?: number;
    starting_ratio?: number;
  } | null;
}

interface AudienceListResponse extends ApiBaseResponse {
  total: number;
  audiences: AudienceRow[];
}

interface SyncLogRow {
  id: string;
  audience_id: string;
  users_added: number;
  users_failed: number;
  batch_count: number;
  status: 'success' | 'partial' | 'failed';
  error_message: string | null;
  duration_seconds: number | null;
  triggered_by: string | null;
  created_at: string;
  audiences?: { name: string } | null;
}

interface SyncOverviewResponse extends ApiBaseResponse {
  totalAudiences: number;
  autoSyncAudiences: number;
  pendingUsers: number;
  lastSyncAt: string | null;
  recentLogs: SyncLogRow[];
}

interface LookalikeSource {
  id: string;
  name: string;
  approximate_count: number;
  status: string;
  audience_type: string;
}

interface LookalikeSourcesResponse extends ApiBaseResponse {
  totalSources: number;
  sources: LookalikeSource[];
}

interface CreateAudienceForm {
  name: string;
  description: string;
  subtype: 'customer_list' | 'website' | 'app' | 'offline' | 'engagement';
  autoSync: boolean;
  frequencyHours: string;
}

interface CreateLookalikeForm {
  sourceAudienceId: string;
  country: string;
  ratio: string;
  startingRatio: string;
  name: string;
  description: string;
}

function extractError(payload: ApiBaseResponse, fallback: string): string {
  return payload.error || payload.message || fallback;
}

function formatDate(value: string | null): string {
  if (!value) return 'Sem histórico';
  return new Date(value).toLocaleString('pt-BR');
}

function audienceTypeLabel(value: AudienceType): string {
  if (value === 'custom') return 'Custom';
  if (value === 'lookalike') return 'Lookalike';
  return 'Saved';
}

function statusBadge(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'ready' || normalized === 'success') {
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  }
  if (normalized === 'partial' || normalized === 'populating' || normalized === 'pending') {
    return 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30';
  }
  if (normalized === 'failed' || normalized === 'error' || normalized === 'deleted') {
    return 'bg-red-500/15 text-red-300 border border-red-500/30';
  }
  return 'bg-white/10 text-gray-300 border border-white/10';
}

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<AudienceRow[]>([]);
  const [sources, setSources] = useState<LookalikeSource[]>([]);
  const [overview, setOverview] = useState<SyncOverviewResponse>({
    success: true,
    totalAudiences: 0,
    autoSyncAudiences: 0,
    pendingUsers: 0,
    lastSyncAt: null,
    recentLogs: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingAudienceId, setSyncingAudienceId] = useState<string | null>(null);
  const [togglingAudienceId, setTogglingAudienceId] = useState<string | null>(null);
  const [deletingAudienceId, setDeletingAudienceId] = useState<string | null>(null);
  const [submittingAudience, setSubmittingAudience] = useState(false);
  const [submittingLookalike, setSubmittingLookalike] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const [createForm, setCreateForm] = useState<CreateAudienceForm>({
    name: '',
    description: '',
    subtype: 'customer_list',
    autoSync: true,
    frequencyHours: '4',
  });

  const [lookalikeForm, setLookalikeForm] = useState<CreateLookalikeForm>({
    sourceAudienceId: '',
    country: 'BR',
    ratio: '0.01',
    startingRatio: '',
    name: '',
    description: '',
  });

  const counters = useMemo(() => {
    return audiences.reduce(
      (acc, item) => {
        if (item.audience_type === 'custom') acc.custom += 1;
        if (item.audience_type === 'lookalike') acc.lookalike += 1;
        if (item.audience_type === 'saved') acc.saved += 1;
        return acc;
      },
      { custom: 0, lookalike: 0, saved: 0 }
    );
  }, [audiences]);

  const loadData = async (softRefresh: boolean) => {
    if (softRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [audiencesRes, syncRes, sourcesRes] = await Promise.all([
        fetch('/api/audiences?limit=300&withMeta=1', { cache: 'no-store' }),
        fetch('/api/audiences/sync', { cache: 'no-store' }),
        fetch('/api/audiences/lookalike', { cache: 'no-store' }),
      ]);

      const audiencesJson = (await audiencesRes.json().catch(() => ({}))) as AudienceListResponse;
      const syncJson = (await syncRes.json().catch(() => ({}))) as SyncOverviewResponse;
      const sourcesJson = (await sourcesRes.json().catch(() => ({}))) as LookalikeSourcesResponse;

      if (!audiencesRes.ok || !audiencesJson.success) {
        throw new Error(extractError(audiencesJson, 'Falha ao carregar públicos'));
      }
      if (!syncRes.ok || !syncJson.success) {
        throw new Error(extractError(syncJson, 'Falha ao carregar sync de públicos'));
      }
      if (!sourcesRes.ok || !sourcesJson.success) {
        throw new Error(extractError(sourcesJson, 'Falha ao carregar fontes de lookalike'));
      }

      setAudiences(Array.isArray(audiencesJson.audiences) ? audiencesJson.audiences : []);
      setOverview({
        success: true,
        totalAudiences: Number(syncJson.totalAudiences || 0),
        autoSyncAudiences: Number(syncJson.autoSyncAudiences || 0),
        pendingUsers: Number(syncJson.pendingUsers || 0),
        lastSyncAt: syncJson.lastSyncAt || null,
        recentLogs: Array.isArray(syncJson.recentLogs) ? syncJson.recentLogs : [],
      });
      setSources(Array.isArray(sourcesJson.sources) ? sourcesJson.sources : []);
    } catch (error) {
      setAlert({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Erro ao carregar módulo de públicos',
      });
    } finally {
      if (softRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData(false);
  }, []);

  const handleCreateAudience = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    if (createForm.name.trim().length < 3) {
      setAlert({ kind: 'error', text: 'Informe um nome válido para o público.' });
      return;
    }

    const frequency = Math.max(1, Number(createForm.frequencyHours || '4'));
    setSubmittingAudience(true);
    try {
      const response = await fetch('/api/audiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          name: createForm.name.trim(),
          description: createForm.description.trim() || undefined,
          subtype: createForm.subtype,
          auto_sync: createForm.autoSync,
          sync_frequency_hours: frequency,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as ApiBaseResponse;
      if (!response.ok || !json.success) {
        throw new Error(extractError(json, 'Falha ao criar público'));
      }

      setCreateForm({
        name: '',
        description: '',
        subtype: createForm.subtype,
        autoSync: createForm.autoSync,
        frequencyHours: String(frequency),
      });

      setAlert({ kind: 'success', text: 'Público criado com sucesso.' });
      await loadData(true);
    } catch (error) {
      setAlert({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Erro ao criar público',
      });
    } finally {
      setSubmittingAudience(false);
    }
  };

  const handleCreateLookalike = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAlert(null);

    const ratio = Number(lookalikeForm.ratio);
    const startingRatio = lookalikeForm.startingRatio ? Number(lookalikeForm.startingRatio) : undefined;

    if (!lookalikeForm.sourceAudienceId) {
      setAlert({ kind: 'error', text: 'Selecione o público de origem.' });
      return;
    }
    if (!Number.isFinite(ratio) || ratio < 0.01 || ratio > 0.1) {
      setAlert({ kind: 'error', text: 'A razão do lookalike deve ficar entre 0.01 e 0.10.' });
      return;
    }
    if (
      startingRatio !== undefined &&
      (!Number.isFinite(startingRatio) || startingRatio < 0.01 || startingRatio > 0.1)
    ) {
      setAlert({ kind: 'error', text: 'Starting ratio deve ficar entre 0.01 e 0.10.' });
      return;
    }

    setSubmittingLookalike(true);
    try {
      const response = await fetch('/api/audiences/lookalike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceAudienceId: lookalikeForm.sourceAudienceId,
          country: lookalikeForm.country.toUpperCase(),
          ratio,
          startingRatio,
          name: lookalikeForm.name.trim() || undefined,
          description: lookalikeForm.description.trim() || undefined,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as ApiBaseResponse;
      if (!response.ok || !json.success) {
        throw new Error(extractError(json, 'Falha ao criar lookalike'));
      }

      setLookalikeForm((prev) => ({
        ...prev,
        ratio: '0.01',
        startingRatio: '',
        name: '',
        description: '',
      }));
      setAlert({ kind: 'success', text: 'Lookalike criado com sucesso.' });
      await loadData(true);
    } catch (error) {
      setAlert({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Erro ao criar lookalike',
      });
    } finally {
      setSubmittingLookalike(false);
    }
  };

  const handleSyncAll = async () => {
    setAlert(null);
    setSyncingAll(true);
    try {
      const response = await fetch('/api/audiences/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = (await response.json().catch(() => ({}))) as ApiBaseResponse & {
        synced?: number;
        partial?: number;
        failed?: number;
      };

      if (!response.ok || json.success === false) {
        throw new Error(extractError(json, 'Falha ao sincronizar públicos'));
      }

      setAlert({
        kind: 'success',
        text: `Sync concluído: ${json.synced || 0} sucesso, ${json.partial || 0} parcial, ${json.failed || 0} falhas.`,
      });
      await loadData(true);
    } catch (error) {
      setAlert({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Erro ao sincronizar públicos',
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncAudience = async (audienceId: string) => {
    setAlert(null);
    setSyncingAudienceId(audienceId);
    try {
      const response = await fetch('/api/audiences/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceId }),
      });

      const json = (await response.json().catch(() => ({}))) as ApiBaseResponse & {
        result?: {
          success: boolean;
          users_added: number;
          users_failed: number;
          errors?: Array<{ error: string }>;
        };
      };

      if (!response.ok || json.success === false || !json.result) {
        throw new Error(extractError(json, 'Falha ao sincronizar público'));
      }

      if (!json.result.success) {
        throw new Error(json.result.errors?.[0]?.error || 'Sincronização retornou erro');
      }

      setAlert({
        kind: 'success',
        text: `Público sincronizado: +${json.result.users_added} usuários, ${json.result.users_failed} inválidos.`,
      });
      await loadData(true);
    } catch (error) {
      setAlert({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Erro ao sincronizar público',
      });
    } finally {
      setSyncingAudienceId(null);
    }
  };

  const handleToggleAutoSync = async (audience: AudienceRow) => {
    setAlert(null);
    setTogglingAudienceId(audience.id);
    try {
      const response = await fetch(`/api/audiences/${audience.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_sync: !audience.auto_sync }),
      });

      const json = (await response.json().catch(() => ({}))) as ApiBaseResponse;
      if (!response.ok || json.success === false) {
        throw new Error(extractError(json, 'Falha ao atualizar auto-sync'));
      }

      setAlert({
        kind: 'success',
        text: `Auto-sync ${audience.auto_sync ? 'desativado' : 'ativado'} para ${audience.name}.`,
      });
      await loadData(true);
    } catch (error) {
      setAlert({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Erro ao atualizar auto-sync',
      });
    } finally {
      setTogglingAudienceId(null);
    }
  };

  const handleDeleteAudience = async (audience: AudienceRow) => {
    const confirmed = window.confirm(`Excluir o público "${audience.name}"?`);
    if (!confirmed) return;

    setAlert(null);
    setDeletingAudienceId(audience.id);
    try {
      const response = await fetch(`/api/audiences/${audience.id}`, { method: 'DELETE' });
      const json = (await response.json().catch(() => ({}))) as ApiBaseResponse;
      if (!response.ok || json.success === false) {
        throw new Error(extractError(json, 'Falha ao excluir público'));
      }

      setAlert({ kind: 'success', text: `Público "${audience.name}" removido.` });
      await loadData(true);
    } catch (error) {
      setAlert({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Erro ao excluir público',
      });
    } finally {
      setDeletingAudienceId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1
          className="text-4xl font-bold text-[#D4AF37] flex items-center gap-3"
          style={{ fontFamily: 'Perpetua Titling MT, serif' }}
        >
          <UsersRound className="h-9 w-9" />
          PÚBLICOS IA
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-400">Custom audiences, lookalikes e sincronização CRM para Meta.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                void loadData(true);
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <DatabaseZap className={`h-4 w-4 ${syncingAll ? 'animate-pulse' : ''}`} />
              {syncingAll ? 'Sincronizando...' : 'Sync Geral'}
            </button>
          </div>
        </div>
      </div>

      {alert && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
            alert.kind === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {alert.kind === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {alert.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
          <p className="text-xs text-gray-500">Públicos totais</p>
          <p className="mt-1 text-2xl font-bold text-white">{overview.totalAudiences}</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs text-blue-300">Custom</p>
          <p className="mt-1 text-2xl font-bold text-blue-300">{counters.custom}</p>
        </div>
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
          <p className="text-xs text-purple-300">Lookalike</p>
          <p className="mt-1 text-2xl font-bold text-purple-300">{counters.lookalike}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-300">Auto-sync ativos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{overview.autoSyncAudiences}</p>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-xs text-yellow-300">Usuários pendentes</p>
          <p className="mt-1 text-2xl font-bold text-yellow-300">{overview.pendingUsers}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
          <p className="text-xs text-gray-500">Último sync</p>
          <p className="mt-1 text-xs font-semibold text-white">{formatDate(overview.lastSyncAt)}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form onSubmit={handleCreateAudience} className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Criar Custom Audience
          </h3>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Nome</label>
            <input
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ex.: Leads Quentes CRM"
              className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Descrição</label>
            <textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Descrição opcional do público"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Subtype</label>
              <select
                value={createForm.subtype}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    subtype: event.target.value as CreateAudienceForm['subtype'],
                  }))
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              >
                <option value="customer_list">Customer List</option>
                <option value="website">Website</option>
                <option value="app">App</option>
                <option value="offline">Offline</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Frequência (h)</label>
              <input
                type="number"
                min={1}
                max={168}
                value={createForm.frequencyHours}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, frequencyHours: event.target.value }))}
                disabled={!createForm.autoSync}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none disabled:opacity-50 focus:border-[#D4AF37]/50"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={createForm.autoSync}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, autoSync: event.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-black/40"
            />
            Ativar auto-sync
          </label>
          <button
            type="submit"
            disabled={submittingAudience}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#bf953f] disabled:opacity-50"
          >
            <Settings2 className="h-4 w-4" />
            {submittingAudience ? 'Criando...' : 'Criar Público'}
          </button>
        </form>

        <form onSubmit={handleCreateLookalike} className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Criar Lookalike
          </h3>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Público de origem</label>
            <select
              value={lookalikeForm.sourceAudienceId}
              onChange={(event) =>
                setLookalikeForm((prev) => ({ ...prev, sourceAudienceId: event.target.value }))
              }
              className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            >
              <option value="">Selecione a origem</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name} ({Number(source.approximate_count || 0).toLocaleString('pt-BR')})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">País</label>
              <input
                maxLength={2}
                value={lookalikeForm.country}
                onChange={(event) =>
                  setLookalikeForm((prev) => ({
                    ...prev,
                    country: event.target.value.toUpperCase(),
                  }))
                }
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Ratio</label>
              <input
                type="number"
                step={0.01}
                min={0.01}
                max={0.1}
                value={lookalikeForm.ratio}
                onChange={(event) => setLookalikeForm((prev) => ({ ...prev, ratio: event.target.value }))}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Starting ratio</label>
              <input
                type="number"
                step={0.01}
                min={0.01}
                max={0.1}
                value={lookalikeForm.startingRatio}
                onChange={(event) =>
                  setLookalikeForm((prev) => ({ ...prev, startingRatio: event.target.value }))
                }
                placeholder="Opcional"
                className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Nome customizado (opcional)</label>
            <input
              value={lookalikeForm.name}
              onChange={(event) => setLookalikeForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ex.: LAL 1% Leads Quentes BR"
              className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Descrição</label>
            <textarea
              rows={2}
              value={lookalikeForm.description}
              onChange={(event) =>
                setLookalikeForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Descrição opcional"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/50"
            />
          </div>
          <button
            type="submit"
            disabled={submittingLookalike}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#bf953f] disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {submittingLookalike ? 'Criando...' : 'Criar Lookalike'}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-[#D4AF37]" />
            Públicos Cadastrados
          </h2>
          <span className="text-xs text-gray-500">{audiences.length} registros</span>
        </div>

        {audiences.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-600">
            Nenhum público encontrado. Crie seu primeiro custom audience.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="p-3 text-xs text-gray-500 font-medium">Nome</th>
                  <th className="p-3 text-xs text-gray-500 font-medium">Tipo</th>
                  <th className="p-3 text-xs text-gray-500 font-medium">Status</th>
                  <th className="p-3 text-xs text-gray-500 font-medium text-right">Tamanho</th>
                  <th className="p-3 text-xs text-gray-500 font-medium text-center">Auto-sync</th>
                  <th className="p-3 text-xs text-gray-500 font-medium">Último sync</th>
                  <th className="p-3 text-xs text-gray-500 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {audiences.map((audience) => {
                  const lookalikeLabel =
                    audience.audience_type === 'lookalike' && audience.lookalike_spec?.ratio
                      ? `${audience.lookalike_spec.country || 'BR'} ${(audience.lookalike_spec.ratio * 100).toFixed(0)}%`
                      : null;

                  return (
                    <tr key={audience.id} className="hover:bg-[#141414]">
                      <td className="p-3 align-top">
                        <p className="font-medium text-white">{audience.name}</p>
                        {audience.description && (
                          <p className="mt-1 text-xs text-gray-500">{audience.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                          <span>Subtype: {audience.subtype || 'n/a'}</span>
                          {lookalikeLabel && <span>• {lookalikeLabel}</span>}
                          {audience.meta_status && <span>• Meta: {audience.meta_status}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300">
                          {audienceTypeLabel(audience.audience_type)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${statusBadge(audience.status)}`}>
                          {audience.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-white">
                        {Number(audience.approximate_count || 0).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            audience.auto_sync
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 text-gray-400 border border-white/10'
                          }`}
                        >
                          {audience.auto_sync ? 'ativo' : 'inativo'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-400">{formatDate(audience.last_synced_at)}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              void handleSyncAudience(audience.id);
                            }}
                            disabled={syncingAudienceId === audience.id}
                            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            {syncingAudienceId === audience.id ? 'Sync...' : 'Sync'}
                          </button>
                          <button
                            onClick={() => {
                              void handleToggleAutoSync(audience);
                            }}
                            disabled={togglingAudienceId === audience.id}
                            className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-white/10 disabled:opacity-50"
                          >
                            {togglingAudienceId === audience.id
                              ? '...'
                              : audience.auto_sync
                              ? 'Desativar'
                              : 'Ativar'}
                          </button>
                          <button
                            onClick={() => {
                              void handleDeleteAudience(audience);
                            }}
                            disabled={deletingAudienceId === audience.id}
                            className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {deletingAudienceId === audience.id ? '...' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <DatabaseZap className="h-4 w-4 text-[#D4AF37]" />
            Logs Recentes de Sincronização
          </h2>
        </div>
        {overview.recentLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-600">Sem logs de sync até o momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="p-3 text-xs text-gray-500 font-medium">Data</th>
                  <th className="p-3 text-xs text-gray-500 font-medium">Público</th>
                  <th className="p-3 text-xs text-gray-500 font-medium">Status</th>
                  <th className="p-3 text-xs text-gray-500 font-medium text-right">Adicionados</th>
                  <th className="p-3 text-xs text-gray-500 font-medium text-right">Falhas</th>
                  <th className="p-3 text-xs text-gray-500 font-medium text-right">Batches</th>
                  <th className="p-3 text-xs text-gray-500 font-medium text-right">Duração</th>
                  <th className="p-3 text-xs text-gray-500 font-medium">Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {overview.recentLogs.slice(0, 12).map((log) => (
                  <tr key={log.id} className="hover:bg-[#141414]">
                    <td className="p-3 text-xs text-gray-400">{formatDate(log.created_at)}</td>
                    <td className="p-3 text-white">
                      {log.audiences?.name || `Audience ${log.audience_id.slice(0, 8)}`}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${statusBadge(log.status)}`}>
                        {log.status}
                      </span>
                      {log.error_message && (
                        <p className="mt-1 max-w-[280px] truncate text-[11px] text-red-300">
                          {log.error_message}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right text-white">{log.users_added}</td>
                    <td className="p-3 text-right text-white">{log.users_failed}</td>
                    <td className="p-3 text-right text-white">{log.batch_count}</td>
                    <td className="p-3 text-right text-white">{log.duration_seconds ?? 0}s</td>
                    <td className="p-3 text-xs text-gray-400">{log.triggered_by || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
