'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  DollarSign,
  FolderOpen,
  CalendarClock,
  Image,
  ChevronDown,
  X,
  LogOut,
  HelpCircle,
  FileText,
  Upload,
  Receipt,
  Palette,
  Wand2,
  Award,
  User,
  UserPlus,
  Mail,
  Loader2,
  CheckCircle,
  Send,
  FileArchive,
  Wallet,
  GraduationCap,
  Link2,
  Compass,
  BookOpen,
  Briefcase,
  // Novos ícones para menu completo
  Filter,
  Users,
  Columns3,
  Building2,
  ScanLine,
  BarChart3,
  Target,
  TrendingUp,
  Megaphone,
  Sparkles,
  BrainCircuit,
  Gauge,
  ShieldAlert,
  UsersRound,
  Settings,
  Route,
  Calendar,
  LineChart,
  MessagesSquare,
  MessageSquare,
  Bell,
  CreditCard,
  Cog,
  Shield,
  CheckSquare,
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import { SIDEBAR_PERMISSION_MAP } from '@/lib/permissions';

const SIDEBAR_COLLAPSED_WIDTH = 72;
const SIDEBAR_EXPANDED_WIDTH = 332;

// ============================================
// TIPOS
// ============================================

type BadgeVariant = 'default' | 'gold' | 'success' | 'danger' | 'warning' | 'blue' | 'green';

interface SubItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: { text: string; variant: BadgeVariant };
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: { text: string; variant: BadgeVariant };
  color?: 'gold' | 'green' | 'blue';
  children?: SubItem[];
}

// ============================================
// BASE PATH
// ============================================

const B = '/dashboard/corretor';

// ═══════════════════════════════════════════════════════════
// MENU DO CORRETOR — ESPELHA O ADMIN
// Todas as seções do admin estão aqui. O RBAC controla
// o que cada corretor pode ver via permissões.
// ═══════════════════════════════════════════════════════════

