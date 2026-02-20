'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  Eye,
  MousePointerClick,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import type {
  EmailLog,
  EmailEvent,
  EmailStats,
  EmailStatus,
  ListEmailsResponse,
} from '@/lib/types/email';

// ─── Status Badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    queued: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    delivered: 'bg-emerald-500/20 text-emerald-400',
    opened: 'bg-green-500/20 text-green-400',
    clicked: 'bg-[#D4AF37]/20 text-[#D4AF37]',
    bounced: 'bg-red-500/20 text-red-400',
    complained: 'bg-orange-500/20 text-orange-400',
    failed: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || colors.queued}`}>
      {status}
    </span>
  );
}

// ─── Event icon ──────────────────────────────────────────────
function getEventIcon(type: string) {
  const icons: Record<string, string> = {
    sent: '📤', delivered: '✅', delivery_delayed: '⏳', opened: '👁️',
    clicked: '🔗', bounced: '🔴', complained: '⚠️', unsubscribed: '🚫',
  };
  return icons[type] || '📧';
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5 hover:border-white/20 transition-colors">
      <Icon className={`h-5 w-5 ${color} mb-2`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
      {subValue && <p className="text-xs text-[#D4AF37] mt-1">{subValue}</p>}
    </div>
  );
}

export default function EmailAdminPage() {
  // ─── State ─────────────────────────────────────────────────
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | ''>('');
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>([]);
  const [modalTab, setModalTab] = useState<'info' | 'preview' | 'timeline'>('info');
  const [resending, setResending] = useState(false);

  // ─── Fetch stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/emails?action=stats', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Falha ao buscar estatísticas (${res.status})`);
      }
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch email stats:', err);
    }
  }, []);

  // ─── Fetch emails ──────────────────────────────────────────
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/emails?${params}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Falha ao buscar emails (${res.status})`);
      }
      const json = await res.json();
      if (json.success) {
        const data = json.data as ListEmailsResponse;
        setEmails(data.emails);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        setEmails([]);
        setErrorMessage(json.error || 'Não foi possível carregar os emails de tracking.');
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      setEmails([]);
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado ao carregar emails.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // ─── Fetch events for modal ────────────────────────────────
  const fetchEvents = useCallback(async (emailId: string) => {
    try {
      const res = await fetch(`/api/admin/emails/${emailId}/events`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setEmailEvents(json.data);
      } else {
        setEmailEvents([]);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEmailEvents([]);
    }
  }, []);

  // ─── Initial load ──────────────────────────────────────────
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  // ─── Open detail modal ─────────────────────────────────────
  const openDetail = async (email: EmailLog) => {
    setSelectedEmail(email);
    setModalTab('info');
    setEmailEvents([]);
    await fetchEvents(email.id);
  };

  // ─── Force resend ──────────────────────────────────────────
  const handleResend = async () => {
    if (!selectedEmail) return;
    setResending(true);
    try {
      const res = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailLogId: selectedEmail.id, forceResend: true }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Email reenviado com sucesso!');
        setSelectedEmail(null);
        fetchEmails();
        fetchStats();
      } else {
        alert(`Erro: ${json.error}`);
      }
    } catch {
      alert('Erro ao reenviar email');
    } finally {
      setResending(false);
    }
  };

  // ─── Search handler ────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmails();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            EMAIL TRACKING
          </h1>
          <p className="mt-2 text-gray-400">Monitoramento de emails transacionais — Resend + Tracking</p>
        </div>
        <button
          onClick={() => { fetchEmails(); fetchStats(); }}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-white/30 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard icon={Send} label="Enviados (30d)" value={stats?.total_sent ?? 0} color="text-blue-400" />
        <StatCard icon={CheckCircle} label="Entregues" value={stats?.total_delivered ?? 0} subValue={stats?.delivery_rate ? `${stats.delivery_rate}%` : undefined} color="text-emerald-400" />
        <StatCard icon={Eye} label="Abertos" value={stats?.total_opened ?? 0} subValue={stats?.open_rate ? `${stats.open_rate}%` : undefined} color="text-green-400" />
        <StatCard icon={MousePointerClick} label="Clicados" value={stats?.total_clicked ?? 0} subValue={stats?.click_rate ? `${stats.click_rate}%` : undefined} color="text-[#D4AF37]" />
        <StatCard icon={XCircle} label="Bounced" value={stats?.total_bounced ?? 0} subValue={stats?.bounce_rate ? `${stats.bounce_rate}%` : undefined} color="text-red-400" />
        <StatCard icon={AlertTriangle} label="Complained" value={stats?.total_complained ?? 0} color="text-orange-400" />
        <StatCard icon={XCircle} label="Falharam" value={stats?.total_failed ?? 0} color="text-red-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email ou assunto..."
              className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
        </form>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as EmailStatus | ''); setPage(1); }}
            className="appearance-none rounded-lg border border-white/10 bg-[#0a0a0a] pl-10 pr-8 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Email Table */}
      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                <th className="px-4 py-3 font-medium">Destinatário</th>
                <th className="px-4 py-3 font-medium">Assunto</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">📖</th>
                <th className="px-4 py-3 font-medium text-center">🔗</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Carregando...
                    </div>
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Inbox className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    Nenhum email encontrado
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr
                    key={email.id}
                    onClick={() => openDetail(email)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm truncate max-w-[200px]">{email.to_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-300 truncate max-w-[250px]">{email.subject}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 text-xs">{email.template_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={email.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-300 text-xs">{email.opened_count || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-300 text-xs">{email.clicked_count || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(email.created_at).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <p className="text-xs text-gray-400">
              Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─────────────────────────────────────── */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{selectedEmail.subject}</p>
                  <p className="text-gray-400 text-xs truncate">{selectedEmail.to_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={selectedEmail.status} />
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="ml-2 rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/10 px-6">
              {(['info', 'preview', 'timeline'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setModalTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === t
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'info' ? 'Informações' : t === 'preview' ? 'Preview HTML' : 'Timeline'}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Info Tab */}
              {modalTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'De', value: selectedEmail.from_email },
                      { label: 'Para', value: selectedEmail.to_email },
                      { label: 'Resend ID', value: selectedEmail.resend_id || '—' },
                      { label: 'Template', value: selectedEmail.template_name || '—' },
                      { label: 'Tipo', value: selectedEmail.email_type },
                      { label: 'Categoria', value: selectedEmail.category || '—' },
                      { label: 'Disparado por', value: selectedEmail.triggered_by || '—' },
                      { label: 'Referência', value: selectedEmail.reference_type ? `${selectedEmail.reference_type}:${selectedEmail.reference_id}` : '—' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-white text-sm truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Delivery metrics */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedEmail.opened_count}</p>
                      <p className="text-[10px] text-gray-500">Aberturas</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-lg font-bold text-white">{selectedEmail.clicked_count}</p>
                      <p className="text-[10px] text-gray-500">Cliques</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-lg font-bold text-white">
                        {selectedEmail.delivered_at ? new Date(selectedEmail.delivered_at).toLocaleTimeString('pt-BR') : '—'}
                      </p>
                      <p className="text-[10px] text-gray-500">Entregue em</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                      <p className="text-lg font-bold text-white">
                        {selectedEmail.first_opened_at ? new Date(selectedEmail.first_opened_at).toLocaleTimeString('pt-BR') : '—'}
                      </p>
                      <p className="text-[10px] text-gray-500">Primeira abertura</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedEmail.tags && selectedEmail.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedEmail.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Error info */}
                  {selectedEmail.error_message && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mt-4">
                      <p className="text-red-400 text-sm font-medium mb-1">Erro</p>
                      <p className="text-red-300 text-xs">{selectedEmail.error_message}</p>
                      {selectedEmail.bounce_type && (
                        <p className="text-red-400 text-xs mt-1">Bounce: {selectedEmail.bounce_type}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Preview Tab */}
              {modalTab === 'preview' && (
                <div>
                  {selectedEmail.html_content ? (
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <div className="bg-white">
                        <iframe
                          srcDoc={selectedEmail.html_content}
                          className="w-full min-h-[500px] border-0"
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Mail className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <p>Preview não disponível — HTML não foi salvo</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {modalTab === 'timeline' && (
                <div>
                  {emailEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <p>Nenhum evento registrado ainda</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                      <div className="space-y-4">
                        {emailEvents.map((event) => (
                          <div key={event.id} className="relative flex items-start gap-4 pl-10">
                            <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0A0A0A] border border-white/20 text-xs">
                              {getEventIcon(event.event_type)}
                            </div>
                            <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-3">
                              <div className="flex items-center justify-between">
                                <p className="text-white text-sm font-medium capitalize">{event.event_type.replace('_', ' ')}</p>
                                <p className="text-gray-500 text-xs">
                                  {new Date(event.occurred_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              {event.click_url && (
                                <p className="text-[#D4AF37] text-xs mt-1 flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  <span className="truncate">{event.click_url}</span>
                                </p>
                              )}
                              {event.device_type && (
                                <p className="text-gray-500 text-xs mt-1">
                                  {event.device_type} · {event.os} · {event.browser}
                                </p>
                              )}
                              {event.ip_address && event.ip_address !== 'unknown' && (
                                <p className="text-gray-600 text-xs mt-0.5">IP: {event.ip_address}</p>
                              )}
                              {event.bounce_message && (
                                <p className="text-red-400 text-xs mt-1">
                                  {event.bounce_type}: {event.bounce_message}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
              <p className="text-xs text-gray-500">
                Log ID: <code className="text-gray-400">{selectedEmail.id}</code>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F6E05E] transition-colors disabled:opacity-50"
                >
                  {resending ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Reenviando...</>
                  ) : (
                    <><RotateCcw className="h-4 w-4" /> Reenviar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
