'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { getNotificacoes, markNotificacaoAsRead, getNotificacaoCount } from '@/app/actions/notifications';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const POLL_INTERVAL = 25_000;

const TIPO_CONFIG: Record<string, { bg: string; border: string }> = {
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30' },
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

export type NotificacaoItem = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  link: string | null;
  created_at: string;
};

interface NotificationBannerFloatingProps {
  /** Caminho da página de histórico (ex: /portal-interno-hks-2026/notificacoes ou /dashboard/corretor/notificacoes) */
  notificacoesPath: string;
  className?: string;
}

export default function NotificationBannerFloating({
  notificacoesPath,
  className,
}: NotificationBannerFloatingProps) {
  const router = useRouter();
  const [unread, setUnread] = useState<NotificacaoItem[]>([]);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    const [listRes, countRes] = await Promise.all([
      getNotificacoes({ lida: false, limit: 10 }),
      getNotificacaoCount(),
    ]);
    if (listRes.success && listRes.data) {
      setUnread((listRes.data as NotificacaoItem[]).filter((n) => !n.lida));
    }
    if (countRes.success) setCount(countRes.count ?? 0);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [load]);

  async function handleDescartar(n: NotificacaoItem) {
    const res = await markNotificacaoAsRead(n.id);
    if (res.success) {
      setUnread((prev) => prev.filter((x) => x.id !== n.id));
      setCount((c) => Math.max(0, c - 1));
    }
  }

  function handleVisualizar(n: NotificacaoItem) {
    if (n.link?.trim()) {
      router.push(n.link.trim());
    } else {
      router.push(notificacoesPath);
    }
    markNotificacaoAsRead(n.id).then(() => {
      setUnread((prev) => prev.filter((x) => x.id !== n.id));
      setCount((c) => Math.max(0, c - 1));
    });
    setExpanded(false);
  }

  const hasNew = unread.length > 0;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2',
        className,
      )}
      aria-live="polite"
    >
      <AnimatePresence>
        {hasNew && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            {/* Cabeçalho: alerta + toggle */}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] rounded-t-2xl"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/20">
                <Bell className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  {count === 1 ? '1 notificação nova' : `${count} notificações novas`}
                </p>
                <p className="text-xs text-white/50">
                  {expanded ? 'Clique para recolher' : 'Clique para ver'}
                </p>
              </div>
              <span className="text-white/40">
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            </button>

            {/* Lista de não lidas */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/10"
                >
                  <div className="max-h-[320px] overflow-y-auto overscroll-contain p-2">
                    {unread.length === 0 ? (
                      <p className="py-4 text-center text-sm text-white/40">
                        Nenhuma não lida
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {unread.map((n) => {
                          const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
                          return (
                            <li
                              key={n.id}
                              className={cn(
                                'rounded-xl border p-3',
                                config.bg,
                                config.border,
                              )}
                            >
                              <p className="text-sm font-medium text-white line-clamp-1">
                                {n.titulo}
                              </p>
                              {n.mensagem && (
                                <p className="mt-0.5 text-xs text-white/60 line-clamp-2">
                                  {n.mensagem}
                                </p>
                              )}
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-white/40">
                                  {timeAgo(n.created_at)}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDescartar(n)}
                                    className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/15 transition-colors"
                                    title="Descartar (some do alerta e fica só no histórico)"
                                  >
                                    <X className="h-3 w-3" />
                                    Descartar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVisualizar(n)}
                                    className="flex items-center gap-1 rounded-lg bg-[#D4AF37]/20 px-2.5 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Visualizar
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="border-t border-white/10 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExpanded(false);
                        router.push(notificacoesPath);
                      }}
                      className="w-full rounded-lg py-2 text-center text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                    >
                      Ver histórico de notificações →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