const menuItems: SidebarItem[] = [
  // ── VISÃO GERAL ──
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    href: B,
    color: 'green',
  },

  // ── COMERCIAL ──
  {
    id: 'comercial',
    label: 'Comercial',
    icon: Filter,
    color: 'gold',
    children: [
      { id: 'com-pipeline', label: 'Pipeline Visual', icon: Filter, href: `${B}/funil`, badge: { text: '🔥', variant: 'gold' } },
      { id: 'com-leads', label: 'Leads', icon: Users, href: `${B}/crm/leads` },
      { id: 'com-crm', label: 'CRM', icon: Columns3, href: `${B}/crm` },
      { id: 'com-crm-contatos', label: 'Contatos', icon: UserPlus, href: `${B}/crm/contacts` },
      { id: 'com-crm-empresas', label: 'Empresas', icon: Building2, href: `${B}/crm/companies` },
      { id: 'com-cotacoes', label: 'Cotações', icon: Receipt, href: `${B}/cotacoes` },
      { id: 'com-propostas-fila', label: 'Fila de Propostas', icon: FileArchive, href: `${B}/propostas/fila` },
      { id: 'com-propostas-ia', label: 'Scanner Inteligente', icon: ScanLine, href: `${B}/scanner`, badge: { text: 'IA', variant: 'gold' } },
      { id: 'com-contratos', label: 'Contratos', icon: FileText, href: `${B}/contratos` },
      { id: 'com-vendas', label: 'Vendas', icon: DollarSign, href: `${B}/vendas` },
      { id: 'com-planos', label: 'Tabela de Preços', icon: Receipt, href: `${B}/planos` },
      { id: 'com-crm-analytics', label: 'Analytics CRM', icon: BarChart3, href: `${B}/crm/metricas` },
      { id: 'com-deals', label: 'Oportunidades', icon: Briefcase, href: `${B}/crm/deals`, badge: { text: 'NOVO', variant: 'gold' } },
    ],
  },

  // ── MATERIAIS ──
  {
    id: 'materiais',
    label: 'Materiais',
    icon: FolderOpen,
    color: 'blue',
    children: [
      { id: 'mat-vendas', label: 'Material de Vendas', icon: FolderOpen, href: `${B}/materiais` },
      { id: 'mat-banners', label: 'CriativoPRO', icon: Palette, href: `${B}/materiais/banners`, badge: { text: 'PRO', variant: 'gold' } },
      { id: 'mat-iaclone', label: 'IA Clone', icon: Wand2, href: `${B}/materiais/ia-clone`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'mat-galeria', label: 'Galeria Salvas', icon: Image, href: `${B}/materiais/galeria` },
      { id: 'mat-upload', label: 'Meus Uploads', icon: Upload, href: `${B}/materiais/uploads` },
    ],
  },

  // ── MARKETING & ADS ──
  {
    id: 'marketing-ads',
    label: 'Marketing & Ads',
    icon: Megaphone,
    color: 'blue',
    children: [
      { id: 'mkt-metricas', label: 'Métricas & KPIs', icon: LineChart, href: `${B}/metricas` },
      { id: 'mkt-performance', label: 'Performance', icon: Award, href: `${B}/performance` },
      { id: 'mkt-relatorios', label: 'Relatórios', icon: BarChart3, href: `${B}/relatorios` },
      { id: 'mkt-cockpit', label: 'Cockpit', icon: Gauge, href: `${B}/cockpit` },
      { id: 'mkt-google-ga4', label: 'Google Analytics (GA4)', icon: TrendingUp, href: `${B}/analytics`, badge: { text: 'GA4', variant: 'danger' } },
      { id: 'mkt-meta-visao', label: 'Meta Ads', icon: Target, href: `${B}/meta-ads` },
    ],
  },

  // ── SOCIAL FLOW ──
  {
    id: 'social-flow',
    label: 'Social Flow',
    icon: Send,
    color: 'blue',
    children: [
      { id: 'sf-dashboard', label: 'Dashboard', icon: LayoutDashboard, href: `${B}/social-flow` },
      { id: 'sf-composer', label: 'Composer', icon: Sparkles, href: `${B}/social-flow/composer` },
      { id: 'sf-calendario', label: 'Calendário', icon: Calendar, href: `${B}/social-flow/calendar` },
      { id: 'sf-biblioteca', label: 'Biblioteca', icon: Image, href: `${B}/social-flow/library` },
      { id: 'sf-aprovacao', label: 'Aprovação', icon: CheckSquare, href: `${B}/social-flow/approval` },
      { id: 'sf-connect', label: 'Conectar Contas', icon: Link2, href: `${B}/social-flow/connect` },
      { id: 'sf-analytics', label: 'Analytics', icon: LineChart, href: `${B}/social-flow/analytics` },
    ],
  },

  // ── IA & AUTOMAÇÃO ──
  {
    id: 'ia-automacao',
    label: 'IA & Automação',
    icon: BrainCircuit,
    color: 'gold',
    children: [
      { id: 'ia-perf', label: 'AI Performance', icon: Gauge, href: `${B}/ai-performance`, badge: { text: '5 Camadas', variant: 'gold' } },
      { id: 'ia-perf-rules', label: 'Regras & Alertas', icon: ShieldAlert, href: `${B}/ai-performance` },
      { id: 'ia-insights', label: 'Insights IA', icon: TrendingUp, href: `${B}/insights` },
      { id: 'ia-scanner', label: 'Scanner Inteligente', icon: ScanLine, href: `${B}/scanner`, badge: { text: 'IA', variant: 'gold' } },
      { id: 'ia-auto', label: 'Automações IA', icon: Sparkles, href: `${B}/automacao` },
      { id: 'ia-workflows', label: 'Workflows CRM', icon: Route, href: `${B}/workflows` },
    ],
  },

  // ── OPERAÇÕES ──
  {
    id: 'operacoes',
    label: 'Operações',
    icon: UsersRound,
    children: [
      { id: 'ops-clientes', label: 'Clientes', icon: Users, href: `${B}/clientes` },
      { id: 'ops-documentos', label: 'Documentos', icon: FileArchive, href: `${B}/documentos` },
      { id: 'ops-tarefas', label: 'Tarefas', icon: CheckSquare, href: `${B}/tarefas` },
      { id: 'ops-indicacoes', label: 'Indicações', icon: Award, href: `${B}/indicacoes` },
      { id: 'ops-renovacoes', label: 'Renovações', icon: CalendarClock, href: `${B}/renovacoes` },
    ],
  },

  // ── TREINAMENTO ──
  {
    id: 'treinamento',
    label: 'Treinamento',
    icon: GraduationCap,
    color: 'green',
    children: [
      { id: 'ops-treinamento-central', label: 'Central', icon: GraduationCap, href: `${B}/treinamento` },
      { id: 'ops-treinamento-tour', label: 'Tour da Plataforma', icon: Compass, href: `${B}/treinamento/tour` },
      { id: 'ops-treinamento-produto', label: 'Treinamento de Produto', icon: BookOpen, href: `${B}/treinamento/produto` },
      { id: 'ops-treinamento-mercado', label: 'Mercado de Seguros', icon: Briefcase, href: `${B}/treinamento/mercado-seguros` },
    ],
  },

  // ── COMUNICAÇÃO ──
  {
    id: 'comunicacao',
    label: 'Comunicação',
    icon: MessagesSquare,
    color: 'green',
    children: [
      { id: 'com-whatsapp', label: 'WhatsApp', icon: MessagesSquare, href: `${B}/whatsapp` },
      { id: 'com-chat', label: 'Chat Equipe', icon: MessageSquare, href: `${B}/chat` },
      { id: 'com-email', label: 'E-mail', icon: Mail, href: `${B}/email` },
      { id: 'com-notificacoes', label: 'Notificações', icon: Bell, href: `${B}/notificacoes` },
    ],
  },

  // ── FINANCEIRO ──
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: Wallet,
    color: 'gold',
    children: [
      { id: 'fin-visao', label: 'Visão Geral', icon: DollarSign, href: `${B}/financeiro` },
      { id: 'fin-producao', label: 'Produção', icon: Award, href: `${B}/financeiro/producao`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'fin-comissoes', label: 'Comissões', icon: Receipt, href: `${B}/financeiro/comissoes` },
      { id: 'fin-extrato', label: 'Extrato', icon: FileText, href: `${B}/financeiro/extrato` },
      { id: 'fin-faturamento', label: 'Faturamento', icon: CreditCard, href: `${B}/financeiro/faturamento` },
    ],
  },

  // ── CONFIGURAÇÕES ──
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Cog,
    children: [
      { id: 'config-geral', label: 'Geral', icon: Settings, href: `${B}/configuracoes` },
      { id: 'config-perfil', label: 'Perfil', icon: User, href: `${B}/perfil` },
      { id: 'config-seguranca', label: 'Segurança', icon: Shield, href: `${B}/seguranca` },
    ],
  },
];

