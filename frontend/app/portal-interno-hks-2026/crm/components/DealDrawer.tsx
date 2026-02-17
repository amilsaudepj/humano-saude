'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, Mail, Calendar, Clock, FileText, Send, Star,
  AlertTriangle, Sparkles, Building2, User, DollarSign,
  ArrowRight, CheckCircle, XCircle, Plus, MessageSquare,
  Mic, Flag, Tag, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmDealEnriched, CrmActivityEnriched, CrmActivityType } from '@/lib/types/crm';
import type { CrmActivityInsert } from '@/lib/types/crm';
import ClientScannerQuickPanel from '@/app/components/ClientScannerQuickPanel';

// ========================================
// ACTIVITY TYPE CONFIG
// ========================================

const ACTIVITY_CONFIG: Record<CrmActivityType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
}> = {
  ligacao: { icon: Phone, label: 'Ligação', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  email: { icon: Mail, label: 'Email', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  reuniao: { icon: Calendar, label: 'Reunião', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  nota: { icon: FileText, label: 'Nota', color: 'text-white/60', bgColor: 'bg-white/5' },
  tarefa: { icon: CheckCircle, label: 'Tarefa', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  proposta_enviada: { icon: Send, label: 'Proposta Enviada', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  proposta_aceita: { icon: CheckCircle, label: 'Proposta Aceita', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  proposta_recusada: { icon: XCircle, label: 'Proposta Recusada', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  documento_enviado: { icon: FileText, label: 'Doc. Enviado', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  documento_recebido: { icon: FileText, label: 'Doc. Recebido', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  visita: { icon: Building2, label: 'Visita', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  follow_up: { icon: Clock, label: 'Follow-up', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
  stage_change: { icon: ArrowRight, label: 'Mudança de Etapa', color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10' },
  sistema: { icon: Sparkles, label: 'Sistema', color: 'text-white/40', bgColor: 'bg-white/5' },
};

// Tipos que o usuário pode escolher para nova atividade
const USER_ACTIVITY_TYPES: CrmActivityType[] = [
  'nota', 'ligacao', 'whatsapp', 'email', 'reuniao',
  'proposta_enviada', 'documento_enviado', 'follow_up', 'visita',
];

// ========================================
// HELPERS
// ========================================

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return 'Agora';
  if (diffH < 24) return `${Math.floor(diffH)}h atrás`;
  if (diffH < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// ========================================
// DEAL DRAWER (MAIN EXPORT)
// ========================================

export default function DealDrawer({
  deal,
  activities,
  isOpen,
  onClose,
  onAddActivity,
  loading,
}: {
  deal: CrmDealEnriched | null;
  activities: CrmActivityEnriched[];
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (input: CrmActivityInsert) => Promise<boolean>;
  loading: boolean;
}) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<CrmActivityType>('nota');
  const [showActivityForm, setShowActivityForm] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim() || !deal) return;
    const success = await onAddActivity({
      deal_id: deal.id,
      contact_id: deal.contact_id,
      company_id: deal.company_id,
      owner_corretor_id: deal.owner_corretor_id,
      tipo: noteType,
      assunto: ACTIVITY_CONFIG[noteType].label,
      descricao: newNote.trim(),
      concluida: false,
      data_vencimento: null,
      data_conclusao: null,
      duracao_minutos: null,
      anexo_url: null,
      anexo_tipo: null,
      resultado: null,
      metadata: {},
    });
    if (success) {
      setNewNote('');
      setShowActivityForm(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && deal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-screen w-full max-w-lg bg-[#0B1215]/98 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {deal.is_hot && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">
                      <Sparkles className="h-2.5 w-2.5" /> HOT
                    </span>
                  )}
                  {deal.stage_cor && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                      style={{ backgroundColor: `${deal.stage_cor}30`, color: deal.stage_cor }}
                    >
                      {deal.stage_nome}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white truncate">{deal.titulo}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/50">
                  {deal.valor != null && (
                    <span className="text-[#D4AF37] font-semibold">{formatCurrency(deal.valor)}</span>
                  )}
                  {deal.probabilidade != null && (
                    <span>{deal.probabilidade}% prob.</span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            {/* Deal Info Grid */}
            <div className="px-6 py-4 border-b border-white/5 grid grid-cols-2 gap-3">
              {deal.contact && (
                <InfoBlock
                  icon={User}
                  label="Contato"
                  value={`${deal.contact.nome} ${deal.contact.sobrenome ?? ''}`}
                  color="blue"
                />
              )}
              {deal.company && (
                <InfoBlock icon={Building2} label="Empresa" value={deal.company.nome} color="purple" />
              )}
              {deal.owner && (
                <InfoBlock icon={User} label="Responsável" value={deal.owner.nome} color="gold" />
              )}
              {deal.data_previsao_fechamento && (
                <InfoBlock
                  icon={Calendar}
                  label="Previsão"
                  value={new Date(deal.data_previsao_fechamento).toLocaleDateString('pt-BR')}
                  color="cyan"
                />
              )}
              {deal.valor_recorrente != null && deal.valor_recorrente > 0 && (
                <InfoBlock
                  icon={DollarSign}
                  label="Mensalidade"
                  value={formatCurrency(deal.valor_recorrente)}
                  color="green"
                />
              )}
              <InfoBlock
                icon={Star}
                label="Score"
                value={`${deal.score}/100`}
                color={deal.score >= 70 ? 'gold' : deal.score >= 40 ? 'yellow' : 'white'}
              />
            </div>

            {/* Quick Actions */}
            {deal.contact && (
              <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2">
                {deal.contact.whatsapp && (
                  <a
                    href={`https://wa.me/${deal.contact.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors text-xs text-green-400"
                  >
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                {deal.contact.email && (
                  <a
                    href={`mailto:${deal.contact.email}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors text-xs text-blue-400"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                )}
              </div>
            )}

            <div className="px-6 py-3 border-b border-white/5">
              <ClientScannerQuickPanel
                context="admin"
                corretorId={deal.owner_corretor_id || null}
                leadId={deal.lead_id || null}
                leadName={deal.contact?.nome || deal.titulo}
                compact
              />
            </div>

            {/* Activity Timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 sidebar-scroll">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Atividades</h3>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="flex items-center gap-1 text-xs text-[#D4AF37] hover:text-[#F6E05E] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova
                </button>
              </div>

              {/* New Activity Form */}
              <AnimatePresence>
                {showActivityForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3 overflow-hidden"
                  >
                    {/* Type Selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {USER_ACTIVITY_TYPES.map((t) => {
                        const cfg = ACTIVITY_CONFIG[t];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={t}
                            onClick={() => setNoteType(t)}
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                              noteType === t
                                ? `${cfg.bgColor} ${cfg.color} border border-current/20`
                                : 'bg-white/5 text-white/40 hover:bg-white/10',
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      placeholder="Descreva a atividade..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none border border-white/10 rounded-lg p-3"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setShowActivityForm(false); setNewNote(''); }}
                        className="px-3 py-1.5 text-xs text-white/50 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!newNote.trim()}
                        className="px-4 py-1.5 rounded-lg bg-[#D4AF37] text-white text-xs font-medium hover:bg-[#F6E05E] transition-colors disabled:opacity-40"
                      >
                        Registrar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timeline */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center text-white/20">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Nenhuma atividade registrada</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/5" />
                  {activities.map((activity) => {
                    const cfg = ACTIVITY_CONFIG[activity.tipo] ?? ACTIVITY_CONFIG.sistema;
                    const Icon = cfg.icon;
                    return (
                      <div key={activity.id} className="relative flex gap-3 pb-4">
                        <div className={cn('relative z-10 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bgColor)}>
                          <Icon className={cn('h-4 w-4', cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-white">
                              {activity.assunto ?? cfg.label}
                            </span>
                            <span className="text-[10px] text-white/30">
                              {formatTimestamp(activity.created_at)}
                            </span>
                          </div>
                          {activity.descricao && (
                            <p className="text-xs text-white/40 mt-1 line-clamp-3">{activity.descricao}</p>
                          )}
                          {activity.owner_nome && (
                            <span className="text-[10px] text-white/20 mt-1 inline-block">
                              por {activity.owner_nome}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ========================================
// INFO BLOCK HELPER
// ========================================

function InfoBlock({
  icon: Icon,
  label,
  value,
  color = 'white',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    white: 'text-white/60',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    gold: 'text-[#D4AF37]',
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03]">
      <Icon className={cn('h-4 w-4 flex-shrink-0', colorMap[color] ?? colorMap.white)} />
      <div className="min-w-0">
        <p className="text-[10px] text-white/30">{label}</p>
        <p className="text-xs text-white truncate">{value}</p>
      </div>
    </div>
  );
}
