'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, Mail, MessageCircle, Send, Edit3, Check, X,
  Star, Clock, AlertCircle, ChevronRight, Flame, Zap, Target,
  Calendar, FileText, MessageSquare, CheckCircle2, DollarSign,
  Timer, Activity, User, Building2, Sparkles, BarChart3,
  ThermometerSun, ListChecks, Paperclip, Plus, Trash2, Upload,
  Mic, Brain, TrendingUp, Shield, Rocket, ArrowUpRight,
  CircleDot, GripVertical, Eye, BellRing, Lightbulb, Radio,
  Crown, Gauge, HandshakeIcon, Megaphone, PenLine, Pin, Reply,
  Search, Globe, Briefcase, CalendarClock, UserCheck, Signal,
  Gift, Download, ChevronDown, ChevronUp, CircleCheck, CircleX,
  Play, Pause, RotateCcw, Tag, Layers, Inbox, Workflow,
  MapPin, Hash, Loader2, Megaphone as MegaphoneIcon,
} from 'lucide-react';

// Official WhatsApp SVG icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
import { toast } from 'sonner';
import { useCorretorId } from '../../../hooks/useCorretorToken';
import ClientScannerQuickPanel from '@/app/components/ClientScannerQuickPanel';
import type {
  CrmCardFullDetail, CrmInteracaoTipo, KanbanColumnSlug, CrmInteracao,
  CrmTask, CrmTaskStatus, CrmTaskPriority,
} from '@/lib/types/corretor';
import {
  getCardFullDetail, addCardInteracao, updateCardField,
  moveCardStage, markCardAsSold, trackWhatsAppAction, trackEmailAction,
  updateLeadOrigin,
} from '@/app/actions/crm-card-detail';
import { PlaybookActions, type PlaybookSendPayload } from './components/PlaybookActions';

// ========================================
// CONSTANTS
// ========================================

const CRM_THEME = {
  gold: '#D4AF37',
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  gray: '#6B7280',
} as const;

const STAGE_CONFIG: Record<KanbanColumnSlug, {
  label: string; color: string; bg: string; step: number;
}> = {
  novo_lead:         { label: 'Novo Lead',         color: CRM_THEME.blue,  bg: 'rgba(59,130,246,0.12)',  step: 1 },
  qualificado:       { label: 'Qualificado',       color: CRM_THEME.gold,  bg: 'rgba(212,175,55,0.12)',  step: 2 },
  proposta_enviada:  { label: 'Proposta Enviada',  color: CRM_THEME.gold,  bg: 'rgba(212,175,55,0.12)',  step: 3 },
  documentacao:      { label: 'Documentação',      color: CRM_THEME.gold,  bg: 'rgba(212,175,55,0.12)',  step: 4 },
  fechado:           { label: 'Fechado',           color: CRM_THEME.green, bg: 'rgba(16,185,129,0.12)', step: 5 },
  perdido:           { label: 'Perdido',           color: CRM_THEME.red,   bg: 'rgba(239,68,68,0.12)',  step: 6 },
};

const STAGE_ORDER: KanbanColumnSlug[] = [
  'novo_lead', 'qualificado', 'proposta_enviada', 'documentacao', 'fechado',
];

// Stage icons using Lucide instead of emoji
const StageIcon = ({ slug, className, style }: { slug: KanbanColumnSlug; className?: string; style?: React.CSSProperties }) => {
  const icons: Record<KanbanColumnSlug, React.ReactNode> = {
    novo_lead:        <Radio className={className} style={style} />,
    qualificado:      <UserCheck className={className} style={style} />,
    proposta_enviada: <Send className={className} style={style} />,
    documentacao:     <FileText className={className} style={style} />,
    fechado:          <Crown className={className} style={style} />,
    perdido:          <CircleX className={className} style={style} />,
  };
  return <>{icons[slug]}</>;
};

type InteracaoConf = { label: string; Icon: typeof Activity; color: string };
const INTERACAO_CFG: Record<string, InteracaoConf> = {
  nota:              { label: 'Nota',             Icon: PenLine,       color: CRM_THEME.gray },
  ligacao:           { label: 'Ligação',          Icon: Phone,         color: CRM_THEME.blue },
  whatsapp:          { label: 'WhatsApp',         Icon: MessageCircle, color: CRM_THEME.green },
  email:             { label: 'Email',            Icon: Mail,          color: CRM_THEME.blue },
  reuniao:           { label: 'Reunião',          Icon: HandshakeIcon, color: CRM_THEME.gold },
  proposta_enviada:  { label: 'Proposta',         Icon: Send,          color: CRM_THEME.gold },
  proposta_aceita:   { label: 'Aceita',           Icon: CircleCheck,   color: CRM_THEME.green },
  proposta_recusada: { label: 'Recusada',         Icon: CircleX,       color: CRM_THEME.red },
  documento_recebido:{ label: 'Doc. Recebido',    Icon: Download,      color: CRM_THEME.green },
  status_change:     { label: 'Status',           Icon: Workflow,      color: CRM_THEME.blue },
  nota_voz:          { label: 'Áudio',            Icon: Mic,           color: CRM_THEME.gray },
  sistema:           { label: 'Sistema',          Icon: Gauge,         color: CRM_THEME.gray },
  tarefa:            { label: 'Tarefa',           Icon: ListChecks,    color: CRM_THEME.gold },
  follow_up:         { label: 'Follow-up',        Icon: BellRing,      color: CRM_THEME.gold },
  documento_enviado: { label: 'Doc. Enviado',     Icon: Upload,        color: CRM_THEME.gold },
  visita:            { label: 'Visita',           Icon: Globe,         color: CRM_THEME.blue },
};

const PRIORITY_CFG: Record<string, { label: string; color: string; dot: string }> = {
  baixa:   { label: 'Baixa',   color: 'text-emerald-400', dot: 'bg-emerald-400' },
  media:   { label: 'Média',   color: 'text-[#D4AF37]',   dot: 'bg-[#D4AF37]'   },
  alta:    { label: 'Alta',    color: 'text-[#D4AF37]',   dot: 'bg-[#D4AF37]'   },
  urgente: { label: 'Urgente', color: 'text-red-400',     dot: 'bg-red-400'     },
};

type PlaybookAction =
  | 'whatsapp'
  | 'call'
  | 'urgent'
  | 'proposta'
  | 'case'
  | 'follow_up'
  | 'reuniao'
  | 'docs'
  | 'schedule';

function normalizeWhatsAppPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

// ========================================
// CONFETTI
// ========================================

function ConfettiExplosion() {
  const pieces = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: -(Math.random() * 300 + 200),
    rotate: Math.random() * 720,
    color: [CRM_THEME.gold, CRM_THEME.green, CRM_THEME.blue, '#F6E05E'][i % 4],
    delay: Math.random() * 0.3,
    size: Math.random() * 8 + 4,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((p) => (
        <motion.div key={p.id} className="absolute rounded-sm"
          style={{ width: p.size, height: p.size * 0.6, backgroundColor: p.color, left: '50%', top: '40%' }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x * 6, y: p.y, rotate: p.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: 2.5, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ========================================
// SALE CELEBRATION MODAL
// ========================================

function SaleCelebration({ vendasMes, valorMes, valorVenda, onClose }: {
  vendasMes: number; valorMes: number; valorVenda: number; onClose: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ConfettiExplosion />
      <motion.div className="relative bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl shadow-[#D4AF37]/10"
        initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}>
        <motion.div className="flex items-center justify-center mb-4"
          animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: 2 }}>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F6E05E] flex items-center justify-center">
            <Crown className="w-10 h-10 text-black" />
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">VENDA FECHADA!</h2>
        <p className="text-white/60 mb-6">Parabéns pela conquista!</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">Valor da Venda</p>
            <p className="text-2xl font-bold text-emerald-400">R$ {Number(valorVenda).toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">Vendas este Mês</p>
            <p className="text-2xl font-bold text-[#D4AF37]">{vendasMes}</p>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-6">
          <p className="text-xs text-white/40 mb-1">Total Vendido no Mês</p>
          <p className="text-3xl font-bold text-white">R$ {Number(valorMes).toLocaleString('pt-BR')}</p>
        </div>
        <button onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] hover:brightness-110 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2">
          <Rocket className="w-5 h-5" /> Continuar Vendendo!
        </button>
      </motion.div>
    </motion.div>
  );
}

