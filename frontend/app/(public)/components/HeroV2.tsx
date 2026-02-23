'use client';

import { useState, useCallback } from 'react';
import { trackGTMEvent } from '@/app/components/GoogleTagManager';
import { trackEvent } from '@/app/components/GoogleAnalytics';
import { lpLeadSchema, getZodErrors } from '@/lib/validations';

// ==============================================
// LEAD SCORING - VALUE-BASED BIDDING
// ==============================================

const LEAD_VALUES: Record<string, number> = {
  'mei': 100.0,
  'pme': 1000.0,
  'empresa': 3000.0,
  'a-definir': 500.0,
};

const VIDAS_OPTIONS = [
  { value: 'mei', label: 'MEI' },
  { value: 'pme', label: 'PME (2 a 29 vidas)' },
  { value: 'empresa', label: 'Empresa (30+ vidas)' },
  { value: 'a-definir', label: 'A definir com especialista' },
];

// ==============================================
// WHATSAPP MASK HELPER
// ==============================================
function formatWhatsApp(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : '';
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

export default function HeroV2() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    vidas: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'whatsapp') {
      setFormData((prev) => ({ ...prev, [name]: formatWhatsApp(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação com Zod
    const result = lpLeadSchema.safeParse(formData);
    if (!result.success) {
      setErrors(getZodErrors(result.error));
      return;
    }

    setIsSubmitting(true);

    // -----------------------------------------------
    // 1) LEAD SCORING (Value-Based Bidding)
    // -----------------------------------------------
    const leadValue = LEAD_VALUES[formData.vidas] ?? 100.0;

    // -----------------------------------------------
    // 2) META PIXEL (fbq) – Lead event com valor
    // -----------------------------------------------
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        content_name: 'Cotacao_Empresarial',
        content_category: 'Health_Insurance',
        value: leadValue,
        currency: 'BRL',
        num_lives_range: formData.vidas,
      });
    }

    // -----------------------------------------------
    // 3) GOOGLE TAG MANAGER – DataLayer push
    // -----------------------------------------------
    trackGTMEvent('lead_submission_v2', {
      event_category: 'Lead',
      event_label: `vidas_${formData.vidas}`,
      lead_value: leadValue,
      currency: 'BRL',
      lives_range: formData.vidas,
    });

    // -----------------------------------------------
    // 4) GOOGLE ANALYTICS 4 – Enhanced conversion
    // -----------------------------------------------
    trackEvent('generate_lead', {
      event_category: 'Lead',
      value: leadValue,
      currency: 'BRL',
      lives_range: formData.vidas,
      source: 'lp_v2_refactor',
    });

    // -----------------------------------------------
    // 5) PAYLOAD para backend / webhook
    // -----------------------------------------------
    const payload = {
      name: formData.nome,
      email: formData.email,
      whatsapp: formData.whatsapp,
      lives_range: formData.vidas,
      lead_score_value: leadValue,
      source: 'lp_v2_refactor',
      currency: 'BRL',
      submitted_at: new Date().toISOString(),
    };

    console.log('[LP V2] Lead Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.whatsapp,
          perfil: `Empresarial ${formData.vidas}`,
          lead_score_value: leadValue,
          source: 'lp_v2_refactor',
          origem: 'hero_form',
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = '/obrigado';
        }, 1200);
      } else {
        const data = await response.json().catch(() => ({}));
        const msg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Tente novamente.');
        alert('Erro ao enviar: ' + msg);
      }
    } catch (error) {
      console.error('[LP V2] Submit error:', error);
      // Fallback: redireciona pro WhatsApp com dados
      const msg = encodeURIComponent(
        `Olá! Sou ${formData.nome}. Tenho interesse em plano empresarial (${formData.vidas}). Meu e-mail é ${formData.email}.`
      );
      window.open(`https://wa.me/5521988179407?text=${msg}`, '_blank');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="hero" className="relative bg-white min-h-screen flex items-center pt-36 pb-20 sm:pt-40 sm:pb-24 md:py-24 lg:py-28 overflow-hidden">

      {/* ===== Efeitos de fundo ===== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gold-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-gray-100/50 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-12 xl:gap-16 items-center">

        {/* ===== COLUNA ESQUERDA: COPY ===== */}
        <div className="text-left max-w-2xl">
          {/* Badge Minimalista com bolinha piscante */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8941F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B8941F]"></span>
            </span>
            <span className="text-xs text-gray-900 font-medium tracking-wide">
              Redução em até 10 minutos
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-[28px] sm:text-4xl md:text-[42px] lg:text-[44px] xl:text-[46px] font-black text-black leading-[1.1] mb-6">
            Reduza <span className="text-[#B8941F]">até 40%</span> o custo<br />
            do seu Plano de Saúde<br />
            usando seu <span className="text-[#B8941F] whitespace-nowrap">CNPJ</span>
          </h1>

          {/* H2 */}
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8">
            Chega de aumentos fora de controle. Compare as tabelas exclusivas{' '}
            <br className="hidden lg:block" />
            para <strong className="text-black">MEI e PME</strong> e descubra <span className="text-[#B8941F] font-semibold">em minutos</span> a operadora com o melhor{' '}
            <br className="hidden lg:block" />
            resultado para o seu <strong className="text-black">CNPJ</strong>.
          </p>

          {/* Benefícios com bolinhas piscantes */}
          <ul className="space-y-4 mb-8">
            {[
              'Atendimento para MEI, PME e Empresa',
              'Cotação pronta em até 10 minutos',
              'Redução de carência e migração sem burocracia',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-base sm:text-lg lg:text-[1.15rem] text-gray-700">
                <span className="relative flex h-3 w-3 mt-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8941F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B8941F]"></span>
                </span>
                <span dangerouslySetInnerHTML={{ __html: text.replace('(MEI e PME)', '<strong>(MEI e PME)</strong>') }} />
              </li>
            ))}
          </ul>
        </div>

        {/* ===== COLUNA DIREITA: FORMULÁRIO FLUTUANTE ===== */}
        <div className="relative lg:pt-3">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200">
            {/* Header do form */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-black">
                Gere sua economia de <span className="text-[#B8941F]">até 40%</span>
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Resposta em até <strong className="text-black">10 minutos</strong> via WhatsApp
              </p>
            </div>

            {isSuccess ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Cotação solicitada!</h3>
                <p className="text-sm text-gray-500">Redirecionando...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Nome do Responsável */}
                <div>
                  <label htmlFor="lp-nome" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nome do Responsável *
                  </label>
                  <input
                    id="lp-nome"
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: João Silva"
                    autoComplete="name"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-base bg-gray-50 focus:bg-white focus:outline-none transition-all ${
                      errors.nome
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
                    }`}
                  />
                  {errors.nome && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.nome}
                    </p>
                  )}
                </div>

                {/* E-mail */}
                <div>
                  <label htmlFor="lp-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    E-mail *
                  </label>
                  <input
                    id="lp-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Ex: joao@empresa.com.br"
                    autoComplete="email"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-base bg-gray-50 focus:bg-white focus:outline-none transition-all ${
                      errors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* WhatsApp */}
                <div>
                  <label htmlFor="lp-whatsapp" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    WhatsApp *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978z"/>
                      </svg>
                    </span>
                    <input
                      id="lp-whatsapp"
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="(21) 98888-7777"
                      autoComplete="tel"
                      maxLength={15}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-base bg-gray-50 focus:bg-white focus:outline-none transition-all ${
                        errors.whatsapp
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                          : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
                      }`}
                    />
                  </div>
                  {errors.whatsapp && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.whatsapp}
                    </p>
                  )}
                </div>

                {/* Perfil da Empresa */}
                <div>
                  <label htmlFor="lp-vidas" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Perfil da Empresa *
                  </label>
                  <select
                    id="lp-vidas"
                    name="vidas"
                    value={formData.vidas}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-base bg-gray-50 focus:bg-white focus:outline-none transition-all appearance-none cursor-pointer ${
                      errors.vidas
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100'
                    } ${!formData.vidas ? 'text-gray-400' : 'text-gray-900'}`}
                  >
                    <option value="" disabled>Selecione o perfil</option>
                    {VIDAS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.vidas && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.vidas}
                    </p>
                  )}
                </div>

                {/* CTA BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full py-4 px-6 bg-[#B8941F] hover:bg-[#C5A028] text-white font-extrabold text-sm sm:text-base uppercase tracking-wider rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        Reduzir Agora
                        <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>

                {/* Trust micro-copy */}
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 pt-1">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Seus dados estão seguros. Sem spam.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
