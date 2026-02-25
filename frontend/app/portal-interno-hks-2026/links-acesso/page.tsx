'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link2, Mail, Plus, Trash2, Copy, Loader2, ExternalLink, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  getLinksAllowedEmails,
  setLinksAllowedEmails,
  getLinksAccessRequests,
  approveLinksAccessRequest,
  removeLinksAccessRequest,
  type LinksAccessRequest,
} from '@/app/actions/links-access';

export default function LinksAcessoPage() {
  const searchParams = useSearchParams();
  const [emails, setEmails] = useState<string[]>([]);
  const [requests, setRequests] = useState<LinksAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [actingRequest, setActingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('aprovado') === '1') {
      toast.success('Acesso aprovado pelo link do e-mail. O solicitante foi notificado.');
      window.history.replaceState({}, '', '/portal-interno-hks-2026/links-acesso');
    }
    if (searchParams.get('erro') === 'link-expirado') toast.error('Link expirado ou inválido.');
    if (searchParams.get('erro') === 'ja-processado') toast.info('Esta solicitação já foi processada.');
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    const [resEmails, resRequests] = await Promise.all([
      getLinksAllowedEmails(),
      getLinksAccessRequests(),
    ]);
    if (resEmails.success && resEmails.data) setEmails(resEmails.data);
    if (resRequests.success && resRequests.data) setRequests(resRequests.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Digite um e-mail');
      return;
    }
    if (emails.includes(email)) {
      toast.error('E-mail já está na lista');
      return;
    }
    setSaving(true);
    const res = await setLinksAllowedEmails([...emails, email]);
    if (res.success) {
      const refetch = await getLinksAllowedEmails();
      if (refetch.success && refetch.data) setEmails(refetch.data);
      setNewEmail('');
      toast.success('E-mail adicionado');
    } else {
      toast.error(res.error || 'Erro ao adicionar');
    }
    setSaving(false);
  };

  const handleRemove = async (email: string) => {
    setSaving(true);
    const next = emails.filter((e) => e !== email);
    const res = await setLinksAllowedEmails(next);
    if (res.success) {
      const refetch = await getLinksAllowedEmails();
      if (refetch.success && refetch.data) setEmails(refetch.data);
      toast.success('E-mail removido');
    } else {
      toast.error(res.error || 'Erro ao remover');
    }
    setSaving(false);
  };

  const handleApproveRequest = async (email: string) => {
    setActingRequest(email);
    const res = await approveLinksAccessRequest(email);
    setActingRequest(null);
    if (res.success) {
      setRequests((prev) => prev.filter((r) => r.email.toLowerCase() !== email.toLowerCase()));
      setEmails((prev) => (prev.includes(email.toLowerCase()) ? prev : [...prev, email.toLowerCase()]));
      toast.success('E-mail adicionado à lista de permitidos');
    } else {
      toast.error(res.error || 'Erro ao aprovar');
    }
  };

  const handleRejectRequest = async (email: string) => {
    setActingRequest(email);
    const res = await removeLinksAccessRequest(email);
    setActingRequest(null);
    if (res.success) {
      setRequests((prev) => prev.filter((r) => r.email.toLowerCase() !== email.toLowerCase()));
      toast.success('Solicitação recusada');
    } else {
      toast.error(res.error || 'Erro ao recusar');
    }
  };

  const handleGenerateLink = async (email: string) => {
    setGenerating(email);
    try {
      const res = await fetch('/api/links/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar link');
        return;
      }
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success('Link copiado! Envie por e-mail para o destinatário.');
      }
    } catch {
      toast.error('Erro ao gerar link');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#D4AF37]" />
          Acesso à página restrita de links
        </h1>
        <p className="text-xs text-white/40 mt-1">Menu: Configurações → Acesso à página /links</p>
        <p className="text-sm text-white/50 mt-2">
          <strong className="text-white/70">/links</strong> é o linktree público (Instagram, etc.). A página <strong className="text-white/70">/acesso-links</strong> é restrita: apenas os e-mails abaixo ou quem receber o link gerado pode acessar. Quando alguém solicitar acesso na página restrita, você recebe um e-mail com &quot;Aprovar acesso&quot; (ou pode autorizar aqui).
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-semibold text-white mb-4">E-mails permitidos</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 min-w-[200px] flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="novo@email.com"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-4 py-2.5 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/30 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/50 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : emails.length === 0 ? (
          <p className="text-white/40 text-sm py-4">Nenhum e-mail permitido. Adicione um para gerar links de acesso.</p>
        ) : (
          <ul className="space-y-2">
            {emails.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-white truncate">
                  <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
                  {email}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGenerateLink(email)}
                    disabled={generating !== null}
                    className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/20 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/30 disabled:opacity-50"
                    title="Gerar link e copiar (envie por e-mail ao destinatário)"
                  >
                    {generating === email ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Gerar link
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(email)}
                    disabled={saving}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    title="Remover e-mail"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-amber-400" />
          Autorizar solicitações (aqui você aprova ou recusa)
        </h2>
        <p className="text-xs text-white/50 mb-4">
          Quando alguém clica em &quot;Não tem acesso? Solicitar agora&quot; na página restrita (/acesso-links), você recebe um e-mail com link para aprovar em 1 clique e a solicitação também aparece aqui.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 text-white/50 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : requests.length === 0 ? (
          <p className="text-white/40 text-sm py-4">Nenhuma solicitação no momento.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((req) => (
              <li
                key={req.email + req.created_at}
                className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-white block truncate">{req.email}</span>
                  {req.mensagem && (
                    <span className="text-xs text-white/50 block mt-0.5 line-clamp-2">{req.mensagem}</span>
                  )}
                  <span className="text-[10px] text-white/40 mt-1">
                    {new Date(req.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(req.email)}
                    disabled={actingRequest !== null}
                    className="flex items-center gap-1.5 rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                    title="Adicionar à lista de permitidos"
                  >
                    {actingRequest === req.email ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Autorizar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req.email)}
                    disabled={actingRequest !== null}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    title="Recusar solicitação"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
        <p className="text-sm text-white/80">
          <strong className="text-[#D4AF37]">Como usar:</strong>{' '}
          <a href="/links" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline inline-flex items-center gap-1">
            /links
            <ExternalLink className="h-3 w-3" />
          </a>
          {' '}é o linktree público (4 links oficiais).{' '}
          <a href="/acesso-links" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] underline inline-flex items-center gap-1">
            /acesso-links
            <ExternalLink className="h-3 w-3" />
          </a>
          {' '}é a página restrita: quem acessa entra com e-mail (se estiver na lista), usa o link que você gerou, ou solicita acesso. Use &quot;Gerar link&quot; para copiar a URL com token (válida 90 dias) e enviar por e-mail.
        </p>
      </div>
    </div>
  );
}
