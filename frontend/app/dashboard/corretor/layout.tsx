'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import CorretorSidebar from './components/CorretorSidebar';
import { Toaster } from '@/components/ui/sonner';
import { Shield, ArrowRight, LogOut, Clock, FileText, Landmark } from 'lucide-react';
import { getCorretorIdFromCookie } from './hooks/useCorretorToken';
import GuidedTour from '@/app/components/tour/GuidedTour';
import { TenantThemeProvider } from '@/app/components/TenantThemeProvider';

// Mapa de títulos por rota — Corretor
const CORRETOR_TITLE_MAP: Record<string, string> = {
  '/dashboard/corretor': 'Visão Geral',
  '/dashboard/corretor/login': 'Login',
  '/dashboard/corretor/cadastro': 'Cadastro',
  '/dashboard/corretor/onboarding': 'Onboarding',
  // Comercial
  '/dashboard/corretor/funil': 'Pipeline Visual',
  '/dashboard/corretor/propostas/fila': 'Fila de Propostas',
  '/dashboard/corretor/scanner': 'Scanner Inteligente',
  '/dashboard/corretor/cotacoes': 'Cotações',
  '/dashboard/corretor/planos': 'Tabela de Preços',
  '/dashboard/corretor/crm': 'CRM',
  '/dashboard/corretor/crm/leads': 'Leads',
  '/dashboard/corretor/crm/contacts': 'Contatos',
  '/dashboard/corretor/crm/companies': 'Empresas',
  '/dashboard/corretor/crm/deals': 'Oportunidades',
  '/dashboard/corretor/crm/metricas': 'Analytics CRM',
  '/dashboard/corretor/contratos': 'Contratos',
  '/dashboard/corretor/vendas': 'Vendas',
  // Materiais
  '/dashboard/corretor/materiais': 'Materiais de Vendas',
  '/dashboard/corretor/materiais/banners': 'CriativoPRO',
  '/dashboard/corretor/materiais/galeria': 'Galeria',
  '/dashboard/corretor/materiais/ia-clone': 'IA Clone',
  '/dashboard/corretor/materiais/uploads': 'Uploads',
  // Marketing & Ads
  '/dashboard/corretor/metricas': 'Métricas & KPIs',
  '/dashboard/corretor/performance': 'Performance',
  '/dashboard/corretor/relatorios': 'Relatórios',
  '/dashboard/corretor/cockpit': 'Cockpit',
  '/dashboard/corretor/analytics': 'Google Analytics',
  '/dashboard/corretor/meta-ads': 'Meta Ads',
  // Social Flow
  '/dashboard/corretor/social-flow': 'Social Flow',
  '/dashboard/corretor/social-flow/composer': 'Composer',
  '/dashboard/corretor/social-flow/calendar': 'Calendário',
  '/dashboard/corretor/social-flow/library': 'Biblioteca',
  '/dashboard/corretor/social-flow/approval': 'Aprovação',
  '/dashboard/corretor/social-flow/connect': 'Conectar Contas',
  '/dashboard/corretor/social-flow/analytics': 'Analytics Social',
  // IA & Automação
  '/dashboard/corretor/ai-performance': 'AI Performance',
  '/dashboard/corretor/insights': 'Insights IA',
  '/dashboard/corretor/automacao': 'Automações IA',
  '/dashboard/corretor/workflows': 'Workflows CRM',
  // Operações
  '/dashboard/corretor/clientes': 'Clientes',
  '/dashboard/corretor/documentos': 'Documentos',
  '/dashboard/corretor/tarefas': 'Tarefas',
  '/dashboard/corretor/indicacoes': 'Indicações',
  '/dashboard/corretor/renovacoes': 'Renovações',
  // Treinamento
  '/dashboard/corretor/treinamento': 'Treinamento',
  '/dashboard/corretor/treinamento/tour': 'Tour da Plataforma',
  '/dashboard/corretor/treinamento/produto': 'Treinamento de Produto',
  '/dashboard/corretor/treinamento/mercado-seguros': 'Mercado de Seguros',
  // Comunicação
  '/dashboard/corretor/whatsapp': 'WhatsApp',
  '/dashboard/corretor/chat': 'Chat Equipe',
  '/dashboard/corretor/email': 'E-mail',
  '/dashboard/corretor/notificacoes': 'Notificações',
  // Financeiro
  '/dashboard/corretor/financeiro': 'Financeiro',
  '/dashboard/corretor/financeiro/comissoes': 'Comissões',
  '/dashboard/corretor/financeiro/producao': 'Produção',
  '/dashboard/corretor/financeiro/extrato': 'Extrato',
  '/dashboard/corretor/financeiro/faturamento': 'Faturamento',
  // Configurações
  '/dashboard/corretor/configuracoes': 'Configurações',
  '/dashboard/corretor/perfil': 'Meu Perfil',
  '/dashboard/corretor/seguranca': 'Segurança',
};

