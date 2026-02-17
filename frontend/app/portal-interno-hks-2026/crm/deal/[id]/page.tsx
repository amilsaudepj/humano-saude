'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Sparkles, AlertTriangle, Building2, User, DollarSign,
  Calendar, Clock, Tag, Flag, Eye, EyeOff, Copy,
  FileText, Paperclip, Users, History, MessageSquare,
  ChevronRight, ExternalLink, Phone, Mail, Send, Activity, CheckCircle,
  Edit3, Save, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDealDetail } from '@/components/crm/hooks/useDealDetail';
import StageProgress from '@/components/crm/StageProgress';
import ActivityTimeline from '@/components/crm/ActivityTimeline';
import QuickActions from '@/components/crm/QuickActions';
import ChangelogView from '@/components/crm/ChangelogView';
import CommentsSection from '@/components/crm/CommentsSection';
import ClientScannerQuickPanel from '@/app/components/ClientScannerQuickPanel';
import type { CrmDealPriority, CrmActivityInsert } from '@/lib/types/crm';
import { getCorretoresList } from '@/app/actions/crm';

// ========================================
// HELPERS
// ========================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function timeAgo(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return 'agora';
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`;
  if (diffH < 48) return 'ontem';
  const days = Math.floor(diffH / 24);
  return `${days}d atrás`;
}

const PRIORITY_CONFIG: Record<CrmDealPriority, { label: string; color: string; bg: string }> = {
  baixa: { label: 'Baixa', color: 'text-white/40', bg: 'bg-white/5' },
  media: { label: 'Média', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  alta: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  urgente: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/10' },
};

// ========================================
// EDITABLE FIELD
// ========================================

function EditableField({
  label,
  value,
  type = 'text',
  options,
  onSave,
}: {
  label: string;
  value: string | number | null;
  type?: 'text' | 'number' | 'date' | 'select' | 'currency';
  options?: Array<{ value: string; label: string }>;
  onSave: (value: string | number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));

  const handleSave = () => {
    setEditing(false);
    const parsed = type === 'number' || type === 'currency' ? parseFloat(draft) || null : draft || null;
    if (parsed !== value) onSave(parsed);
  };

  if (editing) {
    if (type === 'select' && options) {
      return (
        <div className="space-y-1">
          <label className="text-[10px] text-white/30">{label}</label>
          <select value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={handleSave} autoFocus className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none">
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <label className="text-[10px] text-white/30">{label}</label>
        <input
          type={type === 'currency' ? 'number' : type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
          step={type === 'currency' ? '0.01' : undefined}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
        />
      </div>
    );
  }

  const displayValue = type === 'currency' ? formatCurrency(value as number | null) : type === 'date' ? formatDate(value as string | null) : String(value ?? '—');

  return (
    <button onClick={() => { setDraft(String(value ?? '')); setEditing(true); }} className="w-full text-left group space-y-1">
      <span className="text-[10px] text-white/30">{label}</span>
      <p className="text-xs text-white group-hover:text-[#D4AF37] transition-colors truncate">{displayValue}</p>
    </button>
  );
}

// ========================================
// SECTION WRAPPER
// ========================================

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;
  const corretorId = 'admin';
  const [corretorOptions, setCorretorOptions] = useState<Array<{ id: string; nome: string }>>([]);
  const [loadingCorretorOptions, setLoadingCorretorOptions] = useState(true);

  const {
    deal, loading, activeTab, setActiveTab,
    handleFieldUpdate, handleAddActivity,
    handleToggleFollow, handleAddComment,
    handleDeleteComment, handleTogglePinComment,
    handleDeleteAttachment,
  } = useDealDetail(dealId);

  const isFollowing = deal?.followers.some((f) => f.corretor_id === corretorId) ?? false;

  useEffect(() => {
    let active = true;

    void (async () => {
      const result = await getCorretoresList();
      if (!active) return;

      if (result.success && result.data) {
        setCorretorOptions(result.data.map((item) => ({ id: item.id, nome: item.nome })));
      } else {
        setCorretorOptions([]);
        if (result.error) {
          toast.error('Não foi possível carregar os corretores.', { description: result.error });
        }
      }
      setLoadingCorretorOptions(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading || !deal) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-8 w-64 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 h-[600px] rounded-2xl bg-white/[0.02] animate-pulse" />
          <div className="lg:col-span-6 h-[600px] rounded-2xl bg-white/[0.02] animate-pulse" />
          <div className="lg:col-span-3 h-[600px] rounded-2xl bg-white/[0.02] animate-pulse" />
        </div>
      </div>
    );
  }

  const priConfig = PRIORITY_CONFIG[deal.prioridade];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* ========== TOP HEADER ========== */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button
            onClick={() => router.push('/portal-interno-hks-2026/crm')}
            className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white/60" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {deal.stage_cor && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${deal.stage_cor}20`, color: deal.stage_cor }}>
                  {deal.stage_nome}
                </span>
              )}
              {deal.is_hot && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">
                  <Sparkles className="h-2.5 w-2.5" /> HOT
                </span>
              )}
              {deal.is_stale && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">
                  <AlertTriangle className="h-2.5 w-2.5" /> Sem atividade
                </span>
              )}
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', priConfig.bg, priConfig.color)}>
                <Flag className="h-2.5 w-2.5 inline mr-0.5" />
                {priConfig.label}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white truncate">{deal.titulo}</h1>

            <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
              {deal.valor != null && (
                <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatCurrency(deal.valor)}
                </span>
              )}
              {deal.probabilidade != null && (
                <span className="text-white/40">{deal.probabilidade}% probabilidade</span>
              )}
              {deal.score > 0 && (
                <span className={cn('flex items-center gap-1 text-xs', deal.score >= 70 ? 'text-[#D4AF37]' : deal.score >= 40 ? 'text-yellow-400' : 'text-white/40')}>
                  <Star className="h-3 w-3" /> Score: {deal.score}
                </span>
              )}
              <span className="text-xs text-white/30 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo(deal.updated_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleToggleFollow(corretorId)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all border',
              isFollowing
                ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
            )}
          >
            {isFollowing ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        </div>
      </div>

      {/* ========== STAGE PROGRESS BAR ========== */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
        <StageProgress stages={deal.stage_progress} />
      </div>

      {/* ========== 3-COLUMN LAYOUT ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Properties */}
        <div className="lg:col-span-3 space-y-4">
          {/* Deal Properties */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-4">
            <Section title="Dados do Deal" icon={Edit3}>
              <div className="space-y-3">
                <EditableField label="Valor" value={deal.valor} type="currency" onSave={(v) => handleFieldUpdate('valor', v)} />
                <EditableField label="Mensalidade" value={deal.valor_recorrente} type="currency" onSave={(v) => handleFieldUpdate('valor_recorrente', v)} />
                <EditableField label="Previsão Fechamento" value={deal.data_previsao_fechamento} type="date" onSave={(v) => handleFieldUpdate('data_previsao_fechamento', v)} />
                <EditableField
                  label="Prioridade"
                  value={deal.prioridade}
                  type="select"
                  options={[
                    { value: 'baixa', label: 'Baixa' },
                    { value: 'media', label: 'Média' },
                    { value: 'alta', label: 'Alta' },
                    { value: 'urgente', label: 'Urgente' },
                  ]}
                  onSave={(v) => handleFieldUpdate('prioridade', v)}
                />
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30">Responsável (corretor/usuário)</label>
                  <select
                    value={deal.owner_corretor_id || '__none__'}
                    onChange={(event) => {
                      const value = event.target.value;
                      void handleFieldUpdate('owner_corretor_id', value === '__none__' ? null : value);
                    }}
                    disabled={loadingCorretorOptions}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37]"
                  >
                    <option value="__none__">Sem responsável</option>
                    {corretorOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.nome}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white/35">
                    Você pode trocar ou remover a atribuição a qualquer momento.
                  </p>
                </div>
                <EditableField label="Probabilidade (%)" value={deal.probabilidade} type="number" onSave={(v) => handleFieldUpdate('probabilidade', v)} />
              </div>
            </Section>

            {/* Tags */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="text-[10px] text-white/30 flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</span>
              <div className="flex flex-wrap gap-1">
                {deal.tags.length > 0 ? deal.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/50 border border-white/10">{tag}</span>
                )) : <span className="text-[10px] text-white/20">Sem tags</span>}
              </div>
            </div>
          </div>

          {/* Contact */}
          {deal.contact && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <Section title="Contato" icon={User}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{deal.contact.nome}</p>
                      {deal.contact.cargo && <p className="text-[10px] text-white/30">{deal.contact.cargo}</p>}
                    </div>
                  </div>
                  {deal.contact.email && (
                    <a href={`mailto:${deal.contact.email}`} className="flex items-center gap-2 text-xs text-[#D4AF37] hover:text-[#F6E05E]">
                      <Mail className="h-3 w-3" /> {deal.contact.email}
                    </a>
                  )}
                  {deal.contact.telefone && (
                    <a href={`tel:${deal.contact.telefone}`} className="flex items-center gap-2 text-xs text-white/50 hover:text-white">
                      <Phone className="h-3 w-3" /> {deal.contact.telefone}
                    </a>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* Company */}
          {deal.company && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <Section title="Empresa" icon={Building2}>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-white">{deal.company.nome}</p>
                  {deal.company.cnpj && <p className="text-[10px] text-white/30">CNPJ: {deal.company.cnpj}</p>}
                </div>
              </Section>
            </div>
          )}

          {/* Followers */}
          {deal.followers.length > 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <Section title="Seguidores" icon={Users}>
                <div className="flex flex-wrap gap-1">
                  {deal.followers.map((f) => (
                    <span key={f.id} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/50">
                      {f.corretor_id.slice(0, 8)}...
                    </span>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/25">Criado em</span>
              <span className="text-white/40">{formatDate(deal.created_at)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/25">Atualizado</span>
              <span className="text-white/40">{timeAgo(deal.updated_at)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/25">Dias no estágio</span>
              <span className="text-white/40">{deal.dias_no_stage}d</span>
            </div>
          </div>
        </div>

        {/* CENTER: Timeline / Comments / Changelog */}
        <div className="lg:col-span-6 space-y-4">
          {/* Quick Actions */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
            <QuickActions
              whatsapp={deal.contact?.telefone}
              email={deal.contact?.email}
              phone={deal.contact?.telefone}
              onLogCall={() => handleAddActivity({ deal_id: deal.id, contact_id: deal.contact_id, company_id: deal.company_id, owner_corretor_id: corretorId, tipo: 'ligacao', assunto: 'Ligação registrada', descricao: null, data_vencimento: null, data_conclusao: new Date().toISOString(), duracao_minutos: null, anexo_url: null, anexo_tipo: null, resultado: null, concluida: true, metadata: {} })}
              onAddNote={() => handleAddActivity({ deal_id: deal.id, contact_id: deal.contact_id, company_id: deal.company_id, owner_corretor_id: corretorId, tipo: 'nota', assunto: 'Nova nota', descricao: null, data_vencimento: null, data_conclusao: null, duracao_minutos: null, anexo_url: null, anexo_tipo: null, resultado: null, concluida: false, metadata: {} })}
              onCreateTask={() => handleAddActivity({ deal_id: deal.id, contact_id: deal.contact_id, company_id: deal.company_id, owner_corretor_id: corretorId, tipo: 'tarefa', assunto: 'Nova tarefa', descricao: null, data_vencimento: null, data_conclusao: null, duracao_minutos: null, anexo_url: null, anexo_tipo: null, resultado: null, concluida: false, metadata: {} })}
              onScheduleMeeting={() => handleAddActivity({ deal_id: deal.id, contact_id: deal.contact_id, company_id: deal.company_id, owner_corretor_id: corretorId, tipo: 'reuniao', assunto: 'Reunião agendada', descricao: null, data_vencimento: new Date().toISOString(), data_conclusao: null, duracao_minutos: 30, anexo_url: null, anexo_tipo: null, resultado: null, concluida: false, metadata: {} })}
              onSendProposal={() => handleAddActivity({ deal_id: deal.id, contact_id: deal.contact_id, company_id: deal.company_id, owner_corretor_id: corretorId, tipo: 'proposta_enviada', assunto: 'Proposta enviada', descricao: null, data_vencimento: null, data_conclusao: new Date().toISOString(), duracao_minutos: null, anexo_url: null, anexo_tipo: null, resultado: null, concluida: true, metadata: {} })}
            />
          </div>

          {/* Tab Bar */}
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
            {([
              { key: 'timeline' as const, label: 'Linha do Tempo', icon: Activity, count: deal.activities.length },
              { key: 'comments' as const, label: 'Comentários', icon: MessageSquare, count: deal.comments.length },
              { key: 'changelog' as const, label: 'Alterações', icon: History, count: deal.changelog.length },
            ]).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center',
                  activeTab === key ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm' : 'text-white/40 hover:text-white/60 hover:bg-white/5',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {count > 0 && (
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full', activeTab === key ? 'bg-[#D4AF37]/30' : 'bg-white/10')}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 md:p-6 min-h-[500px]">
            {activeTab === 'timeline' && (
              <ActivityTimeline
                activities={deal.activities}
                dealId={deal.id}
                contactId={deal.contact_id}
                companyId={deal.company_id}
                corretorId={corretorId}
                onAddActivity={handleAddActivity}
                loading={loading}
              />
            )}
            {activeTab === 'comments' && (
              <CommentsSection
                comments={deal.comments}
                entityType="deal"
                entityId={deal.id}
                currentCorretorId={corretorId}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onTogglePin={handleTogglePinComment}
                loading={loading}
              />
            )}
            {activeTab === 'changelog' && (
              <ChangelogView changelog={deal.changelog} loading={loading} />
            )}
          </div>
        </div>

        {/* RIGHT: Attachments + Related Deals + Quotes */}
        <div className="lg:col-span-3 space-y-4">
          {/* Scanner Inteligente do cliente */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
            <Section title="Scanner Inteligente" icon={Sparkles}>
              <ClientScannerQuickPanel
                context="admin"
                corretorId={deal.owner_corretor_id || null}
                leadId={deal.lead_id || null}
                leadName={deal.contact?.nome || deal.titulo}
                compact
              />
            </Section>
          </div>

          {/* Attachments */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
            <Section title="Anexos" icon={Paperclip}>
              {deal.attachments.length === 0 ? (
                <div className="text-center py-4">
                  <Paperclip className="h-6 w-6 text-white/15 mx-auto mb-1" />
                  <p className="text-[10px] text-white/20">Nenhum anexo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deal.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 group">
                      <FileText className="h-4 w-4 text-white/30 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white truncate">{att.file_name}</p>
                        <p className="text-[9px] text-white/20">
                          {att.file_size_bytes ? `${(att.file_size_bytes / 1024).toFixed(0)}KB` : ''}
                          {att.mime_type ? ` · ${att.mime_type}` : ''}
                        </p>
                      </div>
                      {att.file_url && (
                        <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-3 w-3 text-white/30" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Quotes */}
          {deal.quotes.length > 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <Section title="Cotações" icon={FileText}>
                <div className="space-y-2">
                  {deal.quotes.map((q) => (
                    <div key={q.id} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-white">{q.quote_number || q.titulo || 'Cotação'}</p>
                        <span className="text-[9px] text-white/30">{formatDate(q.created_at)}</span>
                      </div>
                      {q.total != null && (
                        <p className="text-xs text-[#D4AF37] font-semibold">{formatCurrency(q.total)}</p>
                      )}
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[9px]',
                        q.status === 'accepted' ? 'bg-green-500/10 text-green-400' :
                        q.status === 'declined' ? 'bg-red-500/10 text-red-400' :
                        'bg-white/5 text-white/40',
                      )}>
                        {q.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* Related Deals */}
          {deal.related_deals && deal.related_deals.length > 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <Section title="Deals Relacionados" icon={Activity}>
                <div className="space-y-2">
                  {deal.related_deals.map((rd) => (
                    <button
                      key={rd.id}
                      onClick={() => router.push(`/portal-interno-hks-2026/crm/deal/${rd.id}`)}
                      className="w-full p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors text-left"
                    >
                      <p className="text-[11px] text-white truncate">{rd.titulo}</p>
                      {rd.valor != null && (
                        <p className="text-[10px] text-[#D4AF37]">{formatCurrency(rd.valor)}</p>
                      )}
                    </button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* Deal Health */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
            <Section title="Saúde do Deal" icon={Activity}>
              <div className="space-y-2">
                <HealthRow label="Dias sem atividade" value={deal.dias_no_stage} threshold={7} suffix="d" />
                <HealthRow label="Score" value={deal.score} threshold={50} invert />
                <HealthRow label="Probabilidade" value={deal.probabilidade ?? 0} threshold={50} suffix="%" invert />
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// HEALTH ROW
// ========================================

function HealthRow({ label, value, threshold, suffix = '', invert }: { label: string; value: number; threshold: number; suffix?: string; invert?: boolean }) {
  const isGood = invert ? value >= threshold : value <= threshold;
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-white/30">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cn('text-xs font-medium', isGood ? 'text-green-400' : 'text-red-400')}>
          {value}{suffix}
        </span>
        <div className={cn('h-2 w-2 rounded-full', isGood ? 'bg-green-400' : 'bg-red-400')} />
      </div>
    </div>
  );
}
