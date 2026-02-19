'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  LayoutDashboard,
  Zap,
  Wallet,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  History,
  Info,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  PERMISSION_CATEGORIES,
  ROLE_TEMPLATES,
  countActivePermissions,
  PERMISSION_KEYS,
  type PermissionKey,
  type UserPermissions,
  type PermissionItem,
} from '@/lib/permissions';
import {
  getCorretorPermissions,
  updateCorretorPermissions,
  resetCorretorPermissions,
} from '@/app/actions/permissions';

  // Ícones por categoria
const categoryIcons: Record<string, React.ReactNode> = {
  navegacao: <LayoutDashboard className="h-4 w-4" />,
  acoes: <Zap className="h-4 w-4" />,
  financeiro: <Wallet className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
};

// ─── Mapeamento do Sidebar do Corretor ─────────────────────
// Cada seção do corretor sidebar e quais permission keys a controlam
const CORRETOR_SIDEBAR_PREVIEW = [
  { label: 'Visão Geral', permKey: 'nav_home' as PermissionKey, children: [] },
  {
    label: 'Comercial', permKey: 'nav_comercial' as PermissionKey,
    children: [
      { label: 'Pipeline Visual', permKey: 'nav_comercial_pipeline' as PermissionKey },
      { label: 'Leads', permKey: 'nav_comercial_leads' as PermissionKey },
      { label: 'CRM', permKey: 'nav_comercial_crm' as PermissionKey },
      { label: 'Contatos', permKey: 'nav_comercial_crm_contatos' as PermissionKey },
      { label: 'Empresas', permKey: 'nav_comercial_crm_empresas' as PermissionKey },
      { label: 'Cotações', permKey: 'nav_comercial_cotacoes' as PermissionKey },
      { label: 'Fila de Propostas', permKey: 'nav_comercial_propostas_fila' as PermissionKey },
      { label: 'Scanner Inteligente', permKey: 'nav_comercial_propostas_ia' as PermissionKey },
      { label: 'Contratos', permKey: 'nav_comercial_contratos' as PermissionKey },
      { label: 'Vendas', permKey: 'nav_comercial_vendas' as PermissionKey },
      { label: 'Tabela de Preços', permKey: 'nav_comercial_planos' as PermissionKey },
      { label: 'Analytics CRM', permKey: 'nav_comercial_crm_analytics' as PermissionKey },
      { label: 'Oportunidades', permKey: 'nav_comercial_deals' as PermissionKey },
    ],
  },
  {
    label: 'Materiais', permKey: 'nav_materiais' as PermissionKey,
    children: [
      { label: 'Material de Vendas', permKey: 'nav_mat_vendas' as PermissionKey },
      { label: 'CriativoPRO', permKey: 'nav_mat_banners' as PermissionKey },
      { label: 'IA Clone', permKey: 'nav_mat_iaclone' as PermissionKey },
      { label: 'Galeria Salvas', permKey: 'nav_mat_galeria' as PermissionKey },
      { label: 'Meus Uploads', permKey: 'nav_mat_upload' as PermissionKey },
    ],
  },
  {
    label: 'Marketing & Ads', permKey: 'nav_marketing' as PermissionKey,
    children: [
      { label: 'Métricas & KPIs', permKey: 'nav_mkt_geral' as PermissionKey },
      { label: 'Google Analytics', permKey: 'nav_mkt_google' as PermissionKey },
      { label: 'Meta Ads', permKey: 'nav_mkt_meta' as PermissionKey },
    ],
  },
  {
    label: 'Social Flow', permKey: 'nav_social_flow' as PermissionKey,
    children: [
      { label: 'Dashboard', permKey: 'nav_sf_dashboard' as PermissionKey },
      { label: 'Composer', permKey: 'nav_sf_composer' as PermissionKey },
      { label: 'Calendário', permKey: 'nav_sf_calendario' as PermissionKey },
      { label: 'Biblioteca', permKey: 'nav_sf_biblioteca' as PermissionKey },
      { label: 'Analytics', permKey: 'nav_sf_analytics' as PermissionKey },
    ],
  },
  {
    label: 'IA & Automação', permKey: 'nav_ia_automacao' as PermissionKey,
    children: [
      { label: 'AI Performance', permKey: 'nav_ia_performance' as PermissionKey },
      { label: 'Regras & Alertas', permKey: 'nav_ia_regras' as PermissionKey },
      { label: 'Insights IA', permKey: 'nav_ia_insights' as PermissionKey },
      { label: 'Scanner IA', permKey: 'nav_ia_scanner' as PermissionKey },
      { label: 'Automações', permKey: 'nav_ia_automacoes' as PermissionKey },
      { label: 'Workflows CRM', permKey: 'nav_ia_workflows' as PermissionKey },
    ],
  },
  {
    label: 'Operações', permKey: 'nav_operacoes' as PermissionKey,
    children: [
      { label: 'Clientes', permKey: 'nav_ops_clientes' as PermissionKey },
      { label: 'Documentos', permKey: 'nav_ops_documentos' as PermissionKey },
      { label: 'Tarefas', permKey: 'nav_ops_tarefas' as PermissionKey },
      { label: 'Indicações', permKey: 'nav_ops_indicacoes' as PermissionKey },
      { label: 'Renovações', permKey: 'nav_ops_renovacoes' as PermissionKey },
    ],
  },
  { label: 'Treinamento', permKey: 'nav_ops_treinamento' as PermissionKey, children: [] },
  {
    label: 'Comunicação', permKey: 'nav_comunicacao' as PermissionKey,
    children: [
      { label: 'WhatsApp', permKey: 'nav_com_whatsapp' as PermissionKey },
      { label: 'Chat Equipe', permKey: 'nav_com_chat' as PermissionKey },
      { label: 'E-mail', permKey: 'nav_com_email' as PermissionKey },
      { label: 'Notificações', permKey: 'nav_com_notificacoes' as PermissionKey },
    ],
  },
  {
    label: 'Financeiro', permKey: 'nav_financeiro' as PermissionKey,
    children: [
      { label: 'Visão Geral', permKey: 'nav_fin_visao' as PermissionKey },
      { label: 'Produção', permKey: 'nav_fin_producao' as PermissionKey },
      { label: 'Comissões', permKey: 'nav_fin_comissoes' as PermissionKey },
      { label: 'Extrato', permKey: 'nav_fin_extrato' as PermissionKey },
      { label: 'Faturamento', permKey: 'nav_fin_faturamento' as PermissionKey },
    ],
  },
  { label: 'Configurações', permKey: null, children: [] }, // sempre visível (Perfil, Segurança)
];

