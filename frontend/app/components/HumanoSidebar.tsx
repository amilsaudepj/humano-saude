'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Gauge,
  FileText,
  Users,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  badge?: {
    text: string;
    color: 'red' | 'emerald' | 'blue';
  };
}

const menuItems: MenuItem[] = [
  {
    name: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    description: 'Métricas e relatórios',
    badge: {
      text: 'GA4',
      color: 'red',
    },
  },
  {
    name: 'Cockpit',
    icon: Gauge,
    href: '/dashboard/cockpit',
    description: 'Visão Geral de Leads',
  },
  {
    name: 'Cotações',
    icon: FileText,
    href: '/dashboard',
    description: 'Scanner de PDF',
  },
  {
    name: 'Gestão de Leads',
    icon: Users,
    href: '/dashboard/leads',
    description: 'CRM/Kanban',
  },
  {
    name: 'Meta Ads',
    icon: TrendingUp,
    href: '/dashboard/meta-ads',
    description: 'Automação de anúncios',
  },
  {
    name: 'Configurações',
    icon: Settings,
    href: '/dashboard/configuracoes',
    description: 'Ajustes do sistema',
  },
];

const badgeStyles = {
  red: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
};

interface HumanoSidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

export default function HumanoSidebar({ open = true, onToggle }: HumanoSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
        open ? 'w-64' : 'w-20',
        'bg-black/40 backdrop-blur-xl border-r border-white/5'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header com Logo */}
        <div className="flex h-20 items-center justify-between border-b border-white/5 px-4">
          {open ? (
            <div className="flex items-center gap-3">
              {/* Logo da Humano Saúde */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white font-sans">Humano Saúde</h1>
                <p className="text-xs text-gray-400 font-mono">Broker OS</p>
              </div>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
              title={open ? 'Recolher sidebar' : 'Expandir sidebar'}
            >
              {open ? (
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 group',
                      active
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                    title={!open ? item.name : undefined}
                  >
                    <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-emerald-400')} />
                    
                    {open && (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-sans truncate">{item.name}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-xs border font-mono px-1.5 py-0',
                                  badgeStyles[item.badge.color]
                                )}
                              >
                                {item.badge.text}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Indicator de item ativo */}
                    {active && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-l-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - User Info */}
        <div className="border-t border-white/5 p-4">
          {open ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold font-mono shadow-lg shadow-blue-500/20">
                HS
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate font-sans">Admin</p>
                <p className="text-xs text-gray-500 truncate">admin@humanosaude.com.br</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold font-mono shadow-lg shadow-blue-500/20">
                HS
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
