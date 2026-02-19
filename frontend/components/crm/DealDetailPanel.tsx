'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, Sparkles, AlertTriangle, Building2, User, DollarSign,
  Calendar, Clock, Tag, Flag, Eye, EyeOff, Copy, Trash2,
  FileText, Paperclip, Users, History, MessageSquare,
  ChevronDown, ChevronRight, ExternalLink, MoreHorizontal,
  Phone, Mail, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDealDetail } from './hooks/useDealDetail';
import StageProgress from './StageProgress';
import ActivityTimeline from './ActivityTimeline';
import QuickActions from './QuickActions';
import ChangelogView from './ChangelogView';
import CommentsSection from './CommentsSection';
import type { CrmDealDetail, CrmDealPriority, CrmActivityInsert } from '@/lib/types/crm';

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
          <select
            value={draft}
            onChange={(e) => { setDraft(e.target.value); }}
            onBlur={handleSave}
            autoFocus
            className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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

  const displayValue = type === 'currency' ? formatCurrency(value as number | null) :
    type === 'date' ? formatDate(value as string | null) :
    String(value ?? '—');

  return (
    <button
      onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
      className="w-full text-left group space-y-1"
    >
      <span className="text-[10px] text-white/30">{label}</span>
      <p className="text-xs text-white group-hover:text-[#D4AF37] transition-colors truncate">
        {displayValue}
      </p>
    </button>
  );
}

// ========================================
// FOCUS SECTION (Overdue + Today Tasks)
// ========================================