interface PermissionsSheetProps {
  open: boolean;
  onClose: () => void;
  corretor: {
    id: string;
    nome: string;
    email: string;
    role: string;
  };
  onSaved?: () => void;
}

export default function PermissionsSheet({ open, onClose, corretor, onSaved }: PermissionsSheetProps) {
  const [permissions, setPermissions] = useState<Partial<UserPermissions>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Partial<UserPermissions>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    navegacao: true,
    acoes: false,
    financeiro: false,
    marketing: false,
  });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Carregar permissões do corretor
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    const result = await getCorretorPermissions(corretor.id);
    if (result.success && result.data) {
      setPermissions(result.data.permissions);
      setOriginalPermissions(result.data.permissions);
    } else {
      const template = ROLE_TEMPLATES[corretor.role] ?? ROLE_TEMPLATES['corretor'];
      setPermissions(template);
      setOriginalPermissions(template);
    }
    setLoading(false);
  }, [corretor.id, corretor.role]);

  useEffect(() => {
    if (open) loadPermissions();
  }, [open, loadPermissions]);

  // Toggle de permissão individual
  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle de item com filhos (master toggle)
  const toggleParentWithChildren = (item: PermissionItem) => {
    if (!item.children?.length) {
      togglePermission(item.key);
      return;
    }

    const childKeys = item.children.map((c) => c.key);
    const allChildrenEnabled = childKeys.every((k) => permissions[k] === true);
    const newValue = !allChildrenEnabled;

    setPermissions((prev) => {
      const updated = { ...prev, [item.key]: newValue };
      childKeys.forEach((k) => { updated[k] = newValue; });
      return updated;
    });
  };

  // Toggle de sub-item individual: se desligar último filho, desliga pai; se ligar primeiro filho, liga pai
  const toggleChild = (parentKey: PermissionKey, childKey: PermissionKey, parentItem: PermissionItem) => {
    setPermissions((prev) => {
      const updated = { ...prev, [childKey]: !prev[childKey] };
      if (!parentItem.children) return updated;

      const anyChildActive = parentItem.children.some((c) =>
        c.key === childKey ? updated[c.key] : prev[c.key] === true,
      );
      updated[parentKey] = anyChildActive;
      return updated;
    });
  };

  // Toggle de categoria inteira (incluindo filhos de todos os itens)
  const toggleCategory = (categoryId: string) => {
    const category = PERMISSION_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;

    // Contar todas as chaves (itens + filhos)
    const allCategoryKeys: PermissionKey[] = [];
    category.items.forEach((item) => {
      allCategoryKeys.push(item.key);
      item.children?.forEach((c) => allCategoryKeys.push(c.key));
    });

    const allEnabled = allCategoryKeys.every((k) => permissions[k] === true);
    const newValue = !allEnabled;

    setPermissions((prev) => {
      const updated = { ...prev };
      allCategoryKeys.forEach((k) => { updated[k] = newValue; });
      return updated;
    });
  };

  // Salvar permissões
  const handleSave = async () => {
    setSaving(true);
    const result = await updateCorretorPermissions(
      corretor.id,
      permissions as Partial<UserPermissions>,
      `Atualização manual via painel admin`,
    );

    if (result.success) {
      toast.success('Permissões atualizadas com sucesso!', {
        description: `${result.changedKeys?.length ?? 0} permissão(ões) alterada(s)`,
      });
      setOriginalPermissions({ ...permissions });
      onSaved?.();
    } else {
      toast.error(result.error || 'Erro ao salvar permissões');
    }
    setSaving(false);
  };

  // Resetar para template do cargo
  const handleReset = async () => {
    setSaving(true);
    const result = await resetCorretorPermissions(corretor.id);
    if (result.success) {
      toast.success('Permissões resetadas para o padrão do cargo');
      await loadPermissions();
      onSaved?.();
    } else {
      toast.error(result.error || 'Erro ao resetar');
    }
    setSaving(false);
  };

  // Verificar se houve alterações
  const hasChanges = JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  const activeCount = countActivePermissions(permissions as Partial<UserPermissions>);
  const totalCount = PERMISSION_KEYS.length;

  // Role badge
  const roleBadge: Record<string, { label: string; cls: string }> = {
    administrador: { label: 'ADMINISTRADOR', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    admin: { label: 'ADMIN', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    assistente: { label: 'ASSISTENTE', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    gestor_trafego: { label: 'GESTOR DE TRÁFEGO', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    corretor: { label: 'CORRETOR', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  };

  const badge = roleBadge[corretor.role] ?? roleBadge['corretor'];

  // ---------- Render helpers ----------

  /** Checkbox visual */
  const Checkbox = ({ checked, indeterminate, size = 18 }: { checked: boolean; indeterminate?: boolean; size?: number }) => (
    <div
      className={cn(
        'rounded border flex items-center justify-center transition-all shrink-0',
        checked
          ? 'bg-[#D4AF37] border-[#D4AF37]'
          : indeterminate
            ? 'bg-[#D4AF37]/30 border-[#D4AF37]/50'
            : 'border-white/20 group-hover:border-white/40',
      )}
      style={{ width: size, height: size }}
    >
      {checked && <Check className="text-black" style={{ width: size * 0.65, height: size * 0.65 }} />}
      {!checked && indeterminate && <Minus className="text-black" style={{ width: size * 0.6, height: size * 0.6 }} />}
    </div>
  );

  /** Contagem de itens + filhos habilitados numa categoria */
  const getCategoryStats = (categoryId: string) => {
    const category = PERMISSION_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return { enabled: 0, total: 0 };
    let enabled = 0;
    let total = 0;
    category.items.forEach((item) => {
      if (item.children?.length) {
        item.children.forEach((c) => {
          total++;
          if (permissions[c.key] === true) enabled++;
        });
      } else {
        total++;
        if (permissions[item.key] === true) enabled++;
      }
    });
    return { enabled, total };
  };

  /** Contagem de filhos habilitados de um item */
  const getItemChildStats = (item: PermissionItem) => {
    if (!item.children?.length) return null;
    const enabled = item.children.filter((c) => permissions[c.key] === true).length;
    return { enabled, total: item.children.length };
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet (lateral direita) */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-screen w-full max-w-lg bg-[#0B1215] border-l border-white/[0.08] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#D4AF37]" />
                  Permissões
                </h2>
                <p className="text-sm text-white/50 mt-0.5">{corretor.nome}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', badge.cls)}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {activeCount}/{totalCount} ativas
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="h-6 w-6 text-[#D4AF37] animate-spin" />
                </div>
              ) : (
                <>
                  {/* Dica */}
                  <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-3 flex items-start gap-2">
                    <Info className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#D4AF37]/80">
                      Personalize as permissões deste usuário. Expanda cada seção para controlar sub-itens individualmente.
                    </p>
                  </div>

                  {/* Preview do Sidebar do Corretor */}
                  {(corretor.role === 'corretor') && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-[#D4AF37]" />
                        <span className="text-sm font-semibold text-white">Preview: Menu do Corretor</span>
                        <span className="text-[10px] text-white/30 ml-auto">
                          {CORRETOR_SIDEBAR_PREVIEW.filter(s => s.permKey === null || permissions[s.permKey] === true).length}/{CORRETOR_SIDEBAR_PREVIEW.length} seções
                        </span>
                      </div>
                      <div className="px-4 py-3 space-y-1">
                        {CORRETOR_SIDEBAR_PREVIEW.map((section) => {
                          const isVisible = section.permKey === null || permissions[section.permKey] === true;
                          const visibleChildren = section.children.filter(c => permissions[c.permKey] === true);
                          return (
                            <div key={section.label}>
                              <div className="flex items-center gap-2 py-1">
                                <div className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  isVisible ? 'bg-green-400' : 'bg-red-400/50',
                                )} />
                                <span className={cn(
                                  'text-xs',
                                  isVisible ? 'text-white' : 'text-white/30 line-through',
                                )}>
                                  {section.label}
                                </span>
                                {section.permKey === null && (
                                  <span className="text-[9px] text-white/20 ml-auto">sempre visível</span>
                                )}
                                {!isVisible && section.permKey && (
                                  <span className="text-[9px] text-red-400/60 ml-auto">
                                    Habilite &quot;{PERMISSION_CATEGORIES[0].items.find(i => i.key === section.permKey)?.label ?? section.permKey}&quot;
                                  </span>
                                )}
                              </div>
                              {isVisible && visibleChildren.length > 0 && (
                                <div className="ml-5 pl-2 border-l border-white/[0.06] space-y-0.5">
                                  {section.children.map((child) => {
                                    const childVisible = permissions[child.permKey] === true;
                                    return (
                                      <div key={child.label} className="flex items-center gap-2 py-0.5">
                                        <div className={cn(
                                          'w-1.5 h-1.5 rounded-full shrink-0',
                                          childVisible ? 'bg-green-400/70' : 'bg-white/10',
                                        )} />
                                        <span className={cn(
                                          'text-[11px]',
                                          childVisible ? 'text-white/70' : 'text-white/20 line-through',
                                        )}>
                                          {child.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Categorias com checklist */}
                  {PERMISSION_CATEGORIES.map((category) => {
                    const isExpanded = expandedCategories[category.id] ?? false;
                    const stats = getCategoryStats(category.id);
                    const allEnabled = stats.enabled === stats.total && stats.total > 0;
                    const someEnabled = stats.enabled > 0 && !allEnabled;

                    return (
                      <div
                        key={category.id}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
                      >
                        {/* Category Header */}
                        <button
                          onClick={() => setExpandedCategories((prev) => ({ ...prev, [category.id]: !prev[category.id] }))}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-[#D4AF37]">
                            {categoryIcons[category.id]}
                          </span>
                          <span className="text-sm font-semibold text-white flex-1 text-left">
                            {category.label}
                          </span>
                          <span className="text-[10px] text-white/40 mr-2">
                            {stats.enabled}/{stats.total}
                          </span>

                          {/* Toggle all da categoria */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCategory(category.id); }}
                            className="mr-2 group"
                          >
                            <Checkbox checked={allEnabled} indeterminate={someEnabled} />
                          </button>

                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-white/40 transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                          />
                        </button>

                        {/* Permission Items */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-white/[0.04] px-4 py-2 space-y-0.5">
                                {category.items.map((item) => {
                                  const hasChildren = !!(item.children?.length);
                                  const childStats = getItemChildStats(item);
                                  const isItemExpanded = expandedItems[item.key] ?? false;
                                  const isEnabled = permissions[item.key] === true;

                                  // Para itens com filhos: checked se todos filhos true, indeterminate se parcial
                                  const itemAllEnabled = childStats ? childStats.enabled === childStats.total : false;
                                  const itemSomeEnabled = childStats ? childStats.enabled > 0 && !itemAllEnabled : false;

                                  return (
                                    <div key={item.key}>
                                      {/* Item principal */}
                                      <div className="flex items-center gap-2">
                                        {/* Expand arrow (somente se tem filhos) */}
                                        {hasChildren ? (
                                          <button
                                            onClick={() => setExpandedItems((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/5 transition-colors shrink-0"
                                          >
                                            <ChevronRight
                                              className={cn(
                                                'h-3.5 w-3.5 text-white/40 transition-transform',
                                                isItemExpanded && 'rotate-90',
                                              )}
                                            />
                                          </button>
                                        ) : (
                                          <div className="w-6 shrink-0" />
                                        )}

                                        {/* Row clicável */}
                                        <button
                                          onClick={() => hasChildren ? toggleParentWithChildren(item) : togglePermission(item.key)}
                                          className="flex-1 flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                                        >
                                          <Checkbox
                                            checked={hasChildren ? itemAllEnabled : isEnabled}
                                            indeterminate={hasChildren ? itemSomeEnabled : false}
                                          />
                                          <div className="flex-1 text-left">
                                            <span className={cn(
                                              'text-sm block',
                                              (hasChildren ? (itemAllEnabled || itemSomeEnabled) : isEnabled)
                                                ? 'text-white'
                                                : 'text-white/50',
                                            )}>
                                              {item.label}
                                            </span>
                                            {!hasChildren && (
                                              <span className="text-[11px] text-white/30 block leading-tight">
                                                {item.description}
                                              </span>
                                            )}
                                          </div>
                                          {childStats && (
                                            <span className="text-[10px] text-white/30">
                                              {childStats.enabled}/{childStats.total}
                                            </span>
                                          )}
                                        </button>
                                      </div>

                                      {/* Sub-itens (filhos) */}
                                      <AnimatePresence>
                                        {hasChildren && isItemExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="ml-8 pl-4 border-l border-white/[0.06] space-y-0.5 py-1">
                                              {item.children!.map((child) => {
                                                const childEnabled = permissions[child.key] === true;
                                                return (
                                                  <button
                                                    key={child.key}
                                                    onClick={() => toggleChild(item.key, child.key, item)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                                                  >
                                                    <Checkbox checked={childEnabled} size={16} />
                                                    <span className={cn(
                                                      'text-[13px]',
                                                      childEnabled ? 'text-white' : 'text-white/40',
                                                    )}>
                                                      {child.label}
                                                    </span>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* Histórico (link) */}
                  <div className="flex items-center gap-2 pt-2">
                    <History className="h-3.5 w-3.5 text-white/30" />
                    <span className="text-[11px] text-white/30">
                      Alterações são rastreadas automaticamente no audit log
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer com botões */}
            <div className="border-t border-white/[0.08] p-4 space-y-2">
              {/* Resetar */}
              <button
                onClick={handleReset}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white/60 transition-all text-sm disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar para padrão do cargo
              </button>

              {/* Salvar */}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-50',
                  hasChanges
                    ? 'bg-[#D4AF37] text-black hover:bg-[#C4A137]'
                    : 'bg-white/[0.05] text-white/40',
                )}
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {hasChanges ? 'Salvar Alterações' : 'Nenhuma Alteração'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
