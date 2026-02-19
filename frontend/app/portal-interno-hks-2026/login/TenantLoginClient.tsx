'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '@/app/components/Logo';

interface TenantBranding {
  name: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
}

interface TenantLoginClientProps {
  tenantSlug: string | null;
  tenantDomain: string | null;
  branding: TenantBranding | null;
}

export default function TenantLoginClient({ tenantSlug, tenantDomain, branding }: TenantLoginClientProps) {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isTenantPortal = !!tenantSlug;
  const primaryColor = branding?.primary_color ?? '#D4AF37';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          tenant_slug: tenantSlug ?? undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redireciona para o portal (via path correto dependendo de onde estamos)
        if (isTenantPortal && tenantDomain) {
          // Estamos no domínio customizado → vai para /portal
          window.location.href = `https://${tenantDomain}/portal`;
        } else {
          router.push('/portal-interno-hks-2026');
        }
      } else {
        setError(data.message || 'Credenciais inválidas');
      }
    } catch {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          {/* Logo: tenant ou Humano Saúde */}
          <div className="flex justify-center mb-8">
            {isTenantPortal && branding?.logo_url ? (
              <div className="flex flex-col items-center gap-2">
                <Image
                  src={branding.logo_url}
                  alt={branding.name}
                  width={160}
                  height={48}
                  className="h-12 w-auto object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <Logo className="h-12" withBackground={false} />
            )}
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isTenantPortal ? 'Portal da Corretora' : 'Área Restrita'}
            </h1>
            <p className="text-slate-400">
              {isTenantPortal && branding?.name
                ? `Acesse o painel de ${branding.name}`
                : 'Acesso exclusivo para administradores'}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                placeholder="seu@email.com.br"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900"
              style={{
                background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`,
                boxShadow: loading ? 'none' : `0 4px 15px ${primaryColor}33`,
              }}
            >
              {loading ? 'Autenticando...' : 'Acessar Portal'}
            </button>
          </form>

          {/* Rodapé */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              🔒 Conexão segura e criptografada
            </p>
            {isTenantPortal && (
              <p className="text-xs text-slate-600 mt-1">
                Powered by{' '}
                <span className="text-slate-500">Humano Saúde</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