// ========================================
// EMAIL COMPOSER INLINE
// ========================================

function EmailComposer({ leadEmail, cardId, corretorId, onSent }: {
  leadEmail: string; cardId: string; corretorId: string; onSent: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Preencha assunto e corpo'); return; }
    setSending(true);
    const res = await trackEmailAction(cardId, corretorId, leadEmail, subject, body);
    setSending(false);
    if (res.success) {
      window.open(`mailto:${leadEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      toast.success('Email rastreado e aberto no seu cliente de email');
      setSubject(''); setBody(''); onSent();
    } else { toast.error(res.error ?? 'Erro ao enviar'); }
  };

  return (
    <div className="space-y-3 border border-amber-500/20 rounded-xl p-4 bg-amber-500/[0.03]">
      <div className="flex items-center gap-2 text-sm text-amber-400/80">
        <Mail className="w-4 h-4" />
        <span className="font-medium">Compor Email</span>
        <span className="text-white/30">→ {leadEmail}</span>
      </div>
      <input type="text" placeholder="Assunto do email..." value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/40" />
      <textarea placeholder="Corpo do email..." value={body} onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/40 resize-none" />
      <div className="flex justify-end">
        <button onClick={handleSend} disabled={sending}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" /> {sending ? 'Enviando...' : 'Enviar & Rastrear'}
        </button>
      </div>
    </div>
  );
}

// ========================================
// TASK MANAGER (INLINE, no external table dependency)
// ========================================

type LocalTask = {
  id: string; title: string; done: boolean; priority: string; dueDate: string;
};

function TasksPanel({ tasks: serverTasks, cardId, corretorId }: {
  tasks: CrmTask[]; cardId: string; corretorId: string;
}) {
  // Use interacoes-based tasks from server, plus local tasks
  const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('media');
  const [newDue, setNewDue] = useState('');

  const allTasks = useMemo(() => {
    // Server tasks mapped to local format
    const mapped: LocalTask[] = (serverTasks ?? []).map((t) => ({
      id: t.id, title: t.titulo, done: t.status === 'concluida',
      priority: t.prioridade, dueDate: t.data_vencimento ?? '',
    }));
    return [...mapped, ...localTasks];
  }, [serverTasks, localTasks]);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    // Add as interacao for persistence
    const res = await addCardInteracao({
      card_id: cardId, corretor_id: corretorId, lead_id: null,
      tipo: 'tarefa', titulo: `📋 ${newTitle.trim()}`,
      descricao: newDue ? `Vencimento: ${newDue}` : null,
      anexo_url: null, anexo_tipo: null,
      status_anterior: null, status_novo: null,
      metadata: { priority: newPriority, dueDate: newDue },
    });
    if (res.success) {
      setLocalTasks(prev => [...prev, {
        id: crypto.randomUUID(), title: newTitle.trim(),
        done: false, priority: newPriority, dueDate: newDue,
      }]);
      setNewTitle(''); setNewDue('');
      toast.success('Tarefa adicionada');
    }
  };

  const toggleTask = (id: string) => {
    setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTask = (id: string) => {
    setLocalTasks(prev => prev.filter(t => t.id !== id));
  };

  const pending = allTasks.filter(t => !t.done);
  const done = allTasks.filter(t => t.done);

  return (
    <div className="space-y-4">
      {/* Add Task */}
      <div className="flex gap-2">
        <input type="text" placeholder="Nova tarefa..." value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40" />
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}
          className="px-2 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-xs">
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
        <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
          className="px-2 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-xs w-[130px]" />
        <button onClick={addTask}
          className="px-3 py-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 rounded-lg text-[#D4AF37] transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 font-medium">Pendentes ({pending.length})</p>
          {pending.map((task) => {
            const pConf = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.media;
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isOverdue ? 'bg-red-500/[0.05] border-red-500/20' : 'bg-white/[0.02] border-white/[0.06]'
              }`}>
                <button onClick={() => toggleTask(task.id)}
                  className="w-5 h-5 rounded-full border-2 border-white/20 hover:border-[#D4AF37] flex-shrink-0 transition-colors" />
                <span className="flex-1 text-sm text-white/80">{task.title}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${pConf.dot}`} title={pConf.label} />
                {task.dueDate && (
                  <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-white/30'}`}>
                    {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
                <button onClick={() => removeTask(task.id)} className="text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-white/30 font-medium">Concluídas ({done.length})</p>
          {done.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
              <button onClick={() => toggleTask(task.id)}
                className="w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </button>
              <span className="flex-1 text-sm text-white/30 line-through">{task.title}</span>
            </div>
          ))}
        </div>
      )}

      {allTasks.length === 0 && (
        <div className="text-center py-6">
          <ListChecks className="w-8 h-8 mx-auto mb-2 text-white/10" />
          <p className="text-sm text-white/20">Nenhuma tarefa</p>
          <p className="text-xs text-white/10 mt-1">Use o campo acima para criar tarefas</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// FILES PANEL (Local upload with base64 preview)
// ========================================

type LocalFile = { id: string; name: string; type: string; size: number; dataUrl: string; category: string; createdAt: string };

function FilesPanel({ files: serverFiles }: { files: Array<{ id: string; nome: string; tipo_arquivo: string; tamanho_bytes: number | null; url: string; categoria: string | null; created_at: string }> }) {
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allFiles = useMemo(() => {
    const mapped: LocalFile[] = (serverFiles ?? []).map(f => ({
      id: f.id, name: f.nome, type: f.tipo_arquivo,
      size: f.tamanho_bytes ?? 0, dataUrl: f.url,
      category: f.categoria ?? 'geral', createdAt: f.created_at,
    }));
    return [...mapped, ...localFiles];
  }, [serverFiles, localFiles]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} excede 10MB`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        setLocalFiles(prev => [...prev, {
          id: crypto.randomUUID(), name: file.name, type: file.type,
          size: file.size, dataUrl: reader.result as string,
          category: 'geral', createdAt: new Date().toISOString(),
        }]);
        toast.success(`${file.name} adicionado`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setLocalFiles(prev => prev.filter(f => f.id !== id));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.05]' : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.01]'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-[#D4AF37]' : 'text-white/20'}`} />
        <p className="text-sm text-white/40">Arraste arquivos ou clique para enviar</p>
        <p className="text-[10px] text-white/20 mt-1">Máximo 10MB por arquivo</p>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* File List */}
      {allFiles.length > 0 ? (
        <div className="space-y-2">
          {allFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors group">
              <span className="text-lg">{fileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{file.name}</p>
                <p className="text-[10px] text-white/30">{formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              {file.dataUrl.startsWith('http') && (
                <a href={file.dataUrl} target="_blank" rel="noopener noreferrer"
                  className="text-white/20 hover:text-[#D4AF37] transition-colors">
                  <Download className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => removeFile(file.id)} className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <Paperclip className="w-8 h-8 mx-auto mb-2 text-white/10" />
          <p className="text-sm text-white/20">Nenhum arquivo</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// COMMENTS / NOTES PANEL
// ========================================

function CommentsPanel({ comments: serverComments, cardId, corretorId, onRefresh }: {
  comments: Array<{ id: string; texto: string; corretor_nome?: string; is_pinned: boolean; created_at: string }>;
  cardId: string; corretorId: string; onRefresh: () => void;
}) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const res = await addCardInteracao({
      card_id: cardId, corretor_id: corretorId, lead_id: null,
      tipo: 'nota', titulo: 'Nota interna',
      descricao: text.trim(),
      anexo_url: null, anexo_tipo: null,
      status_anterior: null, status_novo: null,
      metadata: { type: 'comment' },
    });
    setPosting(false);
    if (res.success) {
      toast.success('Nota adicionada');
      setText('');
      onRefresh();
    } else { toast.error(res.error ?? 'Erro'); }
  };

  const allNotes = useMemo(() => {
    return (serverComments ?? []).sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [serverComments]);

  return (
    <div className="space-y-4">
      {/* Compose */}
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-[#D4AF37]" />
        </div>
        <div className="flex-1">
          <textarea placeholder="Escreva uma nota interna..." value={text}
            onChange={(e) => setText(e.target.value)} rows={2}
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40 resize-none" />
          <div className="flex justify-end mt-1">
            <button onClick={handlePost} disabled={posting || !text.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] rounded-lg text-xs font-medium transition-colors disabled:opacity-40">
              <Send className="w-3 h-3" /> {posting ? 'Salvando...' : 'Publicar Nota'}
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      {allNotes.length > 0 ? (
        <div className="space-y-3">
          {allNotes.map((note) => (
            <div key={note.id} className={`p-3 rounded-xl border transition-colors ${
              note.is_pinned ? 'bg-[#D4AF37]/[0.04] border-[#D4AF37]/20' : 'bg-white/[0.02] border-white/[0.06]'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <User className="w-3 h-3 text-white/40" />
                </div>
                <span className="text-xs font-medium text-white/50">{note.corretor_nome ?? 'Você'}</span>
                {note.is_pinned && <Pin className="w-3 h-3 text-[#D4AF37]" />}
                <span className="text-[10px] text-white/20 ml-auto">
                  {new Date(note.created_at).toLocaleDateString('pt-BR')} {new Date(note.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{note.texto}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-white/10" />
          <p className="text-sm text-white/20">Nenhuma nota</p>
        </div>
      )}
    </div>
  );
}

// ========================================
// ORIGEM CARD — editável com registro de atividade
// ========================================

const ORIGEM_OPTIONS = [
  { value: 'corretor_crm',  label: 'CRM Manual',     icon: User,          color: CRM_THEME.gold },
  { value: 'indicacao',     label: 'Indicação',      icon: Gift,          color: CRM_THEME.gold },
  { value: 'whatsapp',      label: 'WhatsApp',       icon: MessageCircle, color: CRM_THEME.green },
  { value: 'meta_ads',      label: 'Meta Ads',       icon: MegaphoneIcon, color: CRM_THEME.blue },
  { value: 'facebook',      label: 'Facebook',       icon: Globe,         color: CRM_THEME.blue },
  { value: 'instagram',     label: 'Instagram',      icon: Globe,         color: CRM_THEME.blue },
  { value: 'google_ads',    label: 'Google Ads',     icon: Search,        color: CRM_THEME.blue },
  { value: 'landing_page',  label: 'Landing Page',   icon: Globe,         color: CRM_THEME.blue },
  { value: 'scanner_pdf',   label: 'Scanner PDF',    icon: FileText,      color: CRM_THEME.gold },
  { value: 'site',          label: 'Website',        icon: Globe,         color: CRM_THEME.blue },
  { value: 'telefone',      label: 'Telefone',       icon: Phone,         color: CRM_THEME.blue },
  { value: 'manual',        label: 'Manual',         icon: PenLine,       color: CRM_THEME.gray },
  { value: 'outro',         label: 'Outro',          icon: Globe,         color: CRM_THEME.gray },
] as const;

function OrigemCard({ detail, cardId, corretorId, onRefresh }: {
  detail: CrmCardFullDetail; cardId: string; corretorId: string; onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const origemRaw = detail.lead?.origem ?? (detail.metadata as Record<string, unknown>)?.origem as string ?? null;
  const origemOpt = ORIGEM_OPTIONS.find(o => o.value === origemRaw);
  const OrigemIcon = origemOpt?.icon ?? Globe;
  const origemColor = origemOpt?.color ?? CRM_THEME.gray;
  const origemLabel = origemOpt?.label ?? origemRaw ?? 'Não definida';

  const meta = (detail.metadata as Record<string, unknown>) ?? {};
  const utmSource = meta.utm_source as string ?? null;
  const utmMedium = meta.utm_medium as string ?? null;
  const utmCampaign = meta.utm_campaign as string ?? null;
  const utmTerm = meta.utm_term as string ?? null;
  const utmContent = meta.utm_content as string ?? null;

  const handleChangeOrigin = async (newValue: string) => {
    if (!detail.lead_id || newValue === origemRaw) { setEditing(false); return; }
    setSaving(true);
    const res = await updateLeadOrigin(cardId, corretorId, detail.lead_id, newValue, origemRaw);
    setSaving(false);
    if (res.success) {
      toast.success('Origem atualizada — atividade registrada');
      setEditing(false);
      onRefresh();
    } else {
      toast.error(res.error ?? 'Erro ao atualizar origem');
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#D4AF37]" /> Origem
        </h3>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors group"
            title="Editar origem">
            <Edit3 className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <p className="text-[10px] text-white/30">Selecione a nova origem:</p>
          <div className="grid grid-cols-1 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
            {ORIGEM_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              const isSelected = opt.value === origemRaw;
              return (
                <button key={opt.value} disabled={saving}
                  onClick={() => handleChangeOrigin(opt.value)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all border ${
                    isSelected
                      ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.1]'
                  } disabled:opacity-40`}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${opt.color}15` }}>
                    <OptIcon className="w-3.5 h-3.5" style={{ color: opt.color }} />
                  </div>
                  {opt.label}
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] ml-auto" />}
                </button>
              );
            })}
          </div>
          <button onClick={() => setEditing(false)}
            className="w-full py-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors">
            Cancelar
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${origemColor}15` }}>
              <OrigemIcon className="w-4 h-4" style={{ color: origemColor }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-white/30">Canal</p>
              <p className="text-sm font-medium cursor-pointer hover:brightness-125 transition-all"
                onClick={() => setEditing(true)}
                style={{ color: origemColor }}>{origemLabel}</p>
            </div>
          </div>

          {/* UTM Details */}
          {(utmSource || utmMedium || utmCampaign || utmTerm || utmContent) && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[9px] text-white/25 font-medium uppercase tracking-wider">UTM Tracking</p>
              {utmSource && (
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/30">Source:</span>
                  <span className="text-[10px] text-white/60 font-medium">{utmSource}</span>
                </div>
              )}
              {utmMedium && (
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/30">Medium:</span>
                  <span className="text-[10px] text-white/60 font-medium">{utmMedium}</span>
                </div>
              )}
              {utmCampaign && (
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/30">Campanha:</span>
                  <span className="text-[10px] text-white/60 font-medium">{utmCampaign}</span>
                </div>
              )}
              {utmTerm && (
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/30">Termo:</span>
                  <span className="text-[10px] text-white/60 font-medium">{utmTerm}</span>
                </div>
              )}
              {utmContent && (
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/30">Conteúdo:</span>
                  <span className="text-[10px] text-white/60 font-medium">{utmContent}</span>
                </div>
              )}
            </div>
          )}

          {detail.lead?.observacoes && (
            <div className="pt-1">
              <p className="text-[10px] text-white/30 mb-1">Observações</p>
              <p className="text-xs text-white/50 line-clamp-3">{detail.lead.observacoes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ========================================
// AI COPILOT SIDEBAR
// ========================================

function AICopilot({
  detail,
  onPlaybookAction,
  playbookBusyAction,
}: {
  detail: CrmCardFullDetail;
  onPlaybookAction: (action: PlaybookAction, title: string) => Promise<void> | void;
  playbookBusyAction: PlaybookAction | null;
}) {
  const slug = detail.coluna_slug;
  const hrs = detail.hours_since_update;
  const score = detail.score;

  // Playbook suggestions based on stage
  const playbook = useMemo(() => {
    const plays: Array<{ icon: typeof Lightbulb; title: string; desc: string; action: PlaybookAction; color: string }> = [];

    if (slug === 'novo_lead') {
      plays.push(
        { icon: MessageCircle, title: 'Primeiro contato via WhatsApp', desc: 'Envie mensagem de apresentação personalizada', action: 'whatsapp', color: CRM_THEME.green },
        { icon: Phone, title: 'Ligação de qualificação', desc: 'Descubra necessidades e orçamento do lead', action: 'call', color: CRM_THEME.blue },
      );
      if (hrs > 4) plays.push(
        { icon: AlertCircle, title: '⚡ Lead esfriando!', desc: 'Sem contato há +4h. Leads novos perdem 80% do interesse após 5 min.', action: 'urgent', color: CRM_THEME.red },
      );
    } else if (slug === 'qualificado') {
      plays.push(
        { icon: Send, title: 'Enviar proposta comercial', desc: 'Lead qualificado — próximo passo é apresentar valores', action: 'proposta', color: CRM_THEME.gold },
        { icon: FileText, title: 'Enviar caso de sucesso', desc: 'Aumente confiança com case relevante do segmento', action: 'case', color: CRM_THEME.gold },
      );
    } else if (slug === 'proposta_enviada') {
      plays.push(
        { icon: BellRing, title: 'Follow-up estratégico', desc: hrs > 24 ? 'Sem resposta há +24h — envie follow-up' : 'Aguarde 24h antes do follow-up', action: 'follow_up', color: CRM_THEME.gold },
        { icon: HandshakeIcon, title: 'Agendar reunião de fechamento', desc: 'Tire dúvidas e negocie condições', action: 'reuniao', color: CRM_THEME.gold },
      );
    } else if (slug === 'documentacao') {
      plays.push(
        { icon: FileText, title: 'Solicitar documentos pendentes', desc: 'Envie checklist de documentos necessários', action: 'docs', color: CRM_THEME.gold },
        { icon: CalendarClock, title: 'Agendar acompanhamento', desc: 'Defina prazo para recebimento dos documentos', action: 'schedule', color: CRM_THEME.gold },
      );
    }

    return plays;
  }, [slug, hrs]);

  // Sentiment analysis based on interações
  const sentiment = useMemo(() => {
    const positiveTypes = ['proposta_aceita', 'reuniao', 'documento_recebido'];
    const negativeTypes = ['proposta_recusada'];
    const interacoes = detail.interacoes ?? [];

    const positives = interacoes.filter(i => positiveTypes.includes(i.tipo)).length;
    const negatives = interacoes.filter(i => negativeTypes.includes(i.tipo)).length;
    const total = interacoes.length || 1;

    const ratio = (positives - negatives) / total;
    if (ratio > 0.2) return { label: 'Positivo', color: CRM_THEME.green, icon: TrendingUp, desc: 'Lead demonstrando interesse ativo' };
    if (ratio < -0.1) return { label: 'Risco', color: CRM_THEME.red, icon: AlertCircle, desc: 'Sinais de desinteresse detectados' };
    return { label: 'Neutro', color: CRM_THEME.gold, icon: Signal, desc: 'Precisa de mais engajamento' };
  }, [detail.interacoes]);

  // Win probability
  const winProb = useMemo(() => {
    let prob = 10;
    const stageWeight: Record<string, number> = {
      novo_lead: 10, qualificado: 30, proposta_enviada: 50, documentacao: 75, fechado: 100,
    };
    prob = stageWeight[slug] ?? 10;
    if (score >= 70) prob = Math.min(prob + 15, 95);
    if (detail.is_hot) prob = Math.min(prob + 10, 95);
    if (hrs > 72) prob = Math.max(prob - 20, 5);
    return prob;
  }, [slug, score, hrs, detail.is_hot]);

  return (
    <div className="space-y-4">
      {/* AI Copilot Header */}
      <div className="bg-gradient-to-r from-[#D4AF37]/12 to-[#D4AF37]/4 border border-[#D4AF37]/25 rounded-2xl p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/30 to-white/10 flex items-center justify-center ring-2 ring-[#D4AF37]/20">
            <Brain className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#D4AF37] flex items-center gap-2">
              AI Copilot
              <span className="px-1.5 py-0.5 bg-[#D4AF37]/15 rounded-full text-[9px] font-semibold text-[#D4AF37]/80 border border-[#D4AF37]/20">BETA</span>
            </h2>
            <p className="text-[10px] text-white/35">Insights inteligentes para fechar mais vendas</p>
          </div>
          <Sparkles className="w-4 h-4 text-[#D4AF37]/40 ml-auto animate-pulse" />
        </div>
      </div>

      {/* Win Probability */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-[#D4AF37]" />
          Probabilidade de Venda
        </h3>
        <div className="relative w-28 h-28 mx-auto">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={winProb >= 60 ? CRM_THEME.green : winProb >= 30 ? CRM_THEME.gold : CRM_THEME.red}
              strokeWidth="6" strokeDasharray={`${winProb * 2.64} 264`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{winProb}%</span>
            <span className="text-[10px] text-white/30">chance</span>
          </div>
        </div>
      </div>

      {/* Sentiment */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <Signal className="w-4 h-4 text-[#D4AF37]" />
          Análise de Sentimento
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${sentiment.color}15` }}>
            <sentiment.icon className="w-5 h-5" style={{ color: sentiment.color }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: sentiment.color }}>{sentiment.label}</p>
            <p className="text-[10px] text-white/30">{sentiment.desc}</p>
          </div>
        </div>
      </div>

      {/* AI Playbook */}
      <div className="bg-gradient-to-br from-[#D4AF37]/[0.06] to-transparent border border-[#D4AF37]/15 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4" />
          Playbook de Vendas
        </h3>
        <div className="space-y-3">
          {playbook.map((play, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPlaybookAction(play.action, play.title)}
              disabled={playbookBusyAction === play.action}
              className="w-full text-left flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${play.color}15` }}>
                <play.icon className="w-4 h-4" style={{ color: play.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/80">{play.title}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{play.desc}</p>
              </div>
              {playbookBusyAction === play.action ? (
                <Loader2 className="w-3.5 h-3.5 text-white/40 flex-shrink-0 mt-0.5 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sequence Builder Preview */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
          <Workflow className="w-4 h-4 text-[#D4AF37]" />
          Sequência Automática
        </h3>
        <div className="space-y-2">
          {[
            { day: 'Dia 1', channel: 'WhatsApp', text: 'Apresentação', icon: MessageCircle, color: CRM_THEME.green },
            { day: 'Dia 3', channel: 'Email', text: 'Envio de proposta', icon: Mail, color: CRM_THEME.gold },
            { day: 'Dia 5', channel: 'Ligação', text: 'Follow-up', icon: Phone, color: CRM_THEME.blue },
            { day: 'Dia 8', channel: 'WhatsApp', text: 'Checagem final', icon: MessageCircle, color: CRM_THEME.gold },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 text-[10px] text-white/30 text-right">{step.day}</div>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.color }} />
              {i < 3 && <div className="absolute ml-[4.75rem] mt-6 w-px h-4 bg-white/[0.06]" />}
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <step.icon className="w-3 h-3" style={{ color: step.color }} />
                <span>{step.text}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 mt-3 text-center">Automação disponível em breve</p>
      </div>
    </div>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;
  const corretorId = useCorretorId();

  const [detail, setDetail] = useState<CrmCardFullDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'files' | 'comments'>('timeline');

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [activityType, setActivityType] = useState<CrmInteracaoTipo>('nota');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);

  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ vendasMes: number; valorMes: number; valorVenda: number } | null>(null);
  const [markingSale, setMarkingSale] = useState(false);
  const [slaTime, setSlaTime] = useState('');
  const [playbookBusyAction, setPlaybookBusyAction] = useState<PlaybookAction | null>(null);

  // ── Fetch ──
  const fetchDetail = useCallback(async () => {
    if (!corretorId) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await getCardFullDetail(cardId, corretorId);
      if (res.success && res.data) setDetail(res.data);
      else toast.error(res.error ?? 'Erro ao carregar lead');
    } catch { toast.error('Erro inesperado'); }
    finally { setLoading(false); }
  }, [cardId, corretorId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // ── SLA Timer ──
  useEffect(() => {
    if (!detail) return;
    const updateSLA = () => {
      const diff = Date.now() - new Date(detail.updated_at).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setSlaTime(hrs >= 24 ? `${Math.floor(hrs / 24)}d ${hrs % 24}h` : `${hrs}h ${mins}m`);
    };
    updateSLA();
    const iv = setInterval(updateSLA, 60000);
    return () => clearInterval(iv);
  }, [detail]);

  // ── Handlers ──
  const handleSaveField = async (field: string, value: string | number) => {
    if (!detail || !corretorId) return;
    const res = await updateCardField(cardId, corretorId, field, value);
    if (res.success) { toast.success('Atualizado'); setEditingField(null); fetchDetail(); }
    else toast.error(res.error ?? 'Erro');
  };

  const handleSubmitActivity = async () => {
    if (!detail || !corretorId || !activityTitle.trim()) { toast.error('Preencha o título'); return; }
    setSubmittingActivity(true);
    const res = await addCardInteracao({
      card_id: cardId, corretor_id: corretorId, lead_id: detail.lead_id,
      tipo: activityType, titulo: activityTitle.trim(),
      descricao: activityDesc.trim() || null,
      anexo_url: null, anexo_tipo: null, status_anterior: null, status_novo: null, metadata: {},
    });
    setSubmittingActivity(false);
    if (res.success) { toast.success('Atividade registrada'); setActivityTitle(''); setActivityDesc(''); setActivityType('nota'); fetchDetail(); }
    else toast.error(res.error ?? 'Erro');
  };

  const handleMoveStage = async (newStage: KanbanColumnSlug) => {
    if (!detail || !corretorId || newStage === detail.coluna_slug) return;
    const res = await moveCardStage(cardId, corretorId, detail.coluna_slug, newStage);
    if (res.success) { toast.success(`Movido para ${STAGE_CONFIG[newStage].label}`); fetchDetail(); }
    else toast.error(res.error ?? 'Erro ao mover');
  };

  const handleMarkSale = async () => {
    if (!detail || !corretorId) return;
    setMarkingSale(true);
    const res = await markCardAsSold(cardId, corretorId, detail.valor_estimado ?? 0);
    setMarkingSale(false);
    if (res.success && res.data) {
      setCelebrationData({ vendasMes: res.data.vendasMes, valorMes: res.data.valorMes, valorVenda: detail.valor_estimado ?? 0 });
      setShowCelebration(true); fetchDetail();
    } else toast.error(res.error ?? 'Erro ao registrar venda');
  };

  const handleWhatsApp = async () => {
    if (!detail?.lead?.whatsapp || !corretorId) return;
    const phone = normalizeWhatsAppPhone(detail.lead.whatsapp);
    if (!phone) {
      toast.error('WhatsApp inválido para este lead.');
      return;
    }
    await trackWhatsAppAction(cardId, corretorId, '', {
      leadId: detail.lead_id,
      metadata: { source: 'quick_action' },
    });
    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
    toast.success('WhatsApp aberto'); fetchDetail();
  };

  const handleWhatsAppClick = useCallback(async ({
    message,
    phase,
    dayId,
    dayLabel,
  }: PlaybookSendPayload) => {
    if (!detail || !corretorId) {
      toast.error('Sessão de corretor não encontrada.');
      return;
    }

    const phone = normalizeWhatsAppPhone(detail.lead?.whatsapp);
    if (!phone) {
      toast.error('Lead sem WhatsApp válido.');
      return;
    }

    const finalMessage = message.trim();
    if (!finalMessage) {
      toast.error('Mensagem vazia para envio.');
      return;
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`,
      '_blank',
      'noopener,noreferrer',
    );

    const track = await trackWhatsAppAction(cardId, corretorId, finalMessage, {
      leadId: detail.lead_id,
      interactionTitle: 'Playbook de Vendas (WhatsApp)',
      metadata: {
        source: 'sales_playbook',
        phase,
        day_id: dayId,
        day_label: dayLabel,
      },
    });

    if (!track.success) {
      toast.error(track.error ?? 'Nao foi possivel registrar a interacao.');
      return;
    }

    toast.success('Mensagem preparada no WhatsApp.');
    fetchDetail();
  }, [cardId, corretorId, detail, fetchDetail]);

  const registerPlaybookInteraction = useCallback(async (
    tipo: CrmInteracaoTipo,
    titulo: string,
    descricao: string,
    metadata: Record<string, unknown>,
  ) => {
    if (!detail || !corretorId) return;
    await addCardInteracao({
      card_id: cardId,
      corretor_id: corretorId,
      lead_id: detail.lead_id,
      tipo,
      titulo,
      descricao,
      anexo_url: null,
      anexo_tipo: null,
      status_anterior: null,
      status_novo: null,
      metadata,
    });
  }, [cardId, corretorId, detail]);

  const handlePlaybookAction = useCallback(async (action: PlaybookAction, title: string) => {
    if (!detail || !corretorId) {
      toast.error('Sessão de corretor não encontrada.');
      return;
    }

    const phone = normalizeWhatsAppPhone(detail.lead?.whatsapp);
    const email = detail.lead?.email ?? '';
    const leadFirstName = detail.lead?.nome?.trim().split(/\s+/)[0] ?? 'cliente';

    const runWhatsAppAction = async (
      message: string,
      interactionType: CrmInteracaoTipo = 'whatsapp',
      interactionTitle = title,
    ) => {
      if (!phone) {
        try {
          await navigator.clipboard.writeText(message);
        } catch {
          // Em ambientes sem permissão de clipboard, ao menos registramos a ação.
        }
        await registerPlaybookInteraction(
          interactionType,
          `${interactionTitle} (copiado)`,
          message,
          { source: 'ai_playbook', action, fallback: 'clipboard' },
        );
        toast.info('Lead sem WhatsApp. Mensagem copiada para área de transferência.');
        return;
      }

      await trackWhatsAppAction(cardId, corretorId, message, {
        leadId: detail.lead_id,
        metadata: { source: 'ai_playbook', action, interaction_type: interactionType },
      });
      if (interactionType !== 'whatsapp') {
        await registerPlaybookInteraction(
          interactionType,
          interactionTitle,
          message,
          { source: 'ai_playbook', action },
        );
      }

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      toast.success('Ação do playbook executada no WhatsApp.');
    };

    const runEmailAction = async (subject: string, body: string) => {
      if (!email) return false;
      const trackRes = await trackEmailAction(cardId, corretorId, email, subject, body);
      if (!trackRes.success) {
        toast.error(trackRes.error ?? 'Erro ao rastrear email');
        return false;
      }
      window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      toast.success('Email preparado para envio.');
      return true;
    };

    const runCallAction = async () => {
      if (!phone) {
        toast.error('Lead sem telefone para ligação.');
        return;
      }
      await registerPlaybookInteraction(
        'ligacao',
        title,
        'Ligação iniciada via playbook de vendas',
        { source: 'ai_playbook', action },
      );
      window.open(`tel:+${phone}`, '_self');
      toast.success('Abrindo discador.');
    };

    try {
      setPlaybookBusyAction(action);

      if (action === 'whatsapp') {
        await runWhatsAppAction(
          `Olá, ${leadFirstName}! Aqui é da Humano Saúde. Posso te enviar uma análise rápida para reduzir seu custo com plano de saúde?`,
        );
        return;
      }

      if (action === 'call') {
        await runCallAction();
        return;
      }

      if (action === 'urgent') {
        await runWhatsAppAction(
          `Oi, ${leadFirstName}! Vi seu interesse e já separei opções com potencial de economia. Me confirma se posso te enviar agora?`,
          'follow_up',
          title,
        );
        return;
      }

      if (action === 'proposta') {
        const proposalSubject = `Proposta Humano Saúde para ${detail.lead?.nome ?? 'sua empresa'}`;
        const proposalBody = `Olá, ${leadFirstName}!\n\nConforme alinhamos, segue a proposta com opções de plano e estimativa de economia.\n\nSe preferir, posso explicar os detalhes agora por WhatsApp.\n\nAtenciosamente,\nTime Humano Saúde`;
        const emailSent = await runEmailAction(proposalSubject, proposalBody);
        if (!emailSent) {
          await runWhatsAppAction(
            `Olá, ${leadFirstName}! Preparei sua proposta e posso te enviar agora pelo WhatsApp com todos os detalhes. Posso seguir?`,
            'proposta_enviada',
            title,
          );
        } else {
          await registerPlaybookInteraction(
            'proposta_enviada',
            title,
            'Proposta iniciada por email via playbook',
            { source: 'ai_playbook', action, channel: 'email' },
          );
        }
        return;
      }

      if (action === 'case') {
        await runWhatsAppAction(
          `Tenho um caso real de empresa com perfil parecido com o seu que reduziu custo sem perder cobertura. Quer que eu te envie o resumo agora?`,
        );
        return;
      }

      if (action === 'follow_up') {
        await runWhatsAppAction(
          `Olá, ${leadFirstName}! Passando para confirmar se conseguiu analisar a proposta. Posso te ajudar a validar os próximos passos?`,
          'follow_up',
          title,
        );
        return;
      }

      if (action === 'reuniao') {
        await runWhatsAppAction(
          `Podemos agendar uma conversa rápida para fechar sua proposta? Tenho horários hoje e amanhã.`,
          'reuniao',
          title,
        );
        return;
      }

      if (action === 'docs') {
        await runWhatsAppAction(
          `Para avançarmos, preciso dos documentos pendentes: contrato social/cartão CNPJ e IDs dos sócios/beneficiários. Posso te mandar o checklist completo?`,
          'documento_enviado',
          title,
        );
        return;
      }

      if (action === 'schedule') {
        await registerPlaybookInteraction(
          'tarefa',
          title,
          'Acompanhamento de documentação agendado via playbook',
          { source: 'ai_playbook', action, due_hint: '24h' },
        );
        await runWhatsAppAction(
          `Perfeito, ${leadFirstName}. Vou acompanhar sua documentação e te retorno em até 24h para concluirmos o envio da proposta.`,
          'follow_up',
          title,
        );
      }
    } catch {
      toast.error('Não foi possível executar esta ação do playbook.');
    } finally {
      setPlaybookBusyAction(null);
      fetchDetail();
    }
  }, [cardId, corretorId, detail, fetchDetail, registerPlaybookInteraction]);

  // ── Computed ──
  const leadTemp = useMemo(() => {
    if (!detail) return { label: '—', color: CRM_THEME.gray, icon: Signal };
    const s = detail.score ?? 0;
    const h = detail.hours_since_update;
    if (detail.coluna_slug === 'fechado') return { label: 'Convertido', color: CRM_THEME.green, icon: Crown };
    if (detail.coluna_slug === 'perdido') return { label: 'Perdido', color: CRM_THEME.red, icon: CircleX };
    if (s >= 80 || detail.is_hot) return { label: 'Quente', color: CRM_THEME.red, icon: Flame };
    if (s >= 50 && h < 48) return { label: 'Morno', color: CRM_THEME.gold, icon: ThermometerSun };
    if (s >= 30) return { label: 'Frio', color: CRM_THEME.blue, icon: Signal };
    return { label: 'Gelado', color: CRM_THEME.gray, icon: Signal };
  }, [detail]);

  const stageProgress = useMemo(() => {
    if (!detail) return 0;
    const idx = STAGE_ORDER.indexOf(detail.coluna_slug);
    return idx === -1 ? 0 : (idx / (STAGE_ORDER.length - 1)) * 100;
  }, [detail]);

  const engScore = useMemo(() => {
    if (!detail) return 0;
    let s = Math.min((detail.interacoes?.length ?? 0) * 10, 40);
    s += Math.min((detail.tasks?.length ?? 0) * 5, 15);
    if (detail.interacoes?.some(i => i.tipo === 'proposta_enviada')) s += 25;
    if (detail.is_hot) s += 20;
    return Math.min(s, 100);
  }, [detail]);

  // ── Loading / Error ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto">
          <div className="w-6 h-6 border-2 border-[#D4AF37]/40 border-t-[#D4AF37] rounded-full animate-spin" />
        </div>
        <p className="text-white/40 text-sm">Carregando detalhes...</p>
      </div>
    </div>
  );

  if (!detail) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white/60">Lead não encontrado</p>
        <button onClick={() => router.push('/dashboard/corretor/crm')}
          className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-white/60 text-sm transition-colors">
          ← Voltar ao CRM
        </button>
      </div>
    </div>
  );

  const stageConf = STAGE_CONFIG[detail.coluna_slug] ?? STAGE_CONFIG.novo_lead;
  const prioConf = PRIORITY_CFG[detail.prioridade] ?? PRIORITY_CFG.media;

  // ════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════
  return (
    <>
      <AnimatePresence>
        {showCelebration && celebrationData && (
          <SaleCelebration {...celebrationData} onClose={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>

      <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-5">

        {/* ══ TOP BAR ══ */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard/corretor/crm')}
              className="p-2.5 hover:bg-white/[0.06] rounded-xl transition-colors border border-transparent hover:border-white/[0.06]">
              <ArrowLeft className="w-5 h-5 text-white/50" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                {editingField === 'titulo' ? (
                  <div className="flex items-center gap-2">
                    <input className="text-xl font-bold bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-white"
                      value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                    <button onClick={() => handleSaveField('titulo', editValue)} className="p-1.5 hover:bg-emerald-500/20 rounded-lg"><Check className="w-4 h-4 text-emerald-400" /></button>
                    <button onClick={() => setEditingField(null)} className="p-1.5 hover:bg-red-500/20 rounded-lg"><X className="w-4 h-4 text-red-400" /></button>
                  </div>
                ) : (
                  <h1 className="text-xl md:text-2xl font-bold text-white cursor-pointer hover:text-[#D4AF37] transition-colors group flex items-center gap-2"
                    onClick={() => { setEditingField('titulo'); setEditValue(detail.titulo); }}>
                    {detail.titulo}
                    <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </h1>
                )}
                {/* Temperature Badge */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: `${leadTemp.color}15`, color: leadTemp.color, border: `1px solid ${leadTemp.color}30` }}>
                  <leadTemp.icon className="w-3 h-3" />
                  {leadTemp.label}
                </div>
                {/* Priority Badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${prioConf.color} bg-white/[0.04] border border-white/[0.06]`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${prioConf.dot}`} />
                  {prioConf.label}
                </div>
              </div>
              <p className="text-sm text-white/40 mt-0.5 flex items-center gap-1.5">
                <User className="w-3 h-3" />
                {detail.lead?.nome ?? 'Sem nome'}
                {detail.subtitulo && <> • {detail.subtitulo}</>}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {detail.lead?.whatsapp && (
              <button onClick={handleWhatsApp}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/20 rounded-xl text-[#10B981] text-sm font-medium transition-all hover:shadow-lg hover:shadow-[#10B981]/10">
                <WhatsAppIcon className="w-4 h-4" /> WhatsApp
              </button>
            )}
            {detail.lead?.email && (
              <button onClick={() => setShowEmailComposer(!showEmailComposer)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-400 text-sm font-medium transition-all">
                <Mail className="w-4 h-4" /> Email
              </button>
            )}
            {detail.coluna_slug !== 'fechado' && detail.coluna_slug !== 'perdido' && (
              <motion.button onClick={handleMarkSale} disabled={markingSale}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] hover:brightness-110 text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50">
                <Crown className="w-4 h-4" />
                {markingSale ? 'Registrando...' : 'Fechar Venda'}
              </motion.button>
            )}
          </div>
        </div>

        {/* ══ EMAIL COMPOSER ══ */}
        <AnimatePresence>
          {showEmailComposer && detail.lead?.email && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <EmailComposer leadEmail={detail.lead.email} cardId={cardId} corretorId={corretorId}
                onSent={() => { setShowEmailComposer(false); fetchDetail(); }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ FUNNEL PROGRESS ══ */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              Progresso no Funil
            </h3>
            <span className="text-[10px] text-white/30">Clique para mover</span>
          </div>
          <div className="relative">
            <div className="absolute top-6 left-[5%] right-[5%] h-[3px] bg-white/[0.06] rounded-full">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E]"
                initial={{ width: 0 }} animate={{ width: `${stageProgress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
            </div>
            <div className="flex justify-between relative">
              {STAGE_ORDER.map((slug, i) => {
                const conf = STAGE_CONFIG[slug];
                const isCurrent = detail.coluna_slug === slug;
                const isPast = STAGE_ORDER.indexOf(detail.coluna_slug) > i;
                const isClickable = slug !== detail.coluna_slug;
                return (
                  <button key={slug} onClick={() => isClickable && handleMoveStage(slug)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center gap-2 relative z-10 transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-110' : ''} ${isCurrent ? 'scale-110' : ''}`}>
                    <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all"
                      style={isCurrent ? { borderColor: conf.color, backgroundColor: conf.bg, boxShadow: `0 0 24px ${conf.color}30` }
                        : isPast ? { borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.1)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                      whileHover={isClickable ? { y: -2 } : {}}>
                      {isPast ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        : <StageIcon slug={slug} className={`w-5 h-5 ${isCurrent ? '' : 'text-white/30'}`}
                            style={isCurrent ? { color: conf.color } : undefined} />}
                    </motion.div>
                    <span className={`text-[10px] font-medium text-center max-w-[80px] leading-tight ${isCurrent ? 'text-white' : 'text-white/30'}`}>
                      {conf.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ 3-COLUMN LAYOUT ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── LEFT: Lead Info + Metrics ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Lead Card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" /> Informações
              </h3>
              {[
                { val: detail.lead?.nome, label: 'Nome', icon: User, color: CRM_THEME.gold },
                { val: detail.lead?.whatsapp, label: 'WhatsApp', icon: Phone, color: CRM_THEME.green },
                { val: detail.lead?.email, label: 'Email', icon: Mail, color: CRM_THEME.blue },
                { val: detail.lead?.operadora_atual, label: 'Operadora', icon: Building2, color: CRM_THEME.gold },
                { val: detail.lead?.valor_atual ? `R$ ${Number(detail.lead.valor_atual).toLocaleString('pt-BR')}` : null, label: 'Valor Atual', icon: DollarSign, color: CRM_THEME.green },
                { val: detail.lead?.tipo_contratacao, label: 'Tipo Contratação', icon: Briefcase, color: CRM_THEME.blue },
              ].filter(r => r.val).map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${row.color}15` }}>
                    <row.icon className="w-4 h-4" style={{ color: row.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-white/30">{row.label}</p>
                    <p className="text-sm text-white/80 font-medium truncate">{row.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Origem do Lead — EDITÁVEL */}
            <OrigemCard detail={detail} cardId={cardId} corretorId={corretorId} onRefresh={fetchDetail} />

            {/* SLA */}
            <div className={`bg-white/[0.02] border rounded-2xl p-5 ${
              detail.hours_since_update > 48 ? 'border-red-500/30' : detail.hours_since_update > 24 ? 'border-[#D4AF37]/30' : 'border-white/[0.06]'
            }`}>
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-[#D4AF37]" /> SLA
              </h3>
              <p className={`text-3xl font-bold tracking-tight ${
                detail.hours_since_update > 48 ? 'text-red-400' : detail.hours_since_update > 24 ? 'text-[#D4AF37]' : 'text-emerald-400'
              }`}>{slaTime}</p>
              <p className="text-[10px] text-white/30 mt-1">
                {detail.hours_since_update > 48 ? 'Urgente — lead esfriando!' :
                 detail.hours_since_update > 24 ? 'Atenção — contate em breve' : 'Lead ativo'}
              </p>
            </div>

            {/* Engagement */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-[#D4AF37]" /> Engajamento
              </h3>
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#D4AF37" strokeWidth="5"
                    strokeDasharray={`${engScore * 2.64} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{engScore}</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-3 text-[10px] text-white/30">
                <span>{detail.total_interacoes} interações</span>
                <span>{detail.tasks?.length ?? 0} tarefas</span>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> Detalhes
              </h3>
              <div>
                <p className="text-[10px] text-white/30 mb-1">Valor Estimado</p>
                {editingField === 'valor_estimado' ? (
                  <div className="flex items-center gap-1">
                    <input type="number" className="w-full px-2 py-1 bg-white/[0.06] border border-white/[0.1] rounded-lg text-white text-sm"
                      value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                    <button onClick={() => handleSaveField('valor_estimado', Number(editValue))} className="p-1"><Check className="w-3 h-3 text-emerald-400" /></button>
                    <button onClick={() => setEditingField(null)} className="p-1"><X className="w-3 h-3 text-red-400" /></button>
                  </div>
                ) : (
                  <p className="text-sm text-white font-medium cursor-pointer hover:text-[#D4AF37] transition-colors"
                    onClick={() => { setEditingField('valor_estimado'); setEditValue(String(detail.valor_estimado ?? '')); }}>
                    R$ {(detail.valor_estimado ?? 0).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-white/30 mb-1">Prioridade</p>
                <select value={detail.prioridade} onChange={(e) => handleSaveField('prioridade', e.target.value)}
                  className="w-full px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm cursor-pointer">
                  <option value="baixa">🟢 Baixa</option>
                  <option value="media">🟡 Média</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="urgente">🔴 Urgente</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] text-white/30 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {(detail.tags ?? []).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[10px] text-[#D4AF37] font-medium">{tag}</span>
                  ))}
                  {(!detail.tags || detail.tags.length === 0) && <span className="text-[10px] text-white/15">Sem tags</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/30 mb-1">Criado em</p>
                <p className="text-sm text-white/50">{new Date(detail.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* ── CENTER: Activity + Tabs ── */}
          <div className="lg:col-span-6 space-y-4">
            {/* Activity Form — ALWAYS VISIBLE */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#D4AF37]" /> Registrar Atividade
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(['nota','ligacao','whatsapp','email','reuniao','proposta_enviada','follow_up','visita'] as CrmInteracaoTipo[]).map((tipo) => {
                  const c = INTERACAO_CFG[tipo];
                  const Ic = c.Icon;
                  return (
                    <button key={tipo} onClick={() => setActivityType(tipo)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${activityType === tipo ? 'border text-white' : 'bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.06]'}`}
                      style={activityType === tipo ? { backgroundColor: `${c.color}15`, borderColor: `${c.color}40`, color: c.color } : {}}>
                      <Ic className="w-3.5 h-3.5" /> {c.label}
                    </button>
                  );
                })}
              </div>
              <input type="text" placeholder="Título da atividade..." value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40 mb-2" />
              <textarea placeholder="Detalhes (opcional)..." value={activityDesc}
                onChange={(e) => setActivityDesc(e.target.value)} rows={2}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/40 resize-none" />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-[10px] text-white/20">
                  <Mic className="w-3.5 h-3.5" /> Voice-to-text em breve
                </div>
                <button onClick={handleSubmitActivity} disabled={submittingActivity || !activityTitle.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold rounded-xl text-sm transition-colors disabled:opacity-40">
                  <Send className="w-4 h-4" /> {submittingActivity ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
              {([
                { key: 'timeline' as const, label: 'Timeline', Icon: Activity },
                { key: 'tasks' as const, label: 'Tarefas', Icon: ListChecks },
                { key: 'files' as const, label: 'Arquivos', Icon: Paperclip },
                { key: 'comments' as const, label: 'Notas', Icon: MessageSquare },
              ]).map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20 shadow-sm shadow-[#D4AF37]/10'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}>
                  <tab.Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              {activeTab === 'timeline' && <TimelineView interacoes={detail.interacoes} />}
              {activeTab === 'tasks' && <TasksPanel tasks={detail.tasks ?? []} cardId={cardId} corretorId={corretorId} />}
              {activeTab === 'files' && <FilesPanel files={detail.files ?? []} />}
              {activeTab === 'comments' && <CommentsPanel comments={detail.comments ?? []} cardId={cardId} corretorId={corretorId} onRefresh={fetchDetail} />}
            </div>
          </div>

          {/* ── RIGHT: AI Copilot + Stage ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Scanner Inteligente no painel do cliente */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Scanner Inteligente
              </h3>
              <ClientScannerQuickPanel
                context="corretor"
                corretorId={corretorId}
                leadId={detail.lead_id || null}
                leadName={detail.lead?.nome || detail.titulo}
                compact
              />
            </div>

            {/* Current Stage */}
            <div className="rounded-2xl p-5 border" style={{ backgroundColor: stageConf.bg, borderColor: `${stageConf.color}25` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stageConf.color}20` }}>
                  <StageIcon slug={detail.coluna_slug} className="w-6 h-6" style={{ color: stageConf.color }} />
                </div>
                <div>
                  <p className="text-[10px] font-medium" style={{ color: `${stageConf.color}99` }}>Estágio Atual</p>
                  <p className="text-lg font-bold" style={{ color: stageConf.color }}>{stageConf.label}</p>
                </div>
              </div>
              {detail.coluna_slug !== 'fechado' && detail.coluna_slug !== 'perdido' && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {STAGE_ORDER.filter(s => s !== detail.coluna_slug).map((slug) => (
                    <button key={slug} onClick={() => handleMoveStage(slug)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] rounded-lg text-[10px] text-white/50 hover:text-white/80 transition-all border border-transparent hover:border-white/[0.08]">
                      <ChevronRight className="w-3 h-3" /> {STAGE_CONFIG[slug].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Playbook Cadenciado */}
            <PlaybookActions
              cardId={cardId}
              leadId={detail.lead_id ?? null}
              leadName={detail.lead?.nome ?? detail.titulo}
              leadWhatsapp={detail.lead?.whatsapp ?? null}
              companyProfile={detail.lead?.tipo_contratacao ?? detail.lead?.origem ?? null}
              currentPrice={detail.lead?.valor_atual ?? null}
              estimatedEconomy={
                typeof detail.lead?.valor_atual === 'number' && typeof detail.valor_estimado === 'number'
                  ? Math.max(detail.lead.valor_atual - detail.valor_estimado, 0)
                  : null
              }
              onWhatsAppClick={handleWhatsAppClick}
            />

            {/* AI Copilot */}
            <AICopilot
              detail={detail}
              onPlaybookAction={handlePlaybookAction}
              playbookBusyAction={playbookBusyAction}
            />

            {/* Quick Stats */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> Resumo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { n: detail.total_interacoes, l: 'Interações', icon: Activity },
                  { n: detail.tasks?.length ?? 0, l: 'Tarefas', icon: ListChecks },
                  { n: detail.files?.length ?? 0, l: 'Arquivos', icon: Paperclip },
                  { n: detail.comments?.length ?? 0, l: 'Notas', icon: MessageSquare },
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <s.icon className="w-4 h-4 text-white/20 mx-auto mb-1" />
                    <p className="text-xl font-bold text-white">{s.n}</p>
                    <p className="text-[9px] text-white/25">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage History */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#D4AF37]" /> Histórico
              </h3>
              <div className="space-y-2">
                {(detail.stage_history ?? []).length === 0 ? (
                  <p className="text-xs text-white/15">Sem movimentações</p>
                ) : (
                  (detail.stage_history ?? []).slice(-8).map((h, i) => {
                    const from = STAGE_CONFIG[h.status_anterior as KanbanColumnSlug];
                    const to = STAGE_CONFIG[h.status_novo as KanbanColumnSlug];
                    return (
                      <div key={h.id ?? i} className="flex items-center gap-2 text-xs">
                        <span className="text-white/20 w-12 flex-shrink-0 text-[10px]">
                          {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <span style={{ color: from?.color ?? '#6B7280' }} className="text-[10px]">{from?.label ?? h.status_anterior ?? '—'}</span>
                        <ChevronRight className="w-3 h-3 text-white/15" />
                        <span style={{ color: to?.color ?? '#6B7280' }} className="text-[10px]">{to?.label ?? h.status_novo ?? '—'}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Mark as Lost */}
            {detail.coluna_slug !== 'fechado' && detail.coluna_slug !== 'perdido' && (
              <button onClick={() => handleMoveStage('perdido' as KanbanColumnSlug)}
                className="w-full py-2.5 border border-red-500/15 bg-red-500/[0.04] hover:bg-red-500/10 rounded-xl text-xs text-red-400/70 hover:text-red-400 font-medium transition-colors flex items-center justify-center gap-1.5">
                <CircleX className="w-3.5 h-3.5" /> Marcar como Perdido
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ========================================
// TIMELINE VIEW
// ========================================

function TimelineView({ interacoes }: { interacoes: CrmInteracao[] }) {
  if (!interacoes || interacoes.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-10 h-10 mx-auto mb-2 text-white/10" />
        <p className="text-sm text-white/25">Nenhuma atividade registrada</p>
        <p className="text-xs text-white/15 mt-1">Use o formulário acima para começar</p>
      </div>
    );
  }

  const grouped = interacoes.reduce<Record<string, CrmInteracao[]>>((acc, i) => {
    const date = new Date(i.created_at).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-white/25" />
            <span className="text-xs font-medium text-white/25">{date}</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>
          <div className="space-y-2.5 pl-3 border-l-2 border-white/[0.06]">
            {items.map((item) => {
              const cfg = INTERACAO_CFG[item.tipo] ?? INTERACAO_CFG.nota;
              const Ic = cfg.Icon;
              return (
                <div key={item.id} className="relative pl-5">
                  <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cfg.color}20` }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Ic className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      {item.metadata && typeof item.metadata === 'object' && 'tracked' in (item.metadata as object) && (item.metadata as Record<string, boolean>).tracked === true && (
                        <span className="text-[9px] text-emerald-400/60 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-medium">Rastreado</span>
                      )}
                      <span className="text-[10px] text-white/15 ml-auto">
                        {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {item.titulo && <p className="text-sm text-white/75 font-medium">{item.titulo}</p>}
                    {item.descricao && <p className="text-xs text-white/35 mt-1 line-clamp-3">{item.descricao}</p>}
                    {item.tipo === 'status_change' && item.status_anterior && item.status_novo && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 rounded-lg" style={{
                          backgroundColor: STAGE_CONFIG[item.status_anterior as KanbanColumnSlug]?.bg ?? 'rgba(107,114,128,0.1)',
                          color: STAGE_CONFIG[item.status_anterior as KanbanColumnSlug]?.color ?? '#6B7280',
                        }}>
                          {STAGE_CONFIG[item.status_anterior as KanbanColumnSlug]?.label ?? item.status_anterior}
                        </span>
                        <ChevronRight className="w-3 h-3 text-white/15" />
                        <span className="px-2 py-0.5 rounded-lg" style={{
                          backgroundColor: STAGE_CONFIG[item.status_novo as KanbanColumnSlug]?.bg ?? 'rgba(107,114,128,0.1)',
                          color: STAGE_CONFIG[item.status_novo as KanbanColumnSlug]?.color ?? '#6B7280',
                        }}>
                          {STAGE_CONFIG[item.status_novo as KanbanColumnSlug]?.label ?? item.status_novo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
