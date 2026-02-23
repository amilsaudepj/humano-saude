'use client';

import { useState } from 'react';
import { trackLeadGeneration } from '@/app/lib/metaPixel';
import { trackGTMLeadSubmission } from '@/app/components/GoogleTagManager';
import { trackLeadSubmission } from '@/app/components/GoogleAnalytics';
import { heroLeadSchema, getZodErrors } from '@/lib/validations';

export default function Hero() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    perfil: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Formatar telefone automaticamente
    if (name === 'telefone') {
      const numbers = value.replace(/\D/g, '');
      const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Limpar erro ao digitar
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação com Zod
    const result = heroLeadSchema.safeParse(formData);
    if (!result.success) {
      setErrors(getZodErrors(result.error));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Meta Pixel Tracking
        trackLeadGeneration({
          leadId: data.leadId,
          nome: formData.nome,
          operadora: 'Landing Hero',
          valorAtual: 0,
          valorProposto: 0,
          economiaEstimada: 0,
        });

        // ✅ Google Tag Manager Tracking
        trackGTMLeadSubmission({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          perfil: formData.perfil,
        });

        // ✅ Google Analytics Tracking
        trackLeadSubmission({
          nome: formData.nome,
          perfil: formData.perfil,
          source: 'hero_form',
        });

        document.cookie = 'hs_ok=1; path=/; max-age=120; SameSite=Lax';
        window.location.href = '/obrigado';
      } else {
        const details = typeof data?.details === 'string' && data.details.trim().length > 0
          ? ` (${data.details})`
          : '';
        alert(`Erro ao enviar: ${data.error || 'Tente novamente.'}${details}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-white via-gray-50 to-white min-h-screen flex pt-24 sm:pt-28 md:pt-32 lg:pt-24 xl:pt-28 2xl:pt-32 pb-12 sm:pb-16 overflow-hidden">
      {/* Partículas de fundo animadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-600/5 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gold-300/3 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-8 xl:gap-10 2xl:gap-12 items-start relative z-10">
        
        {/* ✅ Coluna Esquerda: Conteúdo com animação de entrada */}
        <div className="text-left max-w-[620px] animate-[slideInLeft_0.8s_ease-out]">
          <h2 className="text-[10px] sm:text-[11px] lg:text-xs font-bold uppercase tracking-[3px] sm:tracking-[4px] mb-4 sm:mb-5 lg:mb-6 italic bg-gold-400 bg-clip-text text-transparent opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
            Especialistas em economia de planos de saúde
          </h2>

          <h1 className="text-[32px] sm:text-[36px] md:text-4xl lg:text-[38px] xl:text-[42px] 2xl:text-[46px] font-black text-slate-900 mb-5 sm:mb-6 leading-[1.1] font-cinzel opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
            {/* Mobile: 4 linhas - mais compacto */}
            <span className="block sm:hidden">Reduza até <span className="bg-gold-400 bg-clip-text text-transparent">40%</span></span>
            <span className="block sm:hidden">do custo da sua empresa</span>
            <span className="block sm:hidden">em <span className="bg-gold-400 bg-clip-text text-transparent">Plano de Saúde</span></span>
            
            {/* Tablet SM e MD: 3 linhas */}
            <span className="hidden sm:block lg:hidden">Reduza até <span className="bg-gold-400 bg-clip-text text-transparent">40%</span></span>
            <span className="hidden sm:block lg:hidden">do custo da sua empresa</span>
            <span className="hidden sm:block lg:hidden">em <span className="bg-gold-400 bg-clip-text text-transparent">Plano de Saúde</span></span>
            
            {/* Desktop LG: 3 linhas */}
            <span className="hidden lg:block xl:hidden">Reduza até <span className="bg-gold-400 bg-clip-text text-transparent">40%</span></span>
            <span className="hidden lg:block xl:hidden">do custo da sua empresa</span>
            <span className="hidden lg:block xl:hidden">em <span className="bg-gold-400 bg-clip-text text-transparent">Plano de Saúde</span></span>
            
            {/* Desktop XL e 2XL: 3 linhas */}
            <span className="hidden xl:block">Reduza até <span className="bg-gold-400 bg-clip-text text-transparent">40%</span></span>
            <span className="hidden xl:block">do custo da sua empresa</span>
            <span className="hidden xl:block">em <span className="bg-gold-400 bg-clip-text text-transparent">Plano de Saúde</span></span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-700 max-w-lg font-medium leading-[1.6] mb-6 sm:mb-7 lg:mb-8 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
            Em 10 minutos, nossa <span className="bg-gold-400 bg-clip-text text-transparent font-bold">Inteligência Artificial</span> analisa planos em diversas operadoras e apresenta opções mais eficientes, mantendo os hospitais e laboratórios que realmente importam.
          </p>

          {/* ✅ Bullets com checks dourados elegantes e animação */}
          <ul className="space-y-3 sm:space-y-4 max-w-lg text-gray-800">
            {[
              { text: 'Para empresas a partir de 2 vidas', delay: '0.8s' },
              { text: 'Sistema integrado com Inteligência Artificial', delay: '0.9s' },
              { text: 'Análise rápida em até 10 minutos', delay: '1.0s' },
              { text: 'Sua redução aplicada em até 7 dias', delay: '1.1s' },
            ].map((item, i) => (
              <li 
                key={i} 
                className="flex items-center gap-3 sm:gap-4 group opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
                style={{ animationDelay: item.delay }}
              >
                {/* Check dourado com gradiente */}
                <div className="relative flex-shrink-0">
                  {/* Glow sutil */}
                  <div className="absolute inset-0 bg-gold-400 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                  
                  {/* Check circle com efeito 3D */}
                  <div className="relative w-6 h-6 sm:w-7 sm:h-7 bg-gold-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 transform group-hover:shadow-2xl">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                {/* Texto */}
                <p className="text-sm sm:text-base font-medium group-hover:text-gold-400 transition-colors duration-300">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ✅ Coluna Direita: Formulário com glassmorphism e animação */}
        <div className="relative bg-white/60 backdrop-blur-xl p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] xl:rounded-[3.5rem] border border-white/40 shadow-2xl opacity-0 animate-[fadeInRight_0.8s_ease-out_0.5s_forwards] hover:shadow-[0_20px_60px_rgba(191,149,63,0.15)] transition-shadow duration-500">
          {/* Efeito de brilho no fundo */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] xl:rounded-[3.5rem] pointer-events-none" />
          
          <h3 className="relative text-lg sm:text-xl md:text-2xl font-black text-slate-900 uppercase italic mb-3 sm:mb-4 font-cinzel">
            <span className="bg-gold-400 bg-clip-text text-transparent">
              Análise em 10 minutos
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
            Preencha abaixo e descubra quanto você pode <span className="font-semibold text-gray-800">economizar</span> no seu plano de saúde.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nome */}
            <div>
              <label className="block uppercase text-gray-400 font-bold mb-2 text-xs lg:text-sm tracking-widest">
                Nome ou empresa *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Seu nome ou Empresa"
                className={`w-full p-3 lg:p-4 rounded-xl border-2 text-base lg:text-base bg-white focus:outline-none transition-colors ${
                  errors.nome ? 'border-red-500 focus:border-red-600' : 'border-gray-200 focus:border-gold-400'
                }`}
                required
              />
              {errors.nome && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.nome}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block uppercase text-gray-400 font-bold mb-2 text-xs lg:text-sm tracking-widest">
                E-mail *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Seu melhor e-mail"
                className={`w-full p-3 lg:p-4 rounded-xl border-2 text-base lg:text-base bg-white focus:outline-none transition-colors ${
                  errors.email ? 'border-red-500 focus:border-red-600' : 'border-gray-200 focus:border-gold-400'
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block uppercase text-gray-400 font-bold mb-2 text-xs lg:text-sm tracking-widest">
                WhatsApp *
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="Ex: (21) 98888-7777"
                className={`w-full p-3 lg:p-4 rounded-xl border-2 text-base lg:text-base bg-white focus:outline-none transition-colors ${
                  errors.telefone ? 'border-red-500 focus:border-red-600' : 'border-gray-200 focus:border-gold-400'
                }`}
                maxLength={15}
                required
              />
              {errors.telefone && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.telefone}
                </p>
              )}
            </div>

            {/* Perfil */}
            <div>
              <label className="block uppercase text-gray-400 font-bold mb-2 text-xs lg:text-sm tracking-widest">
                Tipo de Plano *
              </label>
              <select
                name="perfil"
                value={formData.perfil}
                onChange={handleChange}
                className={`w-full p-3 lg:p-4 rounded-xl border-2 text-base lg:text-base bg-white focus:outline-none transition-colors ${
                  errors.perfil ? 'border-red-500 focus:border-red-600' : 'border-gray-200 focus:border-gold-400'
                }`}
                required
              >
                <option value="">Selecione o tipo</option>
                <option value="Empresarial 3-10 vidas">Empresarial (3 a 10 vidas)</option>
                <option value="Empresarial 11-29 vidas">Empresarial (11 a 29 vidas)</option>
                <option value="Empresarial 30+ vidas">Empresarial (30+ vidas)</option>
                <option value="MEI/PJ">MEI ou Pessoa Jurídica</option>
                <option value="Individual/Familiar">Individual ou Familiar</option>
              </select>
              {errors.perfil && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.perfil}
                </p>
              )}
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative bg-gradient-to-r from-[#8B7355] via-[#B8860B] to-[#8B7355] w-full py-5 rounded-2xl uppercase text-xs tracking-[3px] font-black flex items-center justify-center gap-3 text-white disabled:opacity-50 hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              <span className="relative">{isSubmitting ? 'Enviando...' : 'Solicitar cotação gratuita'}</span>
              {!isSubmitting && (
                <svg className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              )}
            </button>

            <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Retorno em até 10 minutos
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
