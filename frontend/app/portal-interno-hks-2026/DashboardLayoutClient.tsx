'use client';

import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import DockSidebar from '../components/DockSidebar';
import { Toaster } from '@/components/ui/sonner';
import NotificationBell from '@/components/notifications/NotificationBell';
import GuidedTour from '@/app/components/tour/GuidedTour';
import TenantInitClient from './TenantInitClient';
import { TenantThemeProvider } from '@/app/components/TenantThemeProvider';

// Mapa de títulos por rota — Admin
const ADMIN_TITLE_MAP: Record<string, string> = {
  '/portal-interno-hks-2026': 'Dashboard',
  '/portal-interno-hks-2026/leads': 'Leads',
  '/portal-interno-hks-2026/leads-afiliados': 'Leads dos Afiliados',
  '/portal-interno-hks-2026/pipeline': 'Pipeline',
  '/portal-interno-hks-2026/crm': 'CRM',
  '/portal-interno-hks-2026/crm/contacts': 'CRM · Contatos',
  '/portal-interno-hks-2026/crm/companies': 'CRM · Empresas',
  '/portal-interno-hks-2026/crm/deals': 'CRM · Deals',
  '/portal-interno-hks-2026/crm/analytics': 'CRM · Analytics',
  '/portal-interno-hks-2026/cotacoes': 'Cotações',
  '/portal-interno-hks-2026/propostas/fila': 'Fila de Propostas',
  '/portal-interno-hks-2026/propostas/ia': 'Scanner Inteligente',
  '/portal-interno-hks-2026/contratos': 'Contratos',
  '/portal-interno-hks-2026/vendas': 'Vendas',
  '/portal-interno-hks-2026/planos': 'Tabela de Preços',
  '/portal-interno-hks-2026/materiais': 'Materiais de Vendas',
  '/portal-interno-hks-2026/materiais/banners': 'Banners',
  '/portal-interno-hks-2026/materiais/galeria': 'Galeria',
  '/portal-interno-hks-2026/materiais/ia-clone': 'IA Clone',
  '/portal-interno-hks-2026/materiais/uploads': 'Uploads',
  '/portal-interno-hks-2026/meta-ads': 'Meta Ads',
  '/portal-interno-hks-2026/cockpit': 'Social Flow',
  '/portal-interno-hks-2026/performance': 'Performance IA',
  '/portal-interno-hks-2026/regras-ia': 'Regras IA',
  '/portal-interno-hks-2026/insights': 'Insights',
  '/portal-interno-hks-2026/scanner': 'Scanner',
  '/portal-interno-hks-2026/automacao': 'Automações',
  '/portal-interno-hks-2026/workflows': 'Workflows',
  '/portal-interno-hks-2026/clientes': 'Clientes',
  '/portal-interno-hks-2026/documentos': 'Documentos',
  '/portal-interno-hks-2026/tarefas': 'Tarefas',
  '/portal-interno-hks-2026/afiliados': 'Afiliados',
  '/portal-interno-hks-2026/corretores/painel': 'Corretores',
  '/portal-interno-hks-2026/renovacoes': 'Renovações',
  '/portal-interno-hks-2026/whatsapp': 'WhatsApp',
  '/portal-interno-hks-2026/chat': 'Chat',
  '/portal-interno-hks-2026/chat/permissoes': 'Permissões Chat',
  '/portal-interno-hks-2026/email': 'E-mail',
  '/portal-interno-hks-2026/notificacoes': 'Notificações',
  '/portal-interno-hks-2026/producao': 'Produção',
  '/portal-interno-hks-2026/financeiro': 'Financeiro',
  '/portal-interno-hks-2026/faturamento': 'Faturamento',
  '/portal-interno-hks-2026/analytics': 'Analytics',
  '/portal-interno-hks-2026/configuracoes': 'Configurações',
  '/portal-interno-hks-2026/usuarios': 'Usuários',
  '/portal-interno-hks-2026/integracoes': 'Integrações',
  '/portal-interno-hks-2026/seguranca': 'Segurança',
  '/portal-interno-hks-2026/tenants': 'Corretoras',
};

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  tenantSlug: string | null;
  tenantDomain: string | null;
}

export default function DashboardLayoutClient({ children, tenantSlug, tenantDomain }: DashboardLayoutClientProps) {
  const pathname = usePathname();

  useEffect(() => {
    const title = ADMIN_TITLE_MAP[pathname] || 'Painel Admin';
    document.title = `${title} · Admin | Humano Saúde`;
  }, [pathname]);

  return (
    <div className="admin-panel relative min-h-screen bg-brand-black text-gray-100">
      {/* TenantInitClient: bootstrap do store com o tenant do domínio customizado */}
      {tenantSlug && <TenantInitClient tenantSlug={tenantSlug} tenantDomain={tenantDomain} />}
      <TenantThemeProvider>

      {/* Background Effects - Black Piano Premium com Gold Premium */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Gradiente Radial de Profundidade */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0a_0%,#050505_50%,#000000_100%)]" />
        
        {/* Grid Sutil Dourado com Opacidade 0.02 - Luxo/Private Banking */}
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
        
        {/* Aurora Effect - Dourado Real (#D4AF37) */}
        <div className="absolute left-1/4 top-0 h-125 w-125 bg-gold-500/10 blur-[120px]" />
        
        {/* Aurora Effect - Dourado Claro (#F6E05E) */}
        <div className="absolute bottom-0 right-1/4 h-125 w-125 bg-gold-400/10 blur-[120px]" />
        
        {/* Aurora Effect - Branco sutil com toque dourado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-100 w-100 bg-linear-to-br from-white/5 to-gold-500/5 blur-[100px]" />
        
        {/* Shimmer Effect - Brilho dourado sutil */}
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-gold-500/20 to-transparent" />
      </div>

      {/* DockSidebar Enterprise - 25 itens, 8 grupos, Framer Motion */}
      <div data-tour="admin-sidebar">
        <Suspense fallback={null}>
          <DockSidebar />
        </Suspense>
      </div>

      {/* Main Content - Com margem para a sidebar */}
      <div className="relative z-10 transition-all duration-300 lg:ml-20">
        {/* Top Bar — Notification Bell */}
        <div
          data-tour="admin-topbar"
          className="fixed inset-x-0 top-0 z-40 flex items-center justify-end gap-2 border-b border-white/10 bg-brand-black/90 px-4 py-3 backdrop-blur-xl lg:static lg:z-auto lg:justify-end lg:border-0 lg:bg-transparent lg:px-6 lg:pt-5 lg:pb-0"
        >
          <NotificationBell corretorId="admin" />
          <GuidedTour role="admin" triggerMode="inline" />
        </div>

        {/* Page Content */}
        <main className="p-4 pt-20 lg:p-6 lg:pt-3">{children}</main>
      </div>
      
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />

      <style jsx global>{`
        .admin-panel [data-slot="button"][class*="bg-[#D4AF37]"],
        .admin-panel [data-slot="button"][class*="from-[#D4AF37]"],
        .admin-panel [data-slot="button"][class*="to-[#D4AF37]"] {
          color: #000000 !important;
        }

        .admin-panel [data-slot="button"][class*="bg-[#D4AF37]"] svg,
        .admin-panel [data-slot="button"][class*="from-[#D4AF37]"] svg,
        .admin-panel [data-slot="button"][class*="to-[#D4AF37]"] svg {
          color: currentColor !important;
        }
      `}</style>
      </TenantThemeProvider>
    </div>
  );
}