// ============================================
// BADGE STYLES
// ============================================

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white',
  gold: 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black',
  success: 'bg-green-500/20 text-green-400',
  danger: 'bg-red-500 text-white',
  warning: 'bg-yellow-500/20 text-yellow-400',
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
};

function resolveColors(item: SidebarItem, isHighlighted: boolean) {
  const colorMap = {
    gold: {
      parentBg: isHighlighted ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/30' : 'border border-transparent hover:bg-white/5',
      icon: isHighlighted ? 'text-[#D4AF37]' : 'text-white/50',
      text: isHighlighted ? 'text-[#D4AF37]' : 'text-white/70',
      childActive: 'bg-[#D4AF37]/15 text-[#F4D03F]',
    },
    green: {
      parentBg: isHighlighted ? 'bg-green-600/15 border border-green-500/30' : 'border border-transparent hover:bg-white/5',
      icon: isHighlighted ? 'text-green-400' : 'text-white/50',
      text: isHighlighted ? 'text-green-400' : 'text-white/70',
      childActive: 'bg-green-600/15 text-green-300',
    },
    blue: {
      parentBg: isHighlighted ? 'bg-blue-600/15 border border-blue-500/30' : 'border border-transparent hover:bg-white/5',
      icon: isHighlighted ? 'text-blue-400' : 'text-white/50',
      text: isHighlighted ? 'text-blue-400' : 'text-white/70',
      childActive: 'bg-blue-600/15 text-blue-300',
    },
  };

  return colorMap[item.color ?? 'gold'] ?? {
    parentBg: isHighlighted ? 'bg-white/5 border border-transparent' : 'border border-transparent hover:bg-white/5',
    icon: isHighlighted ? 'text-white' : 'text-white/50',
    text: isHighlighted ? 'text-white' : 'text-white/70',
    childActive: 'bg-white/5 text-white',
  };
}

