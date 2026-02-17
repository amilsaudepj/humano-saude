"use client"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  X,
  LayoutDashboard,
  UserPlus,
  Mail,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Logo, { LogoIcon } from "./Logo"
import {
  sidebarItems,
  badgeStyles,
  resolveColors,
  footerItems,
} from "@/lib/sidebar-config"
import { useSidebarNav, useSidebarConvite } from "./hooks/useSidebar"

const SIDEBAR_COLLAPSED_WIDTH = 72
const SIDEBAR_EXPANDED_WIDTH = 332

// ═══════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════

export default function DockSidebar() {
  const nav = useSidebarNav()
  const convite = useSidebarConvite()

  // ─── Render menu items ──────────────────
  const renderSubItems = (
    children: typeof sidebarItems[number]["children"],
    depth: number,
    activeClass: string,
    onNav?: () => void,
  ) => {
    if (!children?.length) return null
    return (
      <div className={cn("mt-1 space-y-0.5 border-l border-white/10", depth === 0 ? "ml-4 pl-3" : "ml-3 pl-3")}>
        {children.map((child) => {
          const ChildIcon = child.icon
          const hasNested = !!child.children?.length
          const isActive = nav.isSubItemActive(child)
          const isOpen = hasNested ? nav.isMenuOpen(child) : false
          const highlighted = isActive || isOpen

          if (!hasNested && child.href) {
            return (
              <Link key={child.id} href={child.href} onClick={onNav}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    isActive ? activeClass : "text-white/60 hover:text-white/80 hover:bg-white/5",
                  )}
                >
                  <ChildIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm flex-1 min-w-0 whitespace-normal leading-snug">{child.label}</span>
                  {child.badge && (
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold ml-auto", badgeStyles[child.badge.variant])}>
                      {child.badge.text}
                    </span>
                  )}
                </div>
              </Link>
            )
          }

          return (
            <div key={child.id}>
              <button
                onClick={() => nav.toggleMenu(child.id, isOpen)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  highlighted ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-white/60 hover:text-white/80 hover:bg-white/5",
                )}
              >
                <ChildIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm flex-1 min-w-0 text-left whitespace-normal leading-snug">{child.label}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {renderSubItems(child.children, depth + 1, activeClass, onNav)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMenu = (expanded: boolean, onNav?: () => void) => (
    <nav className="space-y-0.5 px-2">
      {sidebarItems.map((item) => {
        const Icon = item.icon
        const hasChildren = !!item.children?.length
        const isOpen = hasChildren ? nav.isMenuOpen(item) : false
        const childActive = hasChildren && nav.isChildActive(item)
        const active = item.href ? nav.isActive(item.href) : false
        const highlighted = active || childActive || isOpen
        const colors = resolveColors(item, highlighted)

        if (!hasChildren && item.href) {
          return (
            <Link key={item.id} href={item.href} onClick={onNav}>
              <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative", colors.parentBg)}>
                <Icon className={cn("h-5 w-5 flex-shrink-0", colors.icon)} />
                {expanded && (
                  <>
                    <span className={cn("text-sm font-medium flex-1 min-w-0 whitespace-normal leading-snug", colors.text)}>{item.label}</span>
                    {item.badge && (
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", badgeStyles[item.badge.variant])}>{item.badge.text}</span>
                    )}
                  </>
                )}
                <Tooltip expanded={expanded} label={item.label} />
              </div>
            </Link>
          )
        }

        return (
          <div key={item.id}>
            <button
              onClick={() => expanded ? nav.toggleMenu(item.id, isOpen) : nav.setIsExpanded(true)}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative", colors.parentBg)}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", colors.icon)} />
              {expanded && (
                <>
                  <span className={cn("text-sm font-medium flex-1 min-w-0 text-left whitespace-normal leading-snug", colors.text)}>{item.label}</span>
                  {item.badge && (
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold mr-1", badgeStyles[item.badge.variant])}>{item.badge.text}</span>
                  )}
                  <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform duration-200", isOpen && "rotate-180")} />
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
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  {renderSubItems(item.children, 0, colors.childActive, onNav)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </nav>
  )

  // ─── Render footer ──────────────────────
  const renderFooter = (expanded: boolean, onNav?: () => void) => (
    <div className="border-t border-white/10 p-2 space-y-1">
      <button
        onClick={() => { convite.setShowConvite(true); onNav?.() }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors group relative"
      >
        <UserPlus className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
        {expanded && <span className="text-sm text-[#D4AF37] font-semibold">{footerItems.convite.label}</span>}
        <Tooltip expanded={expanded} label={footerItems.convite.label} className="text-[#D4AF37]" />
      </button>
      <Link href={footerItems.ajuda.href!} onClick={onNav}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group relative">
          <footerItems.ajuda.icon className="h-5 w-5 text-white/50 flex-shrink-0" />
          {expanded && <span className="text-sm text-white/70">{footerItems.ajuda.label}</span>}
          <Tooltip expanded={expanded} label={footerItems.ajuda.label} />
        </div>
      </Link>
      <div
        onClick={() => { onNav?.(); nav.handleLogout() }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group relative"
      >
        <footerItems.sair.icon className="h-5 w-5 text-white/50 flex-shrink-0" />
        {expanded && <span className="text-sm text-white/70">{footerItems.sair.label}</span>}
        <Tooltip expanded={expanded} label={footerItems.sair.label} />
      </div>
    </div>
  )

  // ─── Render ─────────────────────────────
  return (
    <>
      {/* DESKTOP */}
      <motion.aside
        initial={{ width: SIDEBAR_COLLAPSED_WIDTH }}
        animate={{ width: nav.isExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => nav.setIsExpanded(true)}
        onMouseLeave={() => nav.setIsExpanded(false)}
        data-tour="admin-docksidebar"
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-[#0B1215]/95 backdrop-blur-xl border-r border-white/10 flex-col z-50"
      >
        <div className="h-16 flex items-center justify-center border-b border-white/10 px-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {nav.isExpanded ? (
              <motion.div key="full" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center justify-center h-10 w-full">
                <Logo variant="2" size="sm" className="max-w-[140px] max-h-[32px] [&_img]:max-h-[32px] [&_img]:w-auto" />
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} className="flex items-center justify-center h-8 w-8">
                <LogoIcon variant="2" size="sm" className="max-h-[28px] max-w-[28px] [&_img]:max-h-[28px] [&_img]:w-auto" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 sidebar-scroll">
          {renderMenu(nav.isExpanded)}
        </div>
        {renderFooter(nav.isExpanded)}
      </motion.aside>

      {/* MOBILE TOGGLE */}
      <button
        onClick={() => nav.setIsMobileOpen(!nav.isMobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 h-14 w-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F6E05E] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 z-50"
      >
        {nav.isMobileOpen ? <X className="h-6 w-6 text-black" /> : <LayoutDashboard className="h-6 w-6 text-black" />}
      </button>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {nav.isMobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => nav.setIsMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-80 bg-[#0B1215]/98 backdrop-blur-xl border-r border-white/10 flex flex-col z-50"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                <Logo variant="2" size="sm" className="max-w-[140px] max-h-[36px]" />
                <button onClick={() => nav.setIsMobileOpen(false)} className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
                  <X className="h-5 w-5 text-white/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 sidebar-scroll">
                {renderMenu(true, () => nav.setIsMobileOpen(false))}
              </div>
              {renderFooter(true, () => nav.setIsMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MODAL CONVIDAR CORRETOR */}
      <ConviteModal {...convite} />
    </>
  )
}

// ═══════════════════════════════════════════
// Sub-componentes
// ═══════════════════════════════════════════

/** Tooltip que aparece quando sidebar está collapsed */
function Tooltip({ expanded, label, className }: { expanded: boolean; label: string; className?: string }) {
  if (expanded) return null
  return (
    <div className="absolute left-full ml-2 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
      <p className={cn("text-sm font-medium text-white", className)}>{label}</p>
    </div>
  )
}

/** Modal de convite de corretor */
function ConviteModal({
  showConvite,
  conviteEmail,
  setConviteEmail,
  conviteLoading,
  conviteStatus,
  conviteMsg,
  handleEnviarConvite,
  closeConvite,
}: ReturnType<typeof useSidebarConvite>) {
  return (
    <AnimatePresence>
      {showConvite && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeConvite}
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
                  <p className="text-xs text-white/40">Envie um convite para novos corretores</p>
                </div>
              </div>
              <button onClick={closeConvite} className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
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
                  <label className="text-xs text-white/50 mb-1.5 block font-medium">Email do futuro corretor</label>
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
                  O convidado receberá um email com o link da página Seja Corretor
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
