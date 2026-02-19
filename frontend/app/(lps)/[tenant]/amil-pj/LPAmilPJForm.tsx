'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Shield, Star, Phone, Mail, Building2, Users, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ingestLPLead } from '@/app/actions/lp-lead';
import type { Tenant } from '@/lib/types/tenant';

interface Props {
  tenant: Tenant;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ─── Máscara de telefone ─────────────────────────────────────
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value;
}

const OPERADORAS = ['Amil', 'Bradesco Saúde', 'SulAmérica', 'Hapvida', 'NotreDame', 'Unimed', 'Porto Seguro', 'Outra'];

// ─── Componente principal ─────────────────────────────────────
export function LPAmilPJForm({ tenant, utmSource, utmMedium, utmCampaign }: Props) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const primary = tenant.primary_color;
  const secondary = tenant.secondary_color;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      setError(null);
      const result = await ingestLPLead({
        nome:            fd.get('nome') as string,
        whatsapp:        (fd.get('whatsapp') as string).replace(/\D/g, ''),
        email:           fd.get('email') as string,
        empresa:         fd.get('empresa') as string,
        n_vidas:         Number(fd.get('n_vidas') || 1),
        operadora_atual: fd.get('operadora_atual') as string,
        tenant_slug:     tenant.slug,
        lp_slug:         'amil-pj',
        utm_source:      utmSource,
        utm_medium:      utmMedium,
        utm_campaign:    utmCampaign,
      });

      if (result.success) {
        setSubmitted(true);
        // Disparo do evento de conversão do Pixel do tenant (se existir)
        if (typeof window !== 'undefined' && 'fbq' in window) {
          (window as Window & { fbq?: (...args: unknown[]) => void }).fbq?.('track', 'Lead');
        }
        if (typeof window !== 'undefined' && 'dataLayer' in window) {
          (window as Window & { dataLayer?: unknown[] }).dataLayer?.push({ event: 'generate_lead' });
        }
      } else {
        setError(result.error ?? 'Erro desconhecido');
      }
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: secondary }}
    >
      {/* ── NAVBAR ── */}
      <nav
        className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
        style={{ backgroundColor: `${secondary}ee` }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {tenant.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={tenant.name}
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="text-lg font-bold text-white">{tenant.name}</span>
          )}
          <a
            href={`tel:+55${utmSource === 'google' ? '1140042626' : '1140042626'}`}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ backgroundColor: primary, color: '#000' }}
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Falar com Especialista</span>
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 lg:py-24 px-4">
        {/* Glow de fundo */}
        <div
          className="absolute inset-0 opacity-20 blur-[120px] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${primary}, transparent 70%)`
          }}
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
              style={{ borderColor: `${primary}50`, color: primary, backgroundColor: `${primary}15` }}
            >
              <Shield className="h-3.5 w-3.5" />
              Cotação 100% gratuita • Sem compromisso
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              Plano de Saúde{' '}
              <span style={{ color: primary }}>Amil Empresarial</span>{' '}
              para sua empresa
            </h1>

            <p className="text-base sm:text-lg text-white/60 mb-8 max-w-lg leading-relaxed">
              Economize até <strong className="text-white">40%</strong> no plano de saúde da sua empresa.
              Cotação personalizada em até 2 horas com especialistas da {tenant.name}.
            </p>

            {/* Benefícios */}
            <ul className="space-y-3 mb-8">
              {[
                'Atendimento em todo o Brasil',
                'Rede credenciada com + de 15.000 médicos',
                'Coparticipação ou sem coparticipação',
                'De 2 a 999 vidas — MEI ou grande empresa',
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-white/80">
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primary}25` }}
                  >
                    <CheckCircle className="h-3.5 w-3.5" style={{ color: primary }} />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>

            {/* Social proof */}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white/10 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${primary}30`, color: primary }}
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: primary }} />
                ))}
                <span className="ml-1">+500 empresas atendidas</span>
              </div>
            </div>
          </motion.div>

          {/* ── FORMULÁRIO ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div
              className="rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-sm"
              style={{ backgroundColor: `${secondary}99` }}
            >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div
                      className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${primary}20` }}
                    >
                      <CheckCircle className="h-8 w-8" style={{ color: primary }} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Recebemos sua solicitação! 🎉
                    </h3>
                    <p className="text-sm text-white/60 mb-6 leading-relaxed">
                      Um especialista da {tenant.name} entrará em contato via WhatsApp
                      em até <strong className="text-white">2 horas úteis</strong>.
                    </p>
                    <p className="text-xs text-white/30">
                      Dica: salve nosso número para não perder a ligação.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-white mb-1">
                        Receba sua cotação gratuita
                      </h2>
                      <p className="text-sm text-white/50">
                        Preencha em 30 segundos — sem compromisso
                      </p>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                      {/* Nome */}
                      <div>
                        <label className="text-xs text-white/50 mb-1.5 block font-medium">
                          Seu nome *
                        </label>
                        <input
                          name="nome"
                          type="text"
                          required
                          placeholder="João Silva"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                          autoComplete="name"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div>
                        <label className="text-xs text-white/50 mb-1.5 block font-medium">
                          WhatsApp *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            name="whatsapp"
                            type="tel"
                            required
                            placeholder="(11) 99999-9999"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            autoComplete="tel"
                            onChange={(e) => {
                              e.target.value = maskPhone(e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      {/* E-mail */}
                      <div>
                        <label className="text-xs text-white/50 mb-1.5 block font-medium">
                          E-mail
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            name="email"
                            type="email"
                            placeholder="joao@empresa.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      {/* Empresa */}
                      <div>
                        <label className="text-xs text-white/50 mb-1.5 block font-medium">
                          Nome da empresa
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            name="empresa"
                            type="text"
                            placeholder="Empresa Ltda."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                          />
                        </div>
                      </div>

                      {/* N° de vidas + Operadora atual */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block font-medium">
                            N° de vidas
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                            <input
                              name="n_vidas"
                              type="number"
                              min="1"
                              placeholder="Ex: 5"
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block font-medium">
                            Plano atual
                          </label>
                          <div className="relative">
                            <select
                              name="operadora_atual"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white/70 focus:outline-none focus:border-white/30 transition-colors appearance-none pr-8"
                            >
                              <option value="">Selecione</option>
                              {OPERADORAS.map((op) => (
                                <option key={op} value={op} className="bg-[#0a0a0a]">
                                  {op}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {error && (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isPending}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all',
                          'disabled:opacity-60 disabled:cursor-not-allowed'
                        )}
                        style={{
                          backgroundColor: primary,
                          color: '#000',
                        }}
                      >
                        {isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            Quero minha cotação gratuita
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-white/30 text-center">
                        Seus dados estão protegidos e não serão compartilhados com terceiros.
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER MINIMALISTA ── */}
      <footer className="mt-auto border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <p>© {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            {tenant.support_email && (
              <a href={`mailto:${tenant.support_email}`} className="hover:text-white/60 transition-colors">
                {tenant.support_email}
              </a>
            )}
            <span>Plataforma Humano Saúde</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
