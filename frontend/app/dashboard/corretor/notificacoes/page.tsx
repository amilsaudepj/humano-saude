'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { getNotificacoes, markNotificacaoAsRead, markAllNotificacoesAsRead, getNotificacaoCount } from '@/app/actions/notifications';
import { toast } from 'sonner';

export default function CorretorNotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'todas' | 'nao_lidas'>('todas');
  const [loading, setLoading] = useState(true);

  async function load() {
    const [nRes, cRes] = await Promise.all([
      getNotificacoes(),
      getNotificacaoCount(),
    ]);
    if (nRes.success) setNotificacoes(nRes.data || []);
    if (cRes.success) setUnreadCount(cRes.count || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleMarkRead(id: string) {
    const result = await markNotificacaoAsRead(id);
    if (result.success) {
      toast.success('Notificação marcada como lida');
      load();
    }
  }

  async function handleMarkAllRead() {
    const result = await markAllNotificacoesAsRead();
    if (result.success) {
      toast.success('Todas marcadas como lidas');
      load();
    }
  }

  const iconMap: Record<string, typeof Info> = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
  };

  const colorMap: Record<string, string> = {
    info: 'text-blue-400 bg-blue-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
    error: 'text-red-400 bg-red-500/10',
    success: 'text-green-400 bg-green-500/10',
  };

  const filtered = filter === 'nao_lidas'
    ? notificacoes.filter((n) => !n.read)
    : notificacoes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Notificações</h1>
            <p className="text-sm text-white/50">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Tudo em dia!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('todas')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'todas' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('nao_lidas')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            filter === 'nao_lidas' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Não lidas {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40">
              {filter === 'nao_lidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const NIcon = iconMap[n.type || 'info'] || Info;
            const colors = colorMap[n.type || 'info'] || colorMap.info;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  n.read
                    ? 'bg-white/[0.02] border-white/5'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
                  <NIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-white/70' : 'text-white font-medium'}`}>
                    {n.title || n.message}
                  </p>
                  {n.title && n.message && (
                    <p className="text-xs text-white/40 mt-1">{n.message}</p>
                  )}
                  <p className="text-[10px] text-white/30 mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleString('pt-BR') : ''}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4 text-white/40" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
