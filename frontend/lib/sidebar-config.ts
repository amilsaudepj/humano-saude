import {
  LayoutDashboard,
  TrendingUp,
  Target,
  LogOut,
  HelpCircle,
  Crosshair,
  BarChart3,
  BrainCircuit,
  Gauge,
  Scale,
  ShieldAlert,
  UsersRound,
  Settings,
  Sparkles,
  ShoppingCart,
  LifeBuoy,
  Activity,
  Link2,
  MessageSquare,
  Route,
  Radar,
  Webhook,
  Megaphone,
  Calendar,
  Image,
  LineChart,
  Mail,
  Users,
  CreditCard,
  FileText,
  Palette,
  Zap,
  Clock,
  PieChart,
  DollarSign,
  MessagesSquare,
  Cog,
  User,
  Shield,
  Bell,
  Send,
  ScanLine,
  CheckSquare,
  FileArchive,
  Wallet,
  Receipt,
  Award,
  Plug,
  Filter,
  UserPlus,
  Briefcase,
  Building2,
  Columns3,
  GraduationCap,
  BookOpen,
  Compass,
} from 'lucide-react';

// ═══════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════

export type BadgeVariant = 'default' | 'gold' | 'success' | 'danger' | 'warning' | 'blue' | 'green';

export interface SubItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: { text: string; variant: BadgeVariant };
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: { text: string; variant: BadgeVariant };
  color?: 'blue' | 'green' | 'gold';
  children?: SubItem[];
}

// ═══════════════════════════════════════════
// Constantes
// ═══════════════════════════════════════════

const P = '/portal-interno-hks-2026';

export const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white',
  gold: 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black',
  success: 'bg-green-500/20 text-green-400',
  danger: 'bg-red-500 text-white',
  warning: 'bg-yellow-500/20 text-yellow-400',
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
};

// ═══════════════════════════════════════════
// Menu Items
// ═══════════════════════════════════════════