// ============================================
// COMPONENTE SIDEBAR DO CORRETOR
// ============================================

export default function CorretorSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [closedMenus, setClosedMenus] = useState<Set<string>>(new Set());
  const [showConvite, setShowConvite] = useState(false);
  const [conviteEmail, setConviteEmail] = useState('');
  const [conviteLoading, setConviteLoading] = useState(false);
  const [conviteStatus, setConviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [conviteMsg, setConviteMsg] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { canSeeSidebarItem, loading: permLoading, permissions } = usePermissions();

  // ─── Filtra menu por permissões RBAC ────
  const filteredMenuItems = useMemo(() => {
    // Enquanto carrega, mostrar apenas Visão Geral e Meu Perfil
    if (permLoading || !permissions) {
      return menuItems.filter((item) => item.id === 'visao-geral' || item.id === 'configuracoes');
    }
    return menuItems
      .filter((item) => {
        if (item.id === 'configuracoes') return true;
        return canSeeSidebarItem(item.id);
      })
      .map((item) => {
        if (!item.children?.length) return item;
        const filteredChildren = item.children.filter((child) => {
          const childKey = SIDEBAR_PERMISSION_MAP[child.id];
          return !childKey || canSeeSidebarItem(child.id);
        });
        return { ...item, children: filteredChildren };
      })
      .filter((item) => !item.children || item.children.length > 0);
  }, [canSeeSidebarItem, permLoading, permissions]);

  const isActive = (href: string) => pathname === href;
  const isChildActive = (item: SidebarItem) =>
    item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + '/')) ?? false;

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => {
      const next = new Set<string>();
      if (!prev.has(id)) next.add(id);
      return next;
    });
    // Track explicitly closed menus (to override auto-open from active child)
    setClosedMenus((prev) => {
      const next = new Set(prev);
      if (prev.has(id)) {
        next.delete(id); // re-opening, remove from closed
      } else {
        next.add(id); // closing, track it
      }
      return next;
    });
  };

  // Reset manually opened/closed menus when route changes
  useEffect(() => {
    setOpenMenus(new Set());
    setClosedMenus(new Set());
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* redirect anyway */ }
    document.cookie = 'corretor_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/dashboard/corretor/login');
  };

  const handleEnviarConvite = async () => {
    if (!conviteEmail.trim()) return;
    setConviteLoading(true);
    setConviteStatus('idle');
    try {
      // Buscar nome do corretor
      const perfilRes = await fetch('/api/corretor/perfil');
      const perfilData = await perfilRes.json();
      const nome = perfilData?.corretor?.nome || 'Um Corretor Humano Saúde';

      const res = await fetch('/api/corretor/convite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: conviteEmail.trim(), nomeConvidante: nome }),
      });
      const data = await res.json();
      if (data.success) {
        setConviteStatus('success');
        setConviteMsg('Convite enviado com sucesso!');
        setConviteEmail('');
        setTimeout(() => { setShowConvite(false); setConviteStatus('idle'); }, 2500);
      } else {
        setConviteStatus('error');
        setConviteMsg(data.error || 'Erro ao enviar convite');
      }
    } catch {
      setConviteStatus('error');
      setConviteMsg('Erro de conexão');
    } finally {
      setConviteLoading(false);
    }
  };

  const effectiveOpen = new Set<string>();
  // Auto-open the parent whose child matches the current path,
  // UNLESS the user explicitly closed it
  filteredMenuItems.forEach((item) => {
    if (item.children && isChildActive(item) && !closedMenus.has(item.id)) {
      effectiveOpen.add(item.id);
    }
  });
  // Add manually toggled open menus
  openMenus.forEach((id) => {
    effectiveOpen.add(id);
  });

  // ============================================
  // RENDER MENU
  // ============================================

  const renderMenu = (expanded: boolean, onNav?: () => void) => (
    <nav className="space-y-0.5 px-2">
      {filteredMenuItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = !!item.children?.length;
        const isOpen = effectiveOpen.has(item.id);
        const active = item.href ? isActive(item.href) : false;
        const highlighted = active || (hasChildren && (isOpen || isChildActive(item)));
        const colors = resolveColors(item, highlighted);

        if (!hasChildren && item.href) {
          return (
            <Link key={item.id} href={item.href} onClick={onNav}>
              <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative', colors.parentBg)}>
                <Icon className={cn('h-5 w-5 flex-shrink-0', colors.icon)} />
                {expanded && (
                  <>
                    <span className={cn('text-sm font-medium flex-1 min-w-0 whitespace-normal leading-snug', colors.text)}>{item.label}</span>
                    {item.badge && (
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', badgeStyles[item.badge.variant])}>{item.badge.text}</span>
                    )}
                  </>
                )}
                {!expanded && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                  </div>
                )}
              </div>
            </Link>
          );
        }

        return (
          <div key={item.id}>
            <button
              onClick={() => expanded ? toggleMenu(item.id) : setIsExpanded(true)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative', colors.parentBg)}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', colors.icon)} />
              {expanded && (
                <>
                  <span className={cn('text-sm font-medium flex-1 min-w-0 text-left whitespace-normal leading-snug', colors.text)}>{item.label}</span>
                  {item.badge && (
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold mr-1', badgeStyles[item.badge.variant])}>{item.badge.text}</span>
                  )}
                  <ChevronDown className={cn('h-4 w-4 text-white/40 transition-transform duration-200', isOpen && 'rotate-180')} />
                </>
              )}
              {!expanded && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{item.children?.length} sub-itens</p>
                </div>
              )}
            </button>

            <AnimatePresence>
              {isOpen && expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 pl-3 border-l border-white/10 mt-1 space-y-0.5">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      // Check exact match, or startsWith only if no other sibling is a more specific match
                      const exactMatch = pathname === child.href;
                      const prefixMatch = pathname.startsWith(child.href + '/');
                      // Avoid prefix match if another sibling has a more specific match
                      const siblingHasExactOrBetterMatch = item.children?.some(
                        (sib) => sib.id !== child.id && (pathname === sib.href || pathname.startsWith(sib.href + '/'))
                          && sib.href.length > child.href.length
                      );
                      const childIsActive = exactMatch || (prefixMatch && !siblingHasExactOrBetterMatch);
                      return (
                        <Link key={child.id} href={child.href} onClick={onNav}>
                          <div className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                            childIsActive ? colors.childActive : 'text-white/60 hover:text-white/80 hover:bg-white/5',
                          )}>
                            <ChildIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm flex-1 min-w-0 whitespace-normal leading-snug">{child.label}</span>
                            {child.badge && (
                              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold ml-auto', badgeStyles[child.badge.variant])}>{child.badge.text}</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  const renderFooter = (expanded: boolean, onNav?: () => void) => (
    <div className="border-t border-white/10 p-2 space-y-1">
      <button
        onClick={() => { setShowConvite(true); onNav?.(); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors group relative"
      >
        <UserPlus className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
        {expanded && <span className="text-sm text-[#D4AF37] font-semibold">Convidar Corretor</span>}
        {!expanded && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
            <p className="text-sm font-medium text-[#D4AF37]">Convidar Corretor</p>
          </div>
        )}
      </button>
      <Link href="/ajuda" onClick={onNav}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group relative">
          <HelpCircle className="h-5 w-5 text-white/50 flex-shrink-0" />
          {expanded && <span className="text-sm text-white/70">Ajuda</span>}
        </div>
      </Link>
      <div
        onClick={() => { onNav?.(); handleLogout(); }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group relative"
      >
        <LogOut className="h-5 w-5 text-white/50 flex-shrink-0" />
        {expanded && <span className="text-sm text-white/70">Sair</span>}
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* DESKTOP */}
      <motion.aside
        initial={{ width: SIDEBAR_COLLAPSED_WIDTH }}
        animate={{ width: isExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        data-tour="corretor-docksidebar"
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-[#0B1215]/95 backdrop-blur-xl border-r border-white/10 flex-col z-50"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-white/10 px-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <NextImage
                  src="/images/logos/logo humano saude - 120x120.png"
                  alt="Humano Saúde"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white tracking-wide">Corretor</span>
                  <span className="text-[10px] text-[#D4AF37]/70 uppercase tracking-widest">Painel Operacional</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <NextImage
                  src="/images/logos/logo humano saude - 120x120.png"
                  alt="Humano Saúde"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 sidebar-scroll">
          {renderMenu(isExpanded)}
        </div>
        {renderFooter(isExpanded)}
      </motion.aside>

      {/* MOBILE TOGGLE */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed bottom-4 left-4 h-14 w-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F6E05E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 z-50"
      >
        {isMobileOpen ? <X className="h-6 w-6 text-black" /> : <LayoutDashboard className="h-6 w-6 text-black" />}
      </button>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-80 bg-[#0B1215]/98 backdrop-blur-xl border-r border-white/10 flex flex-col z-50"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <NextImage
                    src="/images/logos/logo humano saude - 120x120.png"
                    alt="Humano Saúde"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg object-contain"
                  />
                  <span className="text-sm font-semibold text-white">Corretor</span>
                </div>
                <button onClick={() => setIsMobileOpen(false)} className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
                  <X className="h-5 w-5 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 sidebar-scroll">
                {renderMenu(true, () => setIsMobileOpen(false))}
              </div>
              {renderFooter(true, () => setIsMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL CONVIDAR CORRETOR ── */}
      <AnimatePresence>
        {showConvite && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowConvite(false); setConviteStatus('idle'); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 z-[71]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Convidar Corretor</h3>
                    <p className="text-xs text-white/40">Envie um convite para ser corretor</p>
                  </div>
                </div>
                <button onClick={() => { setShowConvite(false); setConviteStatus('idle'); }} className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
                  <X className="h-4 w-4 text-white/40" />
                </button>
              </div>

              {conviteStatus === 'success' ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-green-400">{conviteMsg}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="text-xs text-white/50 mb-1.5 block font-medium">Email do amigo</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="email"
                        value={conviteEmail}
                        onChange={(e) => setConviteEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleEnviarConvite()}
                      />
                    </div>
                  </div>

                  {conviteStatus === 'error' && (
                    <p className="text-xs text-red-400 mb-3">{conviteMsg}</p>
                  )}

                  <button
                    onClick={handleEnviarConvite}
                    disabled={conviteLoading || !conviteEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F6E05E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {conviteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar Convite
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-white/30 text-center mt-3">
                    Seu amigo receberá um email com o link da página Seja Corretor
                  </p>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
