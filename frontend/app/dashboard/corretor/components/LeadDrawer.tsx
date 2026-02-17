'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  FileText,
  Send,
  Star,
  AlertTriangle,
  Sparkles,
  Mic,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  User,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmCardEnriched, CrmInteracaoTipo } from '@/lib/types/corretor';
import { useCardInteracoes } from '../hooks/useKanban';
import ClientScannerQuickPanel from '@/app/components/ClientScannerQuickPanel';

// ========================================
// INTERAÇÃO ICONS
// ========================================

const INTERACAO_ICONS: Record<CrmInteracaoTipo, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  nota: { icon: FileText, color: 'text-white/60', bgColor: 'bg-white/5' },
  ligacao: { icon: Phone, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  whatsapp: { icon: MessageSquare, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  email: { icon: Mail, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  reuniao: { icon: Calendar, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  proposta_enviada: { icon: Send, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  proposta_aceita: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  proposta_recusada: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  documento_recebido: { icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  status_change: { icon: ArrowRight, color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10' },
  nota_voz: { icon: Mic, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  sistema: { icon: Sparkles, color: 'text-white/40', bgColor: 'bg-white/5' },
  tarefa: { icon: CheckCircle, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  follow_up: { icon: Clock, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
  documento_enviado: { icon: Send, color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
  visita: { icon: User, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
};

// ========================================
// LEAD DRAWER (Hubspot-style)
// ========================================

export default function LeadDrawer({
  card,
  isOpen,
  onClose,
  corretorId,
  onUpdate,
}: {
  card: CrmCardEnriched | null;
  isOpen: boolean;
  onClose: () => void;
  corretorId: string;
  onUpdate: () => void;
}) {
  const { interacoes, loading, handleAddInteracao } = useCardInteracoes(
    isOpen ? card?.id ?? null : null,
  );

  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<CrmInteracaoTipo>('nota');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !card) return;

    await handleAddInteracao({
      card_id: card.id,
      corretor_id: corretorId,
      lead_id: card.lead_id,
      tipo: noteType,
      titulo: noteType === 'nota' ? 'Nota adicionada' : `Registro: ${noteType}`,
      descricao: newNote.trim(),
      anexo_url: null,
      anexo_tipo: null,
      status_anterior: null,
      status_novo: null,
      metadata: {},
    });

    setNewNote('');
    setShowAddForm(false);
    onUpdate();
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / 3600000;

    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${Math.floor(diffHours)}h atrás`;
    if (diffHours < 48) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && card && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-[#0B1215]/98 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {card.is_hot && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">
                      <Sparkles className="h-2.5 w-2.5" />
                      HOT
                    </span>
                  )}
                  {card.is_stale && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Reativar
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white truncate">{card.titulo}</h2>
                {card.lead && (
                  <p className="text-sm text-white/50 mt-1">
                    {card.lead.operadora_atual ?? 'Sem operadora'} · Score: {card.score}/100
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            {/* Lead Info */}
            {card.lead && (
              <div className="px-6 py-4 border-b border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  {card.lead.whatsapp && (
                    <a
                      href={`https://wa.me/${card.lead.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/15 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-green-400 truncate">{card.lead.whatsapp}</span>
                    </a>
                  )}
                  {card.lead.email && (
                    <a
                      href={`mailto:${card.lead.email}`}
                      className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-blue-400 truncate">{card.lead.email}</span>
                    </a>
                  )}
                </div>

                {/* Score visual */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${card.score}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        card.score >= 70
                          ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E]'
                          : card.score >= 40
                            ? 'bg-yellow-500'
                            : 'bg-white/30',
                      )}
                    />
                  </div>
                  <span className="text-xs text-white/50">{card.score}/100</span>
                </div>
              </div>
            )}

            {/* Scanner Inteligente dentro do painel do cliente */}
            <div className="px-6 py-3 border-b border-white/5">
              <ClientScannerQuickPanel
                context="corretor"
                corretorId={corretorId}
                leadId={card.lead_id || null}
                leadName={card.lead?.nome || card.titulo}
                compact
              />
            </div>

            {/* Add Interaction */}
            <div className="px-6 py-3 border-b border-white/5">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all text-sm text-white/50 hover:text-[#D4AF37]"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Interação
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  {/* Tipo selector */}
                  <div className="flex gap-1 flex-wrap">
                    {(['nota', 'ligacao', 'whatsapp', 'email', 'reuniao'] as CrmInteracaoTipo[]).map((tipo) => {
                      const config = INTERACAO_ICONS[tipo];
                      const Icon = config.icon;
                      return (
                        <button
                          key={tipo}
                          onClick={() => setNoteType(tipo)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all',
                            noteType === tipo
                              ? `${config.bgColor} ${config.color} border border-current/20`
                              : 'bg-white/5 text-white/40 hover:text-white/60',
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Descreva a interação..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37]/30 resize-none"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitNote}
                      disabled={!newNote.trim()}
                      className="flex-1 py-2 rounded-lg bg-[#D4AF37] text-black text-sm font-medium hover:bg-[#F6E05E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setNewNote(''); }}
                      className="px-4 py-2 rounded-lg text-white/50 hover:bg-white/5 text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-4 sidebar-scroll">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                Linha do Tempo
              </h3>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
                  ))}
                </div>
              ) : interacoes.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-white/20">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-sm">Nenhuma interação registrada</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />

                  <div className="space-y-4">
                    {interacoes.map((interacao, index) => {
                      const tipo = (interacao as unknown as { tipo: CrmInteracaoTipo }).tipo;
                      const config = INTERACAO_ICONS[tipo] ?? INTERACAO_ICONS.sistema;
                      const Icon = config.icon;

                      return (
                        <motion.div
                          key={(interacao as unknown as { id: string }).id ?? index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pl-10"
                        >
                          {/* Timeline dot */}
                          <div className={cn(
                            'absolute left-1.5 top-1 h-5 w-5 rounded-full flex items-center justify-center',
                            config.bgColor,
                          )}>
                            <Icon className={cn('h-2.5 w-2.5', config.color)} />
                          </div>

                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn('text-xs font-medium', config.color)}>
                                {(interacao as unknown as { titulo: string | null }).titulo ?? tipo}
                              </span>
                              <span className="text-[10px] text-white/30">
                                {formatTimestamp((interacao as unknown as { created_at: string }).created_at)}
                              </span>
                            </div>

                            {(interacao as unknown as { descricao: string | null }).descricao && (
                              <p className="text-xs text-white/60">
                                {(interacao as unknown as { descricao: string }).descricao}
                              </p>
                            )}

                            {/* Status change visual */}
                            {tipo === 'status_change' && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">
                                  {(interacao as unknown as { status_anterior: string | null }).status_anterior}
                                </span>
                                <ArrowRight className="h-3 w-3 text-[#D4AF37]" />
                                <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                                  {(interacao as unknown as { status_novo: string | null }).status_novo}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