function FocusSection({ deal }: { deal: CrmDealDetail }) {
  const hasItems = deal.overdue_tasks.length > 0 || deal.today_tasks.length > 0;
  if (!hasItems) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
      <h4 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Atenção</h4>

      {deal.overdue_tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-red-400 font-medium truncate">{task.assunto ?? 'Tarefa vencida'}</p>
            <p className="text-[10px] text-red-400/60">{task.data_vencimento ? timeAgo(task.data_vencimento) : ''}</p>
          </div>
        </div>
      ))}

      {deal.today_tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
          <Clock className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-yellow-400 font-medium truncate">{task.assunto ?? 'Tarefa para hoje'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================================
// MAIN EXPORT: DEAL DETAIL PANEL
// ========================================

export default function DealDetailPanel({
  dealId,
  isOpen,
  onClose,
  corretorId,
}: {
  dealId: string | null;
  isOpen: boolean;
  onClose: () => void;
  corretorId: string;
}) {
  const {
    deal, loading, activeTab, setActiveTab,
    handleFieldUpdate, handleAddActivity,
    handleToggleFollow, handleAddComment,
    handleDeleteComment, handleTogglePinComment,
    handleDeleteAttachment,
  } = useDealDetail(isOpen ? dealId : null);

  // Mobile tab for responsive
  const [mobileSection, setMobileSection] = useState<'properties' | 'timeline' | 'related'>('timeline');

  const isFollowing = deal?.followers.some((f) => f.corretor_id === corretorId) ?? false;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-screen w-full max-w-[1100px] bg-[#0B1215]/98 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
          >
            {loading || !deal ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* ========== TOP HEADER ========== */}
                <div className="border-b border-white/10 p-4 space-y-3">
                  {/* Row 1: Title + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
                        {deal.stage_cor && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ backgroundColor: `${deal.stage_cor}20`, color: deal.stage_cor }}
                          >
                            {deal.stage_nome}
                          </span>
                        )}
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', PRIORITY_CONFIG[deal.prioridade].bg, PRIORITY_CONFIG[deal.prioridade].color)}>
                          <Flag className="h-2.5 w-2.5 inline mr-0.5" />
                          {PRIORITY_CONFIG[deal.prioridade].label}
                        </span>
                      </div>

                      <EditableField
                        label=""
                        value={deal.titulo}
                        onSave={(v) => handleFieldUpdate('titulo', v)}
                      />

                      <div className="flex items-center gap-4 mt-1 text-sm">
                        {deal.valor != null && (
                          <span className="text-[#D4AF37] font-semibold">{formatCurrency(deal.valor)}</span>
                        )}
                        {deal.probabilidade != null && (
                          <span className="text-white/40">{deal.probabilidade}%</span>
                        )}
                        {deal.score > 0 && (
                          <span className={cn(
                            'flex items-center gap-1 text-xs',
                            deal.score >= 70 ? 'text-[#D4AF37]' : deal.score >= 40 ? 'text-yellow-400' : 'text-white/40',
                          )}>
                            <Star className="h-3 w-3" /> {deal.score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleFollow(corretorId)}
                        className={cn(
                          'h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs transition-all border',
                          isFollowing
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                            : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
                        )}
                        title={isFollowing ? 'Deixar de seguir' : 'Seguir'}
                      >
                        {isFollowing ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {isFollowing ? 'Seguindo' : 'Seguir'}
                      </button>
                      <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
                        <X className="h-5 w-5 text-white/60" />
                      </button>
                    </div>
                  </div>

                  {/* Stage Progress */}
                  <StageProgress stages={deal.stage_progress} />

                  {/* Mobile Tabs */}
                  <div className="flex items-center gap-1 lg:hidden">
                    {(['properties', 'timeline', 'related'] as const).map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setMobileSection(sec)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          mobileSection === sec
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'text-white/40 hover:text-white/60',
                        )}
                      >
                        {sec === 'properties' ? 'Dados' : sec === 'timeline' ? 'Atividades' : 'Associações'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ========== 3-COLUMN LAYOUT ========== */}
                <div className="flex-1 flex overflow-hidden">

                  {/* COLUNA ESQUERDA: Properties */}
                  <div className={cn(
                    'w-[280px] border-r border-white/5 overflow-y-auto sidebar-scroll p-4 space-y-5 flex-shrink-0',
                    'hidden lg:block',
                    mobileSection === 'properties' && '!block flex-1 lg:flex-none lg:w-[280px]',
                  )}>
                    {/* Deal Properties */}
                    <Section title="Dados da Oportunidade">
                      <div className="space-y-3">
                        <EditableField
                          label="Valor"
                          value={deal.valor}
                          type="currency"
                          onSave={(v) => handleFieldUpdate('valor', v)}
                        />
                        <EditableField
                          label="Mensalidade"
                          value={deal.valor_recorrente}
                          type="currency"
                          onSave={(v) => handleFieldUpdate('valor_recorrente', v)}
                        />
                        <EditableField
                          label="Previsão Fechamento"
                          value={deal.data_previsao_fechamento}
                          type="date"
                          onSave={(v) => handleFieldUpdate('data_previsao_fechamento', v)}
                        />
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
                      </div>
                    </Section>

                    {/* Contact */}
                    {deal.contact && (
                      <Section title="Contato">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03]">
                          {deal.contact.avatar_url ? (
                            <img src={deal.contact.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {deal.contact.nome} {deal.contact.sobrenome ?? ''}
                            </p>
                            {deal.contact.email && (
                              <p className="text-[10px] text-white/30 truncate">{deal.contact.email}</p>
                            )}
                          </div>
                        </div>
                        {deal.contact.whatsapp && (
                          <InfoRow icon={Phone} label="WhatsApp" value={deal.contact.whatsapp} />
                        )}
                        {deal.contact.cargo && (
                          <InfoRow icon={User} label="Cargo" value={deal.contact.cargo} />
                        )}
                      </Section>
                    )}

                    {/* Company */}
                    {deal.company && (
                      <Section title="Empresa">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03]">
                          <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{deal.company.nome}</p>
                            {deal.company.cnpj && (
                              <p className="text-[10px] text-white/30">{deal.company.cnpj}</p>
                            )}
                          </div>
                        </div>
                      </Section>
                    )}

                    {/* Owner */}
                    {deal.owner && (
                      <Section title="Responsável">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03]">
                          {deal.owner.foto_url ? (
                            <img src={deal.owner.foto_url} alt="" className="h-7 w-7 rounded-full" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-[#D4AF37]" />
                            </div>
                          )}
                          <p className="text-xs text-white truncate">{deal.owner.nome}</p>
                        </div>
                      </Section>
                    )}

                    {/* Products */}
                    {deal.products.length > 0 && (
                      <Section title="Produtos">
                        <div className="space-y-1.5">
                          {deal.products.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] text-xs">
                              <span className="text-white truncate">{p.product_nome ?? 'Produto'}</span>
                              <span className="text-[#D4AF37] font-medium flex-shrink-0 ml-2">
                                {formatCurrency(p.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Metadata */}
                    <Section title="Detalhes">
                      <div className="space-y-2 text-[11px]">
                        <MetaRow label="Criado em" value={formatDate(deal.created_at)} />
                        <MetaRow label="Atualizado" value={timeAgo(deal.updated_at)} />
                        <MetaRow label="Dias no stage" value={`${deal.dias_no_stage}d`} />
                        <MetaRow label="Score" value={`${deal.score}/100`} />
                      </div>
                    </Section>

                    {/* Tags */}
                    {deal.tags.length > 0 && (
                      <Section title="Tags">
                        <div className="flex flex-wrap gap-1">
                          {deal.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-white/50 border border-white/10"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>

                  {/* COLUNA CENTRAL: Timeline + Comments + Changelog */}
                  <div className={cn(
                    'flex-1 overflow-hidden flex flex-col',
                    'hidden lg:flex',
                    mobileSection === 'timeline' && '!flex',
                  )}>
                    {/* Quick Actions */}
                    <div className="p-4 border-b border-white/5">
                      <QuickActions
                        whatsapp={deal.contact?.whatsapp}
                        email={deal.contact?.email}
                        phone={deal.contact?.telefone}
                        onLogCall={() => {/* TODO: abre form de call */}}
                        onAddNote={() => {/* scroll para form no timeline */}}
                        onCreateTask={() => {/* TODO: abre form de task */}}
                        onScheduleMeeting={() => {/* TODO: abre form de meeting */}}
                        onSendProposal={() => {/* TODO: abre form de proposta */}}
                      />
                    </div>

                    {/* Focus Section */}
                    <div className="px-4 pt-3">
                      <FocusSection deal={deal} />
                    </div>

                    {/* Tab Switcher: Timeline / Comments / Changelog */}
                    <div className="flex items-center gap-1 px-4 pt-3 pb-2">
                      {([
                        { key: 'timeline' as const, label: 'Timeline', icon: Clock, count: deal.activities.length },
                        { key: 'comments' as const, label: 'Comentários', icon: MessageSquare, count: deal.comments.length },
                        { key: 'changelog' as const, label: 'Histórico', icon: History, count: deal.changelog.length },
                      ]).map(({ key, label, icon: Icon, count }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            activeTab === key
                              ? 'bg-white/10 text-white'
                              : 'text-white/40 hover:text-white/60',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                          {count > 0 && (
                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 sidebar-scroll">
                      {activeTab === 'timeline' && (
                        <ActivityTimeline
                          activities={deal.activities}
                          dealId={deal.id}
                          contactId={deal.contact_id}
                          companyId={deal.company_id}
                          corretorId={corretorId}
                          onAddActivity={handleAddActivity}
                          loading={false}
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
                          loading={false}
                        />
                      )}
                      {activeTab === 'changelog' && (
                        <ChangelogView changelog={deal.changelog} loading={false} />
                      )}
                    </div>
                  </div>

                  {/* COLUNA DIREITA: Associations */}
                  <div className={cn(
                    'w-[260px] border-l border-white/5 overflow-y-auto sidebar-scroll p-4 space-y-5 flex-shrink-0',
                    'hidden lg:block',
                    mobileSection === 'related' && '!block flex-1 lg:flex-none lg:w-[260px]',
                  )}>
                    {/* Followers */}
                    <Section title="Seguidores">
                      <div className="flex flex-wrap gap-1.5">
                        {deal.followers.length === 0 ? (
                          <p className="text-[10px] text-white/20">Ninguém seguindo</p>
                        ) : (
                          deal.followers.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03]"
                              title={f.corretor_nome}
                            >
                              {f.corretor_foto ? (
                                <img src={f.corretor_foto} alt="" className="h-5 w-5 rounded-full" />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[8px] font-bold text-[#D4AF37]">
                                  {f.corretor_nome.charAt(0)}
                                </div>
                              )}
                              <span className="text-[10px] text-white/50">{f.corretor_nome}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </Section>

                    {/* Quotes */}
                    <Section title="Cotações / Propostas">
                      {deal.quotes.length === 0 ? (
                        <p className="text-[10px] text-white/20">Nenhuma cotação</p>
                      ) : (
                        <div className="space-y-2">
                          {deal.quotes.map((q) => (
                            <div key={q.id} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-white truncate">{q.titulo}</span>
                                <QuoteStatusBadge status={q.status} />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-white/30">{q.quote_number}</span>
                                <span className="text-[#D4AF37] font-medium">{formatCurrency(q.total)}</span>
                              </div>
                              {q.view_count > 0 && (
                                <span className="text-[9px] text-white/20">
                                  👁 Visualizada {q.view_count}x
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>

                    {/* Attachments */}
                    <Section title="Arquivos">
                      {deal.attachments.length === 0 ? (
                        <p className="text-[10px] text-white/20">Nenhum arquivo</p>
                      ) : (
                        <div className="space-y-1.5">
                          {deal.attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] group">
                              <Paperclip className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <a
                                  href={att.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-white hover:text-[#D4AF37] truncate block"
                                >
                                  {att.file_name}
                                </a>
                                <span className="text-[9px] text-white/20">
                                  {att.file_size_bytes
                                    ? `${(att.file_size_bytes / 1024).toFixed(0)} KB`
                                    : ''}
                                  {att.uploaded_by_nome ? ` · ${att.uploaded_by_nome}` : ''}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteAttachment(att.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3 text-red-400/60 hover:text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>

                    {/* Related Deals */}
                    {deal.related_deals.length > 0 && (
                      <Section title="Oportunidades Relacionadas">
                        <div className="space-y-1.5">
                          {deal.related_deals.map((rd) => (
                            <div key={rd.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                              <div className="min-w-0">
                                <p className="text-[11px] text-white truncate">{rd.titulo}</p>
                                {rd.stage_nome && (
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                                    style={{
                                      backgroundColor: `${rd.stage_cor}20`,
                                      color: rd.stage_cor ?? undefined,
                                    }}
                                  >
                                    {rd.stage_nome}
                                  </span>
                                )}
                              </div>
                              {rd.valor && (
                                <span className="text-[10px] text-[#D4AF37] font-medium flex-shrink-0 ml-2">
                                  {formatCurrency(rd.valor)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Deal Health */}
                    <Section title="Saúde da Oportunidade">
                      <div className="space-y-2">
                        <HealthIndicator
                          label="Score"
                          value={deal.score}
                          max={100}
                          color={deal.score >= 70 ? '#D4AF37' : deal.score >= 40 ? '#F59E0B' : '#EF4444'}
                        />
                        <HealthIndicator
                          label="Probabilidade"
                          value={deal.probabilidade ?? 0}
                          max={100}
                          color={deal.stage_cor ?? '#6366F1'}
                        />
                      </div>
                    </Section>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ========================================
// HELPERS COMPONENTS
// ========================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon className="h-3 w-3 text-white/20 flex-shrink-0" />
      <span className="text-[10px] text-white/30 min-w-[60px]">{label}</span>
      <span className="text-[11px] text-white/60 truncate">{value}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/30">{label}</span>
      <span className="text-white/50">{value}</span>
    </div>
  );
}

function HealthIndicator({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/30">{label}</span>
        <span className="font-medium" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Rascunho', color: 'text-white/40', bg: 'bg-white/5' },
    sent: { label: 'Enviada', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    viewed: { label: 'Visualizada', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    accepted: { label: 'Aceita', color: 'text-green-400', bg: 'bg-green-500/10' },
    declined: { label: 'Recusada', color: 'text-red-400', bg: 'bg-red-500/10' },
    expired: { label: 'Expirada', color: 'text-white/30', bg: 'bg-white/5' },
  };

  const c = config[status] ?? config.draft;

  return (
    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', c.color, c.bg)}>
      {c.label}
    </span>
  );
}
