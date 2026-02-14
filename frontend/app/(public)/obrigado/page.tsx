'use client';

import { useEffect } from 'react';
import { trackLeadGeneration } from '@/app/lib/metaPixel';
import { trackGTMEvent } from '@/app/components/GoogleTagManager';
import { trackEvent } from '@/app/components/GoogleAnalytics';

export default function ObrigadoPage() {
  useEffect(() => {
    // ✅ Meta Pixel: conversão de lead
    trackLeadGeneration({
      leadId: `conversion-${Date.now()}`,
      nome: 'Conversão Landing Page',
      operadora: 'N/A',
      economiaEstimada: 0,
    });

    // ✅ Google Tag Manager: evento de conversão
    trackGTMEvent('conversion', {
      event_category: 'Lead',
      event_label: 'Thank You Page',
      send_to: 'conversion',
    });

    // ✅ Google Analytics: evento de conversão
    trackEvent('generate_lead', {
      event_category: 'Lead',
      event_label: 'thank_you_page',
      value: 1,
      currency: 'BRL',
    });

    // ✅ Meta Pixel: evento de page view específico (obrigado)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'CompleteRegistration', {
        content_name: 'Cotação Solicitada',
        content_category: 'Lead Conversion',
        status: 'completed',
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-black flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#bf953f] to-[#aa771c] blur-3xl opacity-30 rounded-full" />
            <div className="relative bg-gradient-to-r from-[#bf953f] to-[#aa771c] w-24 h-24 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-6 font-cinzel">
          Solicitação Recebida!
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-4 font-light">
          Sua cotação personalizada está sendo processada
        </p>

        {/* Main Message */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-5 sm:p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#bf953f] to-[#aa771c] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white mb-2">
                ⏱️ Retornamos em até <span className="text-[#bf953f]">10 minutos</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Nossa equipe já está analisando seu perfil e buscando as melhores opções do mercado.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#bf953f] to-[#aa771c] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white mb-2">
                📱 Entraremos em contato via <span className="text-[#bf953f]">WhatsApp</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enviaremos sua cotação personalizada com até 3 opções de planos e preços finais.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#bf953f] to-[#aa771c] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white mb-2">
                🎯 Análise <span className="text-[#bf953f]">100% gratuita</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sem custo inicial. Você só contrata se aprovar a economia proposta.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/5521988179407?text=Olá!%20Acabei%20de%20solicitar%20uma%20cotação."
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] px-8 py-4 rounded-xl text-sm font-bold text-white hover:scale-105 transition-transform shadow-xl"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
            </svg>
            Falar Agora no WhatsApp
          </a>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 px-8 py-4 rounded-xl text-sm font-bold text-white hover:bg-white/20 transition-colors"
          >
            ← Voltar ao Início
          </a>
        </div>

        {/* Extra info */}
        <p className="text-gray-500 text-xs mt-8">
          💡 <strong>Dica:</strong> Mantenha seu WhatsApp ativo para receber a cotação rapidamente
        </p>
      </div>
    </div>
  );
}
