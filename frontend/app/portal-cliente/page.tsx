'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  LogOut,
  MessageCircle,
  FileCheck,
  Phone,
  Send,
  BadgeCheck,
  Building2,
  Users,
  Wallet,
} from 'lucide-react';

type Proposta = {
  operadora_id?: string;
  operadora_nome?: string;
  plano_nome?: string;
  valor_total?: number;
  economia_valor?: number;
  economia_pct?: number;
  abrangencia?: string;
};

type PortalAccount = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  solicitou_documentacao_completa: boolean;
  solicitou_documentacao_em: string | null;
  dados_resumo: {
    tipo_pessoa?: string;
    operadora_atual?: string;
    valor_atual?: number;
    qtd_vidas?: number;
    idades?: string[];
    propostas?: Proposta[];
  };
};

export default function PortalClienteHomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<PortalAccount | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMensagem, setChatMensagem] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFeedback, setChatFeedback] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docFeedback, setDocFeedback] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch('/api/cliente/me', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok || !data.success) {
          router.push('/portal-cliente/login');
          return;
        }

        if (mounted) {
          setAccount(data.account as PortalAccount);
          setLoading(false);
        }
      } catch {
        router.push('/portal-cliente/login');
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const propostas = useMemo(() => account?.dados_resumo?.propostas || [], [account]);
  const melhorProposta = propostas[0];

  async function handleLogout() {
    await fetch('/api/auth/cliente/logout', { method: 'POST' });
    router.push('/portal-cliente/login');
    router.refresh();
  }

  async function enviarChat() {
    if (!chatMensagem.trim()) {
      setChatFeedback('Digite sua mensagem para o time de vendas.');
      return;
    }

    setChatLoading(true);
    setChatFeedback(null);

    try {
      const response = await fetch('/api/cliente/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: chatMensagem.trim() }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setChatFeedback(data?.error || 'Não foi possível enviar a mensagem.');
        setChatLoading(false);
        return;
      }

      setChatMensagem('');
      setChatFeedback('Mensagem enviada. O time comercial responderá em breve.');
      setChatLoading(false);
    } catch {
      setChatFeedback('Erro de conexão ao enviar mensagem.');
      setChatLoading(false);
    }
  }

  async function solicitarDocumentacaoCompleta() {
    setDocLoading(true);
    setDocFeedback(null);

    try {
      const response = await fetch('/api/cliente/solicitar-documentacao', { method: 'POST' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setDocFeedback(data?.error || 'Não foi possível registrar sua solicitação.');
        setDocLoading(false);
        return;
      }

      setDocFeedback(data.message || 'Solicitação enviada com sucesso.');
      setDocLoading(false);

      setAccount((current) => {
        if (!current) return current;
        return {
          ...current,
          solicitou_documentacao_completa: true,
          solicitou_documentacao_em: new Date().toISOString(),
        };
      });
    } catch {
      setDocFeedback('Erro de conexão ao registrar solicitação.');
      setDocLoading(false);
    }
  }

  if (loading || !account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-800">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando seu portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">Portal do Cliente Humano Saúde</h1>
            <p className="text-sm text-slate-600">Olá, {account.nome}. Aqui estão suas opções e resumo de cadastro.</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Resumo dos dados enviados</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-slate-500">E-mail</div>
                <div className="font-medium">{account.email}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-slate-500">WhatsApp</div>
                <div className="font-medium">{account.telefone || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-slate-500">Tipo</div>
                <div className="font-medium">{account.dados_resumo?.tipo_pessoa || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-slate-500">Operadora atual</div>
                <div className="font-medium">{account.dados_resumo?.operadora_atual || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-slate-500">Valor atual</div>
                <div className="font-medium">
                  {typeof account.dados_resumo?.valor_atual === 'number'
                    ? account.dados_resumo.valor_atual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-slate-500">Quantidade de vidas</div>
                <div className="font-medium">{account.dados_resumo?.qtd_vidas || '—'}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Este portal exibe apenas o resumo cadastral. Os anexos não aparecem aqui por segurança.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-700" />
              <h2 className="text-lg font-semibold">Opções de plano geradas</h2>
            </div>

            {propostas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Ainda não há propostas salvas no seu portal. Nossa equipe está processando sua simulação.
              </div>
            ) : (
              <div className="space-y-3">
                {propostas.map((proposta, index) => (
                  <div
                    key={`${proposta.operadora_id || proposta.operadora_nome || 'plano'}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{proposta.operadora_nome || 'Operadora'}</p>
                        <p className="text-sm text-slate-600">{proposta.plano_nome || 'Plano estimado'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Valor estimado</p>
                        <p className="text-lg font-bold text-slate-900">
                          {typeof proposta.valor_total === 'number'
                            ? proposta.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                        Economia: {typeof proposta.economia_valor === 'number'
                          ? proposta.economia_valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </div>
                      <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                        Percentual: {typeof proposta.economia_pct === 'number' ? `${proposta.economia_pct.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Falar com especialista</h2>
            <p className="mt-1 text-sm text-slate-600">Canal direto para tirar dúvidas sobre sua proposta.</p>
            <a
              href={`https://wa.me/5521988179407?text=${encodeURIComponent(`Olá, sou ${account.nome} e estou no portal do cliente para tirar dúvidas sobre minha proposta.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Phone className="h-4 w-4" />
              WhatsApp especialista
            </a>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Chat com time de vendas</h2>
            <p className="mt-1 text-sm text-slate-600">Envie uma mensagem interna para atendimento comercial.</p>

            <button
              onClick={() => setChatOpen((value) => !value)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <MessageCircle className="h-4 w-4" />
              {chatOpen ? 'Ocultar chat interno' : 'Abrir chat interno'}
            </button>

            {chatOpen && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={chatMensagem}
                  onChange={(e) => setChatMensagem(e.target.value)}
                  rows={4}
                  placeholder="Escreva sua dúvida para o time de vendas..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
                <button
                  onClick={enviarChat}
                  disabled={chatLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar mensagem
                </button>
                {chatFeedback && <p className="text-xs text-slate-600">{chatFeedback}</p>}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-slate-700" />
              <h2 className="text-lg font-semibold">Análise completa da documentação</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Se desejar, você pode autorizar o envio completo dos documentos para validarmos a proposta com possível desconto e seguimento final.
            </p>

            <button
              onClick={solicitarDocumentacaoCompleta}
              disabled={docLoading || account.solicitou_documentacao_completa}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {docLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              {account.solicitou_documentacao_completa ? 'Solicitação já registrada' : 'Solicitar validação completa'}
            </button>

            {docFeedback && <p className="mt-2 text-xs text-slate-600">{docFeedback}</p>}
          </article>

          {melhorProposta && (
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4" />
                Destaque da sua simulação
              </div>
              <p>
                Melhor economia estimada: {typeof melhorProposta.economia_pct === 'number' ? `${melhorProposta.economia_pct.toFixed(1)}%` : '—'}
                {' '}
                com {melhorProposta.operadora_nome || 'operadora sugerida'}.
              </p>
              <p className="mt-1 inline-flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                Valor estimado:{' '}
                {typeof melhorProposta.valor_total === 'number'
                  ? melhorProposta.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '—'}
              </p>
            </article>
          )}
        </aside>
      </main>
    </div>
  );
}
