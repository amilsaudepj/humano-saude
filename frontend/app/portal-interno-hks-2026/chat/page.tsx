'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users, Search, Circle, Phone, Video } from 'lucide-react';

type ChatUser = {
  id: string;
  email: string;
  nome: string;
  role: string;
};

type Mensagem = {
  id: string;
  sender_email: string;
  receiver_email: string;
  message: string;
  created_at: string;
  minha: boolean;
};

function formatHora(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

export default function ChatPage() {
  const [usuarios, setUsuarios] = useState<ChatUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selected, setSelected] = useState<ChatUser | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [busca, setBusca] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/chat/users', { credentials: 'include' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Erro ${res.status}`);
        }
        const { data } = await res.json();
        setUsuarios(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0 && !selected) {
          setSelected(data[0]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar usuários');
        setUsuarios([]);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selected?.email) {
      setMensagens([]);
      return;
    }
    setLoadingMessages(true);
    setError(null);
    fetch(`/api/admin/chat/messages?with=${encodeURIComponent(selected.email)}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) return res.json().then((j) => Promise.reject(new Error(j?.error || res.statusText)));
        return res.json();
      })
      .then(({ data }) => setMensagens(Array.isArray(data) ? data : []))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar mensagens');
        setMensagens([]);
      })
      .finally(() => setLoadingMessages(false));
  }, [selected?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const filteredEquipe = busca
    ? usuarios.filter((u) => u.nome.toLowerCase().includes(busca.toLowerCase()) || u.email.toLowerCase().includes(busca.toLowerCase()))
    : usuarios;

  const handleSend = async () => {
    const text = mensagem.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to_email: selected.email, message: text }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Erro ${res.status}`);
      }
      const { data } = await res.json();
      setMensagens((prev) => [...prev, data]);
      setMensagem('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          CHAT DA EQUIPE
        </h1>
        <p className="mt-2 text-gray-400">Comunicação interna com todos os usuários do sistema</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Users className="h-4 w-4" />
        <span>{usuarios.length} membros no sistema</span>
      </div>

      <div className="grid grid-cols-12 gap-0 rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden" style={{ height: '520px' }}>
        <div className="col-span-4 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#151515] pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="p-4 text-center text-gray-500 text-sm">Carregando usuários...</div>
            ) : filteredEquipe.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">Nenhum usuário encontrado.</div>
            ) : (
              filteredEquipe.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelected(user)}
                  className={`w-full p-3 text-left hover:bg-[#151515] transition-colors border-b border-white/5 ${
                    selected?.id === user.id ? 'bg-[#151515] border-l-2 border-l-[#D4AF37]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#bf953f] flex items-center justify-center text-xs font-bold text-black">
                        {iniciais(user.nome)}
                      </div>
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 text-gray-600 fill-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-white">{user.nome}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.role} • {user.email}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="col-span-8 flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#bf953f] flex items-center justify-center text-xs font-bold text-black">
                    {iniciais(selected.nome)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selected.nome}</p>
                    <p className="text-xs text-gray-500">{selected.role} • {selected.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg p-2 hover:bg-white/10 transition-colors" title="Ligar"><Phone className="h-4 w-4 text-gray-400" /></button>
                  <button className="rounded-lg p-2 hover:bg-white/10 transition-colors" title="Vídeo"><Video className="h-4 w-4 text-gray-400" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center text-gray-500 text-sm py-8">Carregando mensagens...</div>
                ) : mensagens.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">Nenhuma mensagem ainda. Envie a primeira.</div>
                ) : (
                  mensagens.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.minha ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        msg.minha
                          ? 'bg-[#D4AF37] text-white rounded-br-md'
                          : 'bg-[#1a1a1a] text-white rounded-bl-md border border-white/10'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.minha ? 'text-black/50' : 'text-gray-500'}`}>{formatHora(msg.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="flex-1 rounded-lg border border-white/10 bg-[#151515] px-4 py-2.5 text-sm text-white placeholder:text-gray-600"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !mensagem.trim()}
                    className="rounded-lg bg-[#D4AF37] p-2.5 text-white hover:bg-[#F6E05E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Selecione um usuário para iniciar a conversa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
