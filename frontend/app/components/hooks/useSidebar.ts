'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SidebarItem, SubItem } from '@/lib/sidebar-config';
import { sidebarItems } from '@/lib/sidebar-config';

type SidebarNode = {
  id: string;
  href?: string;
  children?: SubItem[];
};

type ParsedSidebarHref = {
  path: string;
  query: URLSearchParams;
};

function parseSidebarHref(href: string): ParsedSidebarHref {
  const [pathPart = '', queryPart = ''] = href.split('?');
  const path = pathPart.split('#')[0] || '/';
  const query = new URLSearchParams(queryPart.split('#')[0] ?? '');
  return { path, query };
}

/** Collect all href paths from sidebar config (flattened) */
function collectAllPaths(items: SidebarItem[]): string[] {
  const paths: string[] = [];
  const walk = (nodes: (SidebarItem | SubItem)[]) => {
    for (const node of nodes) {
      if (node.href) {
        const { path } = parseSidebarHref(node.href);
        paths.push(path);
      }
      if (node.children?.length) walk(node.children);
    }
  };
  walk(items);
  return paths;
}

const allSidebarPaths = collectAllPaths(sidebarItems);

// ═══════════════════════════════════════════
// Hook: Sidebar navigation state
// ═══════════════════════════════════════════

export function useSidebarNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userTogglesByLocation, setUserTogglesByLocation] = useState<Record<string, Record<string, boolean>>>({});
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const userToggles = useMemo(
    () => userTogglesByLocation[locationKey] ?? {},
    [locationKey, userTogglesByLocation],
  );

  const hasRequiredQuery = useCallback(
    (requiredQuery: URLSearchParams) => {
      for (const [key, value] of requiredQuery.entries()) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    },
    [searchParams],
  );

  const isActive = useCallback(
    (href: string) => {
      const target = parseSidebarHref(href);
      if (pathname !== target.path) return false;
      return target.query.size === 0 || hasRequiredQuery(target.query);
    },
    [hasRequiredQuery, pathname],
  );

  const isHrefMatch = useCallback(
    (href: string) => {
      const target = parseSidebarHref(href);
      // Exact path match (with optional query params)
      if (pathname === target.path) {
        return target.query.size === 0 || hasRequiredQuery(target.query);
      }
      // For items with query requirements, only exact path matches count
      if (target.query.size > 0) return false;
      // Prefix match: /propostas matches /propostas/fila
      // BUT only if NO other sidebar item has a more specific path that also matches
      if (pathname.startsWith(target.path + '/')) {
        const hasMoreSpecificSibling = allSidebarPaths.some(
          (otherPath) =>
            otherPath !== target.path &&
            otherPath.length > target.path.length &&
            otherPath.startsWith(target.path + '/') &&
            (pathname === otherPath || pathname.startsWith(otherPath + '/'))
        );
        return !hasMoreSpecificSibling;
      }
      return false;
    },
    [hasRequiredQuery, pathname],
  );

  const isNodeActive = useCallback(
    (node: SidebarNode): boolean => {
      const walk = (current: SidebarNode): boolean => {
        if (current.href && isHrefMatch(current.href)) return true;
        return current.children?.some((child) => walk(child)) ?? false;
      };
      return walk(node);
    },
    [isHrefMatch],
  );

  const isSubItemActive = useCallback(
    (item: SubItem) => isNodeActive(item),
    [isNodeActive],
  );

  const isChildActive = useCallback(
    (item: SidebarItem) => item.children?.some((c) => isNodeActive(c)) ?? false,
    [isNodeActive],
  );

  const isMenuOpen = useCallback(
    (item: SidebarItem | SubItem) => {
      if (userToggles[item.id] !== undefined) return userToggles[item.id];
      return isNodeActive(item);
    },
    [userToggles, isNodeActive],
  );

  const toggleMenu = useCallback(
    (id: string, fallbackOpen = false) => {
      setUserTogglesByLocation((prev) => {
        const currentToggles = prev[locationKey] ?? {};
        const isCurrentlyOpen = currentToggles[id] ?? fallbackOpen;

        return {
          ...prev,
          [locationKey]: {
            ...currentToggles,
            [id]: !isCurrentlyOpen,
          },
        };
      });
    },
    [locationKey],
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* redirect anyway */
    }
    router.push('/admin-login');
  }, [router]);

  return {
    isExpanded,
    setIsExpanded,
    isMobileOpen,
    setIsMobileOpen,
    isActive,
    isSubItemActive,
    isChildActive,
    isMenuOpen,
    toggleMenu,
    handleLogout,
  };
}

// ═══════════════════════════════════════════
// Hook: Convite corretor modal
// ═══════════════════════════════════════════

export function useSidebarConvite() {
  const [showConvite, setShowConvite] = useState(false);
  const [conviteEmail, setConviteEmail] = useState('');
  const [conviteLoading, setConviteLoading] = useState(false);
  const [conviteStatus, setConviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [conviteMsg, setConviteMsg] = useState('');

  const handleEnviarConvite = useCallback(async () => {
    if (!conviteEmail.trim()) return;
    setConviteLoading(true);
    setConviteStatus('idle');
    try {
      const res = await fetch('/api/corretor/convite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: conviteEmail.trim(), nomeConvidante: 'Humano Saúde' }),
      });
      const data = await res.json();
      if (data.success) {
        setConviteStatus('success');
        setConviteMsg('Convite enviado com sucesso!');
        setConviteEmail('');
        setTimeout(() => {
          setShowConvite(false);
          setConviteStatus('idle');
        }, 2500);
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
  }, [conviteEmail]);

  const closeConvite = useCallback(() => {
    setShowConvite(false);
    setConviteStatus('idle');
  }, []);

  return {
    showConvite,
    setShowConvite,
    conviteEmail,
    setConviteEmail,
    conviteLoading,
    conviteStatus,
    conviteMsg,
    handleEnviarConvite,
    closeConvite,
  };
}
