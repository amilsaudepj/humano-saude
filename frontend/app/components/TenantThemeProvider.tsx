'use client';

import { useEffect } from 'react';
import { useTenant } from '@/hooks/use-tenant';
import { DEFAULT_TENANT } from '@/lib/types/tenant';

// ─── Utilitário: hex para RGB ──────────────────────────────
// Converte #D4AF37 em "212 175 55" para uso com Tailwind opacity
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`;
}

// ─── TenantThemeProvider ───────────────────────────────────
// Injeta variáveis CSS no elemento :root baseado no tenant
// do usuário logado. Funciona como uma "camada de pintura"
// por cima do tema base dourado da Humano Saúde.
//
// Variáveis expostas:
//   --tenant-primary       → ex: #1E40AF (Arcfy)
//   --tenant-primary-rgb   → ex: 30 64 175 (para Tailwind bg-[rgb(var(--...))])
//   --tenant-secondary     → ex: #0F172A
//   --tenant-accent        → ex: #3B82F6
//   --tenant-accent-rgb    → ex: 59 130 246
//   --tenant-logo          → url('...')  ou none
//
// Usage no Tailwind:
//   bg-[color:var(--tenant-primary)]
//   text-[color:var(--tenant-accent)]

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();

  useEffect(() => {
    const primary = tenant?.primary_color ?? DEFAULT_TENANT.primary_color;
    const secondary = tenant?.secondary_color ?? DEFAULT_TENANT.secondary_color;
    const accent = tenant?.accent_color ?? DEFAULT_TENANT.accent_color;

    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', primary);
    root.style.setProperty('--tenant-primary-rgb', hexToRgb(primary));
    root.style.setProperty('--tenant-secondary', secondary);
    root.style.setProperty('--tenant-secondary-rgb', hexToRgb(secondary));
    root.style.setProperty('--tenant-accent', accent);
    root.style.setProperty('--tenant-accent-rgb', hexToRgb(accent));
    root.style.setProperty(
      '--tenant-logo',
      tenant?.logo_url ? `url('${tenant.logo_url}')` : 'none'
    );
    root.style.setProperty('--tenant-name', `"${tenant?.name ?? 'Humano Saúde'}"`);
  }, [tenant]);

  return <>{children}</>;
}
