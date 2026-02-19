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
  Link2,
  MessageSquare,
  Route,
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
  href?: string;
  badge?: { text: string; variant: BadgeVariant };
  children?: SubItem[];
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

  // ── COMERCIAL ──
  {
    id: 'comercial',
    label: 'Comercial',
    icon: Filter,
    color: 'gold',
    children: [
      { id: 'com-pipeline', label: 'Pipeline Visual', icon: Filter, href: `${P}/funil`, badge: { text: '🔥', variant: 'gold' } },
      { id: 'com-leads', label: 'Leads', icon: Users, href: `${P}/leads` },
      { id: 'com-crm', label: 'CRM Kanban', icon: Columns3, href: `${P}/crm` },
      { id: 'com-crm-contatos', label: 'Contatos', icon: UserPlus, href: `${P}/crm/contacts` },
      { id: 'com-crm-empresas', label: 'Empresas', icon: Building2, href: `${P}/crm/companies` },
      { id: 'com-cotacoes', label: 'Cotações', icon: Receipt, href: `${P}/cotacoes` },
      { id: 'com-propostas', label: 'Propostas', icon: FileText, href: `${P}/propostas` },
      { id: 'com-propostas-fila', label: 'Fila de Propostas', icon: FileArchive, href: `${P}/propostas/fila` },
      { id: 'com-propostas-ia', label: 'Propostas IA', icon: ScanLine, href: `${P}/propostas/ia`, badge: { text: 'IA', variant: 'gold' } },
      { id: 'com-propostas-manual', label: 'Propostas Manual', icon: CheckSquare, href: `${P}/propostas/manual` },
      { id: 'com-contratos', label: 'Contratos', icon: FileText, href: `${P}/contratos` },
      { id: 'com-vendas', label: 'Vendas', icon: DollarSign, href: `${P}/vendas` },
      { id: 'com-planos', label: 'Tabela de Preços', icon: Receipt, href: `${P}/planos` },
      { id: 'com-crm-analytics', label: 'Analytics CRM', icon: BarChart3, href: `${P}/crm/analytics` },
    ],
  },

  // ── MARKETING & ADS ──
  {
    id: 'marketing-ads',
    label: 'Marketing & Ads',
    icon: Megaphone,
    color: 'blue',
    children: [
      {
        id: 'mkt-geral',
        label: 'Geral',
        icon: LayoutDashboard,
        children: [
          { id: 'mkt-metricas', label: 'Métricas & KPIs', icon: LineChart, href: `${P}/metricas` },
          { id: 'mkt-performance', label: 'Performance', icon: Award, href: `${P}/performance` },
          { id: 'mkt-relatorios', label: 'Relatórios', icon: BarChart3, href: `${P}/relatorios` },
          { id: 'mkt-cockpit', label: 'Cockpit', icon: Gauge, href: `${P}/cockpit` },
          { id: 'mkt-cockpit-campanhas', label: 'Cockpit Campanhas', icon: Crosshair, href: `${P}/cockpit/campanhas` },
          { id: 'mkt-cockpit-consolidado', label: 'Cockpit Consolidado', icon: BarChart3, href: `${P}/cockpit/consolidado` },
          { id: 'mkt-cockpit-connect', label: 'Conectar Plataformas', icon: Link2, href: `${P}/cockpit/consolidado/connect` },
        ],
      },
      {
        id: 'mkt-google',
        label: 'Google',
        icon: TrendingUp,
        children: [
          { id: 'mkt-google-ga4', label: 'Google Analytics (GA4)', icon: TrendingUp, href: `${P}/analytics`, badge: { text: 'GA4', variant: 'danger' } },
          { id: 'mkt-google-config', label: 'Configurar APIs Google', icon: Settings, href: `${P}/configuracoes?tab=integracoes` },
        ],
      },
      {
        id: 'mkt-meta',
        label: 'Meta Ads',
        icon: Target,
        children: [
          { id: 'mkt-meta-visao', label: 'Visão Geral', icon: LayoutDashboard, href: `${P}/meta-ads` },
          { id: 'mkt-meta-cockpit', label: 'Cockpit Live', icon: Zap, href: `${P}/meta-ads/cockpit` },
          { id: 'mkt-meta-lancamento', label: 'Lançar Campanha', icon: Target, href: `${P}/meta-ads/lancamento` },
          { id: 'mkt-meta-campanhas', label: 'Campanhas', icon: Target, href: `${P}/meta-ads/campanhas` },
          { id: 'mkt-meta-criativos', label: 'Criativos', icon: Palette, href: `${P}/meta-ads/criativos` },
          { id: 'mkt-meta-demografico', label: 'Demográfico', icon: PieChart, href: `${P}/meta-ads/demografico` },
          { id: 'mkt-meta-historico', label: 'Histórico', icon: Clock, href: `${P}/meta-ads/historico` },
          { id: 'mkt-meta-config', label: 'Configuração', icon: Settings, href: `${P}/configuracoes?tab=integracoes` },
        ],
      },
      {
        id: 'mkt-tiktok',
        label: 'TikTok Ads',
        icon: BarChart3,
        children: [
          { id: 'mkt-tiktok-connect', label: 'Conectar TikTok', icon: Link2, href: `${P}/configuracoes?tab=integracoes` },
          { id: 'mkt-tiktok-cockpit', label: 'Cockpit Consolidado', icon: BarChart3, href: `${P}/cockpit/consolidado` },
          { id: 'mkt-tiktok-fontes', label: 'Fontes e Contas', icon: Link2, href: `${P}/cockpit/consolidado/connect` },
        ],
      },
    ],
  },

  // ── SOCIAL FLOW ──
  {
    id: 'social-flow',
    label: 'Social Flow',
    icon: Send,
    children: [
      { id: 'sf-dashboard', label: 'Dashboard', icon: LayoutDashboard, href: `${P}/social-flow` },
      { id: 'sf-composer', label: 'Composer', icon: Sparkles, href: `${P}/social-flow/composer` },
      { id: 'sf-calendario', label: 'Calendário', icon: Calendar, href: `${P}/social-flow/calendar` },
      { id: 'sf-biblioteca', label: 'Biblioteca', icon: Image, href: `${P}/social-flow/library` },
      { id: 'sf-aprovacao', label: 'Aprovação', icon: CheckSquare, href: `${P}/social-flow/approval` },
      { id: 'sf-connect', label: 'Conectar Contas', icon: Link2, href: `${P}/social-flow/connect` },
      { id: 'sf-analytics', label: 'Analytics', icon: LineChart, href: `${P}/social-flow/analytics` },
      { id: 'sf-config', label: 'Configurações', icon: Settings, href: `${P}/social-flow/settings` },
    ],
  },

  // ── IA & AUTOMAÇÃO ──
  {
    id: 'ia-automacao',
    label: 'IA & Automação',
    icon: BrainCircuit,
    color: 'gold',
    children: [
      { id: 'ia-perf', label: 'AI Performance', icon: Gauge, href: `${P}/ai-performance`, badge: { text: '5 Camadas', variant: 'gold' } },
      { id: 'ia-perf-v1', label: 'AI Dashboard (Legado)', icon: Gauge, href: `${P}/ai-performance/dashboard-ia` },
      { id: 'ia-perf-escala', label: 'Escala Automática', icon: Scale, href: `${P}/ai-performance/escala-automatica` },
      { id: 'ia-perf-audiences', label: 'Públicos IA', icon: UsersRound, href: `${P}/ai-performance/audiences` },
      { id: 'ia-perf-rules', label: 'Regras & Alertas', icon: ShieldAlert, href: `${P}/ai-performance/rules` },
      { id: 'ia-perf-settings', label: 'Configurações IA', icon: Settings, href: `${P}/ai-performance/settings` },
      { id: 'ia-regras-legacy', label: 'Regras IA (Legado)', icon: ShieldAlert, href: `${P}/regras-ia` },
      { id: 'ia-insights', label: 'Insights IA', icon: TrendingUp, href: `${P}/insights` },
      { id: 'ia-scanner', label: 'Scanner Inteligente', icon: ScanLine, href: `${P}/scanner`, badge: { text: 'IA', variant: 'gold' } },
      { id: 'ia-auto', label: 'Automações IA', icon: Sparkles, href: `${P}/automacao?section=automacoes` },
      { id: 'ia-workflows', label: 'Workflows CRM', icon: Route, href: `${P}/automacao?section=workflows` },
    ],
  },

  // ── OPERAÇÕES & PESSOAS ──
  {
    id: 'operacoes',
    label: 'Operações',
    icon: UsersRound,
    children: [
      { id: 'ops-clientes', label: 'Clientes', icon: Users, href: `${P}/clientes` },
      { id: 'ops-clientes-portal', label: 'Clientes Portal', icon: UsersRound, href: `${P}/clientes-portal`, badge: { text: 'NOVO', variant: 'gold' } },
      { id: 'ops-documentos', label: 'Documentos', icon: FileArchive, href: `${P}/documentos` },
      { id: 'ops-tarefas', label: 'Tarefas', icon: CheckSquare, href: `${P}/tarefas` },
      {
        id: 'ops-corretores',
        label: 'Corretores',
        icon: Briefcase,
        children: [
          { id: 'corr-painel', label: 'Painel de Corretores', icon: Users, href: `${P}/corretores/painel` },
          { id: 'corr-solicitacoes', label: 'Solicitações', icon: Clock, href: `${P}/corretores/solicitacoes` },
          { id: 'corr-convites', label: 'Convites', icon: UserPlus, href: `${P}/corretores/convites` },
        ],
      },
      { id: 'ops-indicacoes', label: 'Indicações', icon: Award, href: `${P}/indicacoes` },
      { id: 'ops-treinamento', label: 'Treinamento', icon: GraduationCap, href: `${P}/treinamento` },
      { id: 'ops-treinamento-tour', label: 'Tour da Plataforma', icon: Compass, href: `${P}/treinamento/tour` },
      { id: 'ops-treinamento-produto', label: 'Treinamento de Produto', icon: BookOpen, href: `${P}/treinamento/produto` },
      { id: 'ops-treinamento-mercado', label: 'Mercado de Seguros', icon: Briefcase, href: `${P}/treinamento/mercado-seguros` },
    ],
  },

  // ── COMUNICAÇÃO ──
  {
    id: 'comunicacao',
    label: 'Comunicação',
    icon: MessagesSquare,
    color: 'green',
    children: [
      { id: 'com-whatsapp', label: 'WhatsApp', icon: MessagesSquare, href: `${P}/whatsapp` },
      { id: 'com-chat', label: 'Chat Equipe', icon: MessageSquare, href: `${P}/chat` },
      { id: 'com-email', label: 'E-mail', icon: Mail, href: `${P}/email` },
      { id: 'com-notificacoes', label: 'Notificações', icon: Bell, href: `${P}/notificacoes` },
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

  // ── CONFIGURAÇÕES ──
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Cog,
    children: [
      { id: 'config-geral', label: 'Geral', icon: Settings, href: `${P}/configuracoes` },
      { id: 'config-apis', label: 'APIs & Integrações', icon: Plug, href: `${P}/configuracoes?tab=integracoes` },
      { id: 'config-usuarios', label: 'Usuários do Sistema', icon: Shield, href: `${P}/usuarios`, badge: { text: 'ADMIN', variant: 'danger' } },
      { id: 'config-perfil', label: 'Perfil', icon: User, href: `${P}/perfil` },
      { id: 'config-seguranca', label: 'Segurança', icon: Shield, href: `${P}/seguranca` },
      { id: 'config-integracoes-legacy', label: 'Integrações (Legado)', icon: Plug, href: `${P}/integracoes` },
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
