'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, X, Loader2 } from 'lucide-react';

type UserItem = {
  id: string;
  email: string;
  nome: string;
  role: string;
};

type AllowedItem = {
  id: string;
  corretor_email: string;
  allowed_email: string;
  allowed_nome: string;
  created_at: string;
};

export default function ChatPermissoesPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [allowed, setAllowed] = useState<AllowedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [selectedAdd, setSelectedAdd] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, allowedRes] = await Promise.all([
        fetch('/api/admin/chat/users', { credentials: 'include' }),
        fetch('/api/admin/chat/allowed', { credentials: 'include' }),
      ]);
      if (!usersRes.ok) throw new Error(usersRes.status === 403 ? 'Apenas administradores' : 'Erro ao carregar usuários');
      if (!allowedRes.ok) throw new Error('Erro ao carregar permissões');
      const usersJson = await usersRes.json();
      const allowedJson = await allowedRes.json();
      setUsers(usersJson.data || []);
      setAllowed(allowedJson.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
      setUsers([]);
      setAllowed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const adminEmails = new Set(
    users.filter((u) => u.role === 'administrador').map((u) => u.email?.toLowerCase()).filter(Boolean)
  );
  const corretores = users.filter((u) => (u.role || '').toLowerCase() !== 'administrador');

  const allowedByCorretor = (corretorEmail: string) => {
    const low = corretorEmail?.toLowerCase() ?? '';
    const fromTable = allowed.filter((a) => a.corretor_email?.toLowerCase() === low);
    const admins = users.filter((u) => adminEmails.has(u.email?.toLowerCase()));
    return {
      admins: admins.map((u) => ({ email: u.email, nome: u.nome, isAdmin: true })),
      extra: fromTable.map((a) => ({ email: a.allowed_email, nome: a.allowed_nome, id: a.id, isAdmin: false })),
    };
  };

  const canAddFor = (corretorEmail: string) => {
    const { admins, extra } = allowedByCorretor(corretorEmail);
    const already = new Set([...admins.map((a) => a.email?.toLowerCase()), ...extra.map((e) => e.email?.toLowerCase())]);
    return users.filter(
      (u) =>
        u.email?.toLowerCase() !== corretorEmail?.toLowerCase() && !already.has(u.email?.toLowerCase())
    );
  };

  const handleAdd = async () => {
    if (!addingFor || !selectedAdd || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/chat/allowed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ corretor_email: addingFor, allowed_email: selectedAdd }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || res.statusText);
      }
      setAddingFor(null);
      setSelectedAdd('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao adicionar');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/chat/allowed?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao remover');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remover');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          PERMISSÕES DO CHAT
        </h1>
        <p className="mt-2 text-gray-400">
          Defina com quem cada corretor pode conversar no chat. O administrador sempre pode ser contatado por todos.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          {corretores.map((corretor) => {
            const { admins, extra } = allowedByCorretor(corretor.email);
            const availableToAdd = canAddFor(corretor.email);
            const isAdding = addingFor === corretor.email;

            return (
              <div
                key={corretor.email}
                className="border-b border-r border-white/10 p-4 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-medium text-white">{corretor.nome}</p>
                    <p className="text-xs text-gray-500">{corretor.email}</p>
                  </div>
                  {availableToAdd.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddingFor(isAdding ? null : corretor.email)}
                      className="rounded-lg p-2 bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors"
                      title="Adicionar contato"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isAdding && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <select
                      value={selectedAdd}
                      onChange={(e) => setSelectedAdd(e.target.value)}
                      className="rounded-lg border border-white/10 bg-[#151515] px-3 py-1.5 text-sm text-white"
                    >
                      <option value="">Selecionar...</option>
                      {availableToAdd.map((u) => (
                        <option key={u.email} value={u.email}>
                          {u.nome} ({u.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={!selectedAdd || saving}
                      className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-sm text-black font-medium disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingFor(null); setSelectedAdd(''); }}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                <div className="space-y-1.5">
                  {admins.map((a) => (
                    <div
                      key={a.email}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 text-sm"
                    >
                      <span className="text-white">{a.nome}</span>
                      <span className="text-[10px] text-gray-500">Admin</span>
                    </div>
                  ))}
                  {extra.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm"
                    >
                      <span className="text-white truncate">{e.nome}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(e.id)}
                        disabled={saving}
                        className="shrink-0 rounded p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        title="Remover"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {admins.length === 0 && extra.length === 0 && (
                    <p className="text-xs text-gray-500">Apenas administradores (nenhum contato extra)</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {corretores.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum corretor encontrado. Os administradores veem todos os usuários no chat por padrão.
          </div>
        )}
      </div>
    </div>
  );
}