export const sidebarItems: SidebarItem[] = [
  // ── VISÃO GERAL ──
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    href: P,
    color: 'green',
  },

  // ── ANALYTICS & COCKPIT ──
  {
    id: 'analytics-hub',
    label: 'Analytics',
    icon: TrendingUp,
    children: [
      { id: 'analytics-ga4', label: 'Google Analytics', icon: TrendingUp, href: `${P}/analytics`, badge: { text: 'GA4', variant: 'danger' } },
      { id: 'analytics-metricas', label: 'Métricas & KPIs', icon: LineChart, href: `${P}/metricas`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'analytics-performance', label: 'Performance', icon: Award, href: `${P}/performance` },
      { id: 'analytics-relatorios', label: 'Relatórios', icon: BarChart3, href: `${P}/relatorios` },
    ],
  },
  {
    id: 'cockpit',
    label: 'Cockpit',
    icon: Target,
    children: [
      { id: 'cockpit-principal', label: 'Painel de Controle', icon: Gauge, href: `${P}/cockpit` },
      { id: 'cockpit-campanhas', label: 'Campanhas', icon: Crosshair, href: `${P}/cockpit/campanhas` },
      { id: 'cockpit-consolidado', label: 'Consolidado', icon: BarChart3, href: `${P}/cockpit/consolidado`, badge: { text: 'NOVO', variant: 'danger' } },
      { id: 'cockpit-connect', label: 'Conectar Plataformas', icon: Link2, href: `${P}/cockpit/consolidado/connect` },
    ],
  },

  // ── FUNIL & VENDAS ──
  {
    id: 'funil-vendas',
    label: 'Funil de Vendas',
    icon: Filter,
    color: 'gold',
    children: [
      { id: 'funil-pipeline', label: 'Pipeline Visual', icon: Filter, href: `${P}/funil`, badge: { text: '🔥', variant: 'gold' } },
      { id: 'funil-leads', label: 'Leads (CRM)', icon: Users, href: `${P}/leads`, badge: { text: '12', variant: 'danger' } },
      { id: 'funil-cotacoes', label: 'Cotações', icon: Receipt, href: `${P}/cotacoes` },
      { id: 'funil-vendas-page', label: 'Vendas', icon: DollarSign, href: `${P}/vendas` },
      { id: 'funil-contratos', label: 'Contratos', icon: FileText, href: `${P}/contratos` },
    ],
  },

  // ── PROPOSTAS ──
  {
    id: 'propostas',
    label: 'Propostas',
    icon: FileText,
    color: 'gold',
    children: [
      { id: 'propostas-fila', label: 'Fila de Propostas', icon: FileArchive, href: `${P}/propostas/fila`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'propostas-central', label: 'Gerador de Propostas', icon: FileText, href: `${P}/propostas`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'propostas-ia', label: 'Scanner Inteligente', icon: ScanLine, href: `${P}/propostas/ia`, badge: { text: 'IA', variant: 'gold' } },
      { id: 'propostas-manual', label: 'Manual (um a um)', icon: CheckSquare, href: `${P}/propostas/manual` },
    ],
  },

  // ── CRM AVANÇADO ──
  {
    id: 'crm-avancado',
    label: 'CRM',
    icon: Columns3,
    color: 'gold',
    children: [
      { id: 'crm-pipeline', label: 'Pipeline Kanban', icon: Columns3, href: `${P}/crm`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'crm-contacts', label: 'Contatos', icon: UserPlus, href: `${P}/crm/contacts` },
      { id: 'crm-companies', label: 'Empresas', icon: Building2, href: `${P}/crm/companies` },
      { id: 'crm-planos', label: 'Tabela de Preços', icon: Receipt, href: `${P}/planos` },
      { id: 'crm-analytics', label: 'Analytics CRM', icon: BarChart3, href: `${P}/crm/analytics` },
    ],
  },

  // ── AI PERFORMANCE ──
  {
    id: 'ai-performance',
    label: 'AI Performance',
    icon: BrainCircuit,
    color: 'gold',
    children: [
      { id: 'ai-dashboard', label: 'Dashboard IA', icon: Gauge, href: `${P}/ai-performance`, badge: { text: '5 Camadas', variant: 'gold' } },
      { id: 'ai-escala', label: 'Escala Automática', icon: Scale, href: `${P}/ai-performance/escala-automatica` },
      { id: 'ai-audiences', label: 'Públicos IA', icon: UsersRound, href: `${P}/ai-performance/audiences` },
      { id: 'ai-rules', label: 'Regras & Alertas', icon: ShieldAlert, href: `${P}/ai-performance/rules` },
      { id: 'ai-settings', label: 'Configurações', icon: Settings, href: `${P}/ai-performance/settings` },
      { id: 'ai-scanner', label: 'Scanner Inteligente', icon: ScanLine, href: `${P}/scanner`, badge: { text: 'IA', variant: 'gold' } },
    ],
  },

  // ── META ADS ──
  {
    id: 'meta-ads',
    label: 'Meta Ads',
    icon: Megaphone,
    color: 'blue',
    children: [
      { id: 'meta-visao', label: 'Visão Geral', icon: LayoutDashboard, href: `${P}/meta-ads` },
      { id: 'meta-cockpit', label: 'Cockpit Live', icon: Zap, href: `${P}/meta-ads/cockpit` },
      { id: 'meta-lancamento', label: 'Lançar Campanha', icon: Target, href: `${P}/meta-ads/lancamento` },
      { id: 'meta-campanhas', label: 'Campanhas', icon: Target, href: `${P}/meta-ads/campanhas` },
      { id: 'meta-criativos', label: 'Criativos', icon: Palette, href: `${P}/meta-ads/criativos` },
      { id: 'meta-demografico', label: 'Demográfico', icon: PieChart, href: `${P}/meta-ads/demografico` },
      { id: 'meta-historico', label: 'Histórico', icon: Clock, href: `${P}/meta-ads/historico` },
      { id: 'meta-config', label: 'Config. Meta', icon: Settings, href: `${P}/ai-performance/configuracoes-meta` },
    ],
  },

  // ── AUTOMAÇÃO ──
  {
    id: 'automacao',
    label: 'Automação',
    icon: Sparkles,
    children: [
      { id: 'auto-central', label: 'Central', icon: Sparkles, href: `${P}/automacao` },
      { id: 'auto-carrinhos', label: 'Carrinhos Abandonados', icon: ShoppingCart, href: `${P}/automacao/carrinhos-abandonados` },
      { id: 'auto-sala', label: 'Sala de Recuperação', icon: LifeBuoy, href: `${P}/automacao/sala-recuperacao` },
      { id: 'auto-tracking', label: 'Tracking Dashboard', icon: Activity, href: `${P}/automacao/tracking-dashboard` },
      { id: 'auto-links', label: 'Links Rastreáveis', icon: Link2, href: `${P}/automacao/links-rastreaveis` },
      { id: 'auto-jornada', label: 'Jornada de Compra', icon: Route, href: `${P}/automacao/jornada-compra` },
      { id: 'auto-pixel', label: 'Disparos de Pixel', icon: Radar, href: `${P}/automacao/disparos-pixel` },
      { id: 'auto-webhooks', label: 'Webhooks', icon: Webhook, href: `${P}/automacao/webhooks` },
    ],
  },

  // ── SOCIAL FLOW ──
  {
    id: 'social-flow',
    label: 'Social Flow',
    icon: Send,
    children: [
      { id: 'sf-dashboard', label: 'Dashboard', icon: LayoutDashboard, href: `${P}/social-flow` },
      { id: 'sf-calendario', label: 'Calendário', icon: Calendar, href: `${P}/social-flow/calendar` },
      { id: 'sf-biblioteca', label: 'Biblioteca', icon: Image, href: `${P}/social-flow/library` },
      { id: 'sf-analytics', label: 'Analytics', icon: LineChart, href: `${P}/social-flow/analytics` },
      { id: 'sf-config', label: 'Configurações', icon: Settings, href: `${P}/social-flow/settings` },
    ],
  },

  // ── CORRETORES ──
  {
    id: 'corretores',
    label: 'Corretores',
    icon: Briefcase,
    color: 'gold',
    badge: { text: 'NOVO', variant: 'gold' as BadgeVariant },
    children: [
      { id: 'corretores-lista', label: 'Solicitações', icon: UserPlus, href: `${P}/corretores` },
      { id: 'corretores-convites', label: 'Convites enviados', icon: Send, href: `${P}/corretores/convites` },
      { id: 'corretores-indicacoes', label: 'Indicações', icon: Award, href: `${P}/indicacoes` },
    ],
  },

  // ── GESTÃO & CLIENTES ──
  {
    id: 'gestao',
    label: 'Gestão',
    icon: UsersRound,
    children: [
      { id: 'gestao-clientes', label: 'Clientes', icon: Users, href: `${P}/clientes` },
      { id: 'gestao-clientes-portal', label: 'Clientes Portal', icon: UsersRound, href: `${P}/clientes-portal`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'gestao-documentos', label: 'Documentos', icon: FileArchive, href: `${P}/documentos` },
      { id: 'gestao-tarefas', label: 'Tarefas', icon: CheckSquare, href: `${P}/tarefas`, badge: { text: '5', variant: 'warning' } },
    ],
  },

  // ── FINANCEIRO ──
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: Wallet,
    children: [
      { id: 'fin-visao', label: 'Visão Geral', icon: DollarSign, href: `${P}/financeiro` },
      { id: 'fin-faturamento', label: 'Faturamento', icon: CreditCard, href: `${P}/faturamento` },
    ],
  },

  // ── COMUNICAÇÃO ──
  {
    id: 'comunicacao',
    label: 'Comunicação',
    icon: MessagesSquare,
    color: 'green',
    children: [
      { id: 'com-whatsapp', label: 'WhatsApp', icon: MessagesSquare, href: `${P}/whatsapp`, badge: { text: '8', variant: 'success' } },
      { id: 'com-chat', label: 'Chat Equipe', icon: MessageSquare, href: `${P}/chat`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'com-email', label: 'E-mail', icon: Mail, href: `${P}/email` },
      { id: 'com-notificacoes', label: 'Notificações', icon: Bell, href: `${P}/notificacoes`, badge: { text: '3', variant: 'danger' } },
    ],
  },

  // ── TREINAMENTO ──
  {
    id: 'treinamento',
    label: 'Treinamento',
    icon: GraduationCap,
    color: 'blue',
    children: [
      { id: 'training-hub', label: 'Central de Treinamento', icon: GraduationCap, href: `${P}/treinamento`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'training-tour', label: 'Tour da Plataforma', icon: Compass, href: `${P}/treinamento/tour` },
      { id: 'training-product', label: 'Treinamento de Produto', icon: BookOpen, href: `${P}/treinamento/produto` },
      { id: 'training-market', label: 'Mercado de Seguros', icon: Briefcase, href: `${P}/treinamento/mercado-seguros` },
    ],
  },

  // ── CONFIGURAÇÕES ──
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Cog,
    children: [
      { id: 'config-geral', label: 'Geral', icon: Settings, href: `${P}/configuracoes` },
      { id: 'config-perfil', label: 'Perfil', icon: User, href: `${P}/perfil` },
      { id: 'config-seguranca', label: 'Segurança', icon: Shield, href: `${P}/seguranca` },
      { id: 'config-integracoes', label: 'Integrações', icon: Plug, href: `${P}/integracoes` },
    ],
  },
];

// ═══════════════════════════════════════════
// Footer items
// ═══════════════════════════════════════════

export const footerItems = {
  convite: { icon: UserPlus, label: 'Convidar Corretor' },
  ajuda: { icon: HelpCircle, label: 'Ajuda', href: '/ajuda' },
  sair: { icon: LogOut, label: 'Sair' },
};

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

/** Resolve cor de destaque — padronizado dourado para todo o painel */
export function resolveColors(_item: SidebarItem, isHighlighted: boolean) {
  return {
    parentBg: isHighlighted
      ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20'
      : 'border border-transparent hover:bg-white/5',
    icon: isHighlighted ? 'text-[#D4AF37]' : 'text-white/50',
    text: isHighlighted ? 'text-[#D4AF37]' : 'text-white/70',
    childActive: 'bg-[#D4AF37]/20 text-[#F4D03F] font-medium border-l-2 border-[#D4AF37]',
  };
}
