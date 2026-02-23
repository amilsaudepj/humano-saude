'use client';

import { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Loader2, CheckCircle, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface EmailRow {
  id: string;
  email: string;
  created_at: string;
}

interface PendingRequest {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export default function DesignSystemEmailsPage() {
  const [list, setList] = useState<EmailRow[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [listRes, pendingRes] = await Promise.all([
        fetch('/api/admin/design-system-emails', { credentials: 'include' }),
        fetch('/api/admin/design-system-emails/requests', { credentials: 'include' }),
      ]);
      if (!listRes.ok && listRes.status === 401) {
        toast.error('Não autorizado');
        setLoading(false);
        return;
      }
      const listData = listRes.ok ? await listRes.json() : { data: [] };
      setList(listData.data || []);

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPending(pendingData.data || []);
      } else {
        setPending([]);
      }
    } catch (e) {
      toast.error('Erro ao carregar lista');
      setList([]);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/design-system-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao adicionar');
        return;
      }
      toast.success('E-mail adicionado');
      setNewEmail('');
      load();
    } catch {
      toast.error('Erro ao adicionar');
    } finally {
      setAdding(false);
    }
  }

  async function handleApproveRequest(requestId: string) {
    setApprovingId(requestId);
    try {
      const res = await fetch('/api/admin/design-system-emails/approve-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao aprovar');
        return;
      }
      toast.success('Acesso aprovado');
      load();
    } catch {
      toast.error('Erro ao aprovar');
    } finally {
      setApprovingId(null);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remover este e-mail da lista de acesso ao Design System?')) return;
    try {
      const res = await fetch(`/api/admin/design-system-emails?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('E-mail removido');
      load();
    } catch {
      toast.error('Erro ao remover');
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          E-MAILS DESIGN SYSTEM
        </h1>
        <p className="text-gray-400 mt-2">
          E-mails aprovados para acessar a página <strong className="text-white">/design-system</strong> (identidade visual). Aprove solicitações pendentes ou adicione manualmente.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 overflow-hidden">
          <h2 className="text-lg font-semibold text-white p-4 border-b border-white/10 flex items-center gap-2">
            <Inbox className="h-5 w-5 text-[#D4AF37]" />
            Solicitações pendentes ({pending.length})
          </h2>
          <ul className="divide-y divide-white/10">
            {pending.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/5"
              >
                <span className="text-white font-mono text-sm">{row.email}</span>
                <span className="text-gray-500 text-xs">
                  {row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleApproveRequest(row.id)}
                  disabled={approvingId === row.id}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-black hover:bg-[#c49b2e] disabled:opacity-50"
                >
                  {approvingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Aprovar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-[#D4AF37]" />
          Adicionar e-mail
        </h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="rounded-lg border border-white/20 bg-black/30 px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none min-w-[260px]"
          />
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#c49b2e] disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <h2 className="text-lg font-semibold text-white p-4 border-b border-white/10">
          Lista de e-mails com acesso ({list.length})
        </h2>
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : list.length === 0 ? (
          <p className="p-6 text-gray-500">Nenhum e-mail aprovado ainda. Adicione acima.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/5"
              >
                <span className="text-white font-mono text-sm">{row.email}</span>
                <span className="text-gray-500 text-xs">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : ''}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(row.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
