'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calculator,
  LogIn,
  UserPlus,
  Users,
  Palette,
  ArrowRight,
  Briefcase,
  Lock,
  Loader2,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LINKS_RESTRICTED_PATH } from '@/lib/links-restricted-path';

const COOKIE_NAME = 'links_access';
const COOKIE_MAX_AGE_DAYS = 90;
/** Cookie só é enviado para esta rota (blindagem: /links público não recebe o token). */
const COOKIE_PATH = '/acesso-links';

const SECTIONS = [
  {
    title: 'Simulação',
    description: 'Simule e economize no plano de saúde',
    links: [
      { href: '/economizar', label: 'Economize no plano de saúde', subtitle: 'Calculadora e análise com IA', icon: Calculator },
    ],
  },
  {
    title: 'Cadastro',
    description: 'Se cadastrar como corretor ou afiliado',
    links: [
      { href: '/seja-corretor', label: 'Seja corretor', subtitle: 'Solicitar acesso como corretor', icon: Briefcase },
      { href: '/seja-afiliado', label: 'Seja afiliado', subtitle: 'Cadastre-se como afiliado', icon: UserPlus },
    ],
  },
  {
    title: 'Acessos',
    description: 'Login dos portais e materiais',
    links: [
      { href: '/dashboard/corretor/login', label: 'Login Corretor', subtitle: 'Painel do corretor', icon: LogIn },
      { href: '/dashboard/afiliado/login', label: 'Login Afiliado', subtitle: 'Painel do afiliado', icon: LogIn },
      { href: '/portal-cliente/login', label: 'Portal do Cliente', subtitle: 'Acesso do titular', icon: Users },
      { href: '/design-system', label: 'Design System', subtitle: 'Marketing e identidade visual', icon: Palette },
    ],
  },
] as const;

function setLinksAccessCookie(token: string) {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=${COOKIE_PATH}; max-age=${maxAge}; samesite=strict`;
}

function AcessoLinksBlockedView({ onAccessGranted }: { onAccessGranted: (token: string) => void }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestMsg, setRequestMsg] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      setLoginError('Digite seu e-mail');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/links/access-with-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data?.ok && data?.token) {
        onAccessGranted(data.token);
        return;
      }
      setLoginError(data?.error || 'E-mail não autorizado. Solicite acesso abaixo.');
    } catch {
      setLoginError('Erro de conexão. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = requestEmail.trim();
    if (!email) return;
    setRequestLoading(true);
    try {
      const res = await fetch('/api/links/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mensagem: requestMsg.trim() || undefined }),
      });
      const data = await res.json();
      if (data?.success) {
        setRequestSent(true);
        setRequestEmail('');
        setRequestMsg('');
      }
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-montserrat flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-md w-full rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-8">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold text-white text-center mb-2">Acesso restrito</h1>
        <p className="text-white/60 text-sm text-center mb-6">
          Digite seu e-mail se você já foi autorizado, ou solicite acesso.
        </p>

        <form onSubmit={handleLogin} className="space-y-3 mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                placeholder="seu@email.com"
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                disabled={loginLoading}
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-4 py-2.5 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/30 disabled:opacity-50 flex items-center gap-2"
            >
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Acessar
            </button>
          </div>
          {loginError && <p className="text-amber-400 text-xs">{loginError}</p>}
        </form>

        <div className="border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => setShowRequest((v) => !v)}
            className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white text-sm py-2"
          >
            Não tem acesso? Solicitar agora
            {showRequest ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showRequest && (
            <form onSubmit={handleRequestAccess} className="mt-4 space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
              {requestSent ? (
                <p className="text-green-400 text-sm text-center">
                  Solicitação enviada. Você receberá um e-mail de confirmação e outro quando seu acesso for aprovado.
                </p>
              ) : (
                <>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="Seu e-mail"
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50"
                    disabled={requestLoading}
                  />
                  <textarea
                    value={requestMsg}
                    onChange={(e) => setRequestMsg(e.target.value)}
                    placeholder="Mensagem opcional"
                    rows={2}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 resize-none"
                    disabled={requestLoading}
                  />
                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="w-full rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 py-2.5 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/30 disabled:opacity-50 flex items-center gap-2"
                  >
                    {requestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Enviar solicitação
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-white/50 hover:text-white text-sm">
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}

function AcessoLinksPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'blocked'>('loading');

  const checkAccess = useCallback(async (token: string, fromUrl: boolean) => {
    const res = await fetch(`/api/links/verify?token=${encodeURIComponent(token)}`, { credentials: 'include' });
    const data = await res.json();
    if (data?.ok) {
      setLinksAccessCookie(token);
      setStatus('allowed');
      if (fromUrl) router.replace(LINKS_RESTRICTED_PATH, { scroll: false });
    } else {
      setStatus('blocked');
    }
  }, [router]);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const tokenFromCookie = typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((c) => c.startsWith(`${COOKIE_NAME}=`))
          ?.split('=')[1]
          ?.replace(/^"(.*)"$/, '$1')
      : null;
    const token = tokenFromUrl || (typeof tokenFromCookie === 'string' ? decodeURIComponent(tokenFromCookie) : null);

    if (!token) {
      setStatus('blocked');
      return;
    }

    checkAccess(token, !!tokenFromUrl);
  }, [searchParams, checkAccess]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <AcessoLinksBlockedView
        onAccessGranted={(token) => {
          setLinksAccessCookie(token);
          setStatus('allowed');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-montserrat">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.12),transparent)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4">
            <Image
              src="/images/logos/icon-humano.png"
              alt="Humano Saúde"
              width={64}
              height={64}
              className="rounded-2xl"
            />
            <span className="text-2xl font-bold text-white tracking-tight">Humano Saúde</span>
          </Link>
          <p className="text-white/50 text-sm">Links internos · Acesso autorizado</p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                {section.title}
              </h2>
              <p className="text-white/40 text-sm mb-4">{section.description}</p>
              <ul className="space-y-3">
                {section.links.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#D4AF37]/30 transition-all duration-200"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37]/20 transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-base font-medium text-white group-hover:text-[#D4AF37] transition-colors">
                            {item.label}
                          </span>
                          {item.subtitle && (
                            <span className="block text-sm text-white/50">{item.subtitle}</span>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 text-white/30 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-center text-white/30 text-xs mt-12">
          © {new Date().getFullYear()} Humano Saúde. Uso interno autorizado.
        </p>
      </div>
    </div>
  );
}

export default function AcessoLinksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-[#D4AF37] animate-spin" />
        </div>
      }
    >
      <AcessoLinksPageContent />
    </Suspense>
  );
}
