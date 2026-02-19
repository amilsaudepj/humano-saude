'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { PermissionKey, UserPermissions } from '@/lib/permissions';
import { hasPermission, SIDEBAR_PERMISSION_MAP, ROLE_TEMPLATES } from '@/lib/permissions';

interface PermissionsState {
  permissions: Partial<UserPermissions> | null;
  role: string | null;
  corretorId: string | null;
  loading: boolean;
  isAdmin: boolean;
}

const INITIAL_STATE: PermissionsState = {
  permissions: null,
  role: null,
  corretorId: null,
  loading: true,
  isAdmin: false,
};

// ─── Cache simples por contexto ───────────────────────────
let _cache: { state: PermissionsState; context: string; ts: number } | null = null;
const CACHE_TTL = 60_000;

function getCacheKey(): string {
  if (typeof window === 'undefined') return 'ssr';
  return window.location.pathname.startsWith('/dashboard/corretor') ? 'corretor' : 'admin';
}

// ─── Helpers privados ─────────────────────────────────────

function getCorretorPayloadFromCookie(): { email?: string; corretor_id?: string; role?: string } | null {
  if (typeof document === 'undefined') return null;
  try {
    const token = document.cookie
      .split('; ')
      .find((c) => c.startsWith('corretor_token='))
      ?.split('=')[1];
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      email: payload.email || undefined,
      corretor_id: payload.corretor_id || undefined,
      role: payload.role || undefined,
    };
  } catch {
    return null;
  }
}

// ─── Fetch de permissões (roda apenas no client) ──────────

async function fetchPermissions(): Promise<PermissionsState> {
  // Nunca roda no SSR
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return INITIAL_STATE;
  }

  try {
    const isAdminSession = document.cookie.includes('admin_session=');
    const isCorretorPanel = window.location.pathname.startsWith('/dashboard/corretor');
    const hasCorretorToken = document.cookie.includes('corretor_token=');

    // ─── ADMIN fora do painel corretor → bypass total ───
    if (isAdminSession && !isCorretorPanel) {
      return {
        permissions: null,
        role: 'administrador',
        corretorId: null,
        loading: false,
        isAdmin: true,
      };
    }

    // ─── Painel corretor OU sessão de corretor ───
    if (hasCorretorToken) {
      const payload = getCorretorPayloadFromCookie();
      const email = payload?.email;
      const id = payload?.corretor_id;
      const tokenRole = payload?.role ?? 'corretor';

      if (email || id) {
        const query = id
          ? supabase.from('corretores').select('id, role, permissions, grade_comissionamento').eq('id', id).single()
          : supabase.from('corretores').select('id, role, permissions, grade_comissionamento').eq('email', email!).single();

        const { data: corretor, error } = await query;

        if (error) {
          console.warn('[usePermissions] Query error:', error.message);
        }

        if (corretor) {
          const role = corretor.role ?? tokenRole;
          const dbPerms = corretor.permissions as Partial<UserPermissions> | null;
          const hasDbPerms = dbPerms && Object.keys(dbPerms).length > 0;
          const template = ROLE_TEMPLATES[role] ?? ROLE_TEMPLATES['corretor'];
          const permissions = hasDbPerms ? dbPerms : template;

          return {
            permissions,
            role,
            corretorId: corretor.id,
            loading: false,
            isAdmin: false,
          };
        }

        // Corretor não encontrado → usar template
        return {
          permissions: ROLE_TEMPLATES[tokenRole] ?? ROLE_TEMPLATES['corretor'],
          role: tokenRole,
          corretorId: id ?? null,
          loading: false,
          isAdmin: false,
        };
      }
    }

    // Sem token nenhum
    return { permissions: null, role: null, corretorId: null, loading: false, isAdmin: false };
  } catch (err) {
    console.error('[usePermissions] fetchPermissions error', err);
    return { permissions: null, role: null, corretorId: null, loading: false, isAdmin: false };
  }
}

// ═══════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function usePermissions() {
  const [state, setState] = useState<PermissionsState>(() => {
    // No client, verificar cache válido
    if (typeof window !== 'undefined') {
      const ctx = getCacheKey();
      if (_cache && _cache.context === ctx && Date.now() - _cache.ts < CACHE_TTL) {
        return _cache.state;
      }
    }
    return INITIAL_STATE;
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctx = getCacheKey();

    // Cache válido para este contexto? Já foi setado no useState init
    if (_cache && _cache.context === ctx && Date.now() - _cache.ts < CACHE_TTL && tick === 0) {
      return;
    }

    let cancelled = false;

    fetchPermissions().then((result) => {
      if (cancelled) return;
      _cache = { state: result, context: ctx, ts: Date.now() };
      setState(result);
    });

    return () => { cancelled = true; };
  }, [tick]);

  // Verificar uma permissão específica
  const can = useCallback(
    (key: PermissionKey): boolean => {
      if (state.isAdmin && state.permissions === null) return true;
      return hasPermission(state.permissions, key);
    },
    [state.isAdmin, state.permissions],
  );

  // Verificar se um item de sidebar é visível
  const canSeeSidebarItem = useCallback(
    (sidebarItemId: string): boolean => {
      if (state.isAdmin && state.permissions === null) return true;
      const permKey = SIDEBAR_PERMISSION_MAP[sidebarItemId];
      if (!permKey) return true;
      return can(permKey);
    },
    [can, state.isAdmin, state.permissions],
  );

  // Forçar refresh do cache
  const refresh = useCallback(() => {
    _cache = null;
    setTick((t) => t + 1);
  }, []);

  return useMemo(
    () => ({ ...state, can, canSeeSidebarItem, refresh }),
    [state, can, canSeeSidebarItem, refresh],
  );
}

/**
 * Hook simplificado para verificar uma única permissão.
 */
export function usePermission(key: PermissionKey): boolean {
  const { can, loading } = usePermissions();
  if (loading) return false;
  return can(key);
}

/**
 * Invalidar cache de permissões (chamado após admin salvar permissões).
 */
export function invalidatePermissionsCache() {
  _cache = null;
}