export default function CorretorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = pathname === '/dashboard/corretor/login' || pathname === '/dashboard/corretor/cadastro' || pathname.startsWith('/dashboard/corretor/onboarding');
  const isPerfilPage = pathname === '/dashboard/corretor/perfil';

  const [onboardingCompleto, setOnboardingCompleto] = useState<boolean | null>(null);
  const [onboardingEtapa, setOnboardingEtapa] = useState<string>('');
  const [onboardingToken, setOnboardingToken] = useState<string>('');

  useEffect(() => {
    if (isPublicPage) return;

    const corretorId = getCorretorIdFromCookie();
    if (!corretorId) return;

    fetch('/api/corretor/perfil')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.corretor) {
          const meta = data.corretor.metadata || {};
          setOnboardingCompleto(meta.onboarding_completo === true);
          setOnboardingEtapa(meta.onboarding_etapa || '');
          setOnboardingToken(meta.onboarding_token || '');
        } else {
          setOnboardingCompleto(true); // fallback: não bloquear se erro
        }
      })
      .catch(() => {
        setOnboardingCompleto(true); // fallback
      });
  }, [isPublicPage, pathname]);

  // Atualizar título da aba do navegador
  useEffect(() => {
    const title = CORRETOR_TITLE_MAP[pathname] || 'Painel do Corretor';
    document.title = `${title} · Corretor | Humano Saúde`;
  }, [pathname]);

  // Páginas públicas (login/cadastro/onboarding) renderizam sem sidebar
  if (isPublicPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </>
    );
  }

  const handleLogout = () => {
    document.cookie = 'corretor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/dashboard/corretor/login');
  };

  const handleIrParaOnboarding = () => {
    if (onboardingToken) {
      router.push(`/dashboard/corretor/onboarding?token=${onboardingToken}`);
    }
  };

  // Determinar etapa do onboarding para exibir progresso
  const etapas = [
    { key: 'documentos', label: 'Documentos', icon: FileText, done: onboardingEtapa === 'bancario' || onboardingEtapa === 'completo' },
    { key: 'bancario', label: 'Dados Bancários', icon: Landmark, done: onboardingEtapa === 'completo' },
    { key: 'completo', label: 'Verificação', icon: Clock, done: false },
  ];

  return (
    <TenantThemeProvider>
    <div className="relative min-h-screen bg-[#050505] text-gray-100">
      {/* Background Black Piano Premium com Glassmorphism */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a0a0a_0%,_#050505_50%,_#000000_100%)]" />
        
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(212, 175, 55, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(170, 138, 46, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Aurora dourada */}
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] bg-[#D4AF37]/8 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] bg-[#F6E05E]/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] bg-gradient-to-br from-white/3 to-[#D4AF37]/3 blur-[100px]" />
        
        {/* Linha dourada top */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
      </div>

      {/* Sidebar do Corretor */}
      <div data-tour="corretor-sidebar">
        <CorretorSidebar />
      </div>

      {/* Main Content */}
      <div className="relative z-10 transition-all duration-300 lg:ml-20">
        <main className="p-4 lg:p-6">
          {/* Overlay de bloqueio: onboarding incompleto */}
          {onboardingCompleto === false && !isPerfilPage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md lg:pl-20">
              <div className="max-w-lg w-full mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center">
                {/* Ícone */}
                <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-[#D4AF37]" />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">
                  Onboarding incompleto
                </h2>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">
                  Para acessar o painel do corretor, é necessário completar todas as etapas do onboarding: 
                  envio de documentos e dados bancários.
                </p>

                {/* Progresso das etapas */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {etapas.map((etapa, i) => {
                    const EtapaIcon = etapa.icon;
                    return (
                      <div key={etapa.key} className="flex items-center gap-2">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                          etapa.done
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-white/5 text-white/30'
                        }`}>
                          <EtapaIcon className="h-4 w-4" />
                        </div>
                        <span className={`text-xs font-medium hidden sm:inline ${
                          etapa.done ? 'text-green-400' : 'text-white/30'
                        }`}>
                          {etapa.label}
                        </span>
                        {i < etapas.length - 1 && (
                          <div className={`w-6 h-px ${etapa.done ? 'bg-green-500/30' : 'bg-white/10'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botões */}
                <div className="flex flex-col gap-3">
                  {onboardingToken && (
                    <button
                      onClick={handleIrParaOnboarding}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F6E05E] transition-all"
                    >
                      Completar Onboarding
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
      
      <Toaster position="top-right" richColors closeButton />
      <GuidedTour role="corretor" />
    </div>
    </TenantThemeProvider>
  );
}
