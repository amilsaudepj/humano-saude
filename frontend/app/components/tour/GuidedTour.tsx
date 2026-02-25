'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { HelpCircle, ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

type TourRole = 'admin' | 'corretor';
type TourPlacement = 'auto' | 'top' | 'bottom' | 'left' | 'right';
type ResolvedPlacement = Exclude<TourPlacement, 'auto'>;

type TourStep = {
  id: string;
  title: string;
  description: string;
  selector?: string;
  placement?: TourPlacement;
};

type GuidedTourProps = {
  role: TourRole;
  triggerMode?: 'floating' | 'inline';
  triggerClassName?: string;
};

const TOUR_VERSION = 'v3';

// Fallback to localStorage keys for instant read, but DB is source of truth
function getStorageKeys(role: TourRole) {
  return {
    hide: `guided-tour:${role}:${TOUR_VERSION}:hide`,
    completed: `guided-tour:${role}:${TOUR_VERSION}:completed`,
  };
}

// Load tour preferences from DB (with localStorage fallback for speed)
async function loadTourPrefs(role: TourRole): Promise<{ hide: boolean; completed: boolean }> {
  try {
    const res = await fetch(`/api/tour-preferences?role=${role}&version=${TOUR_VERSION}`);
    if (res.ok) {
      const data = await res.json();
      // Sync to localStorage for fast startup
      const keys = getStorageKeys(role);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(keys.hide, data.hide ? '1' : '0');
        window.localStorage.setItem(keys.completed, data.completed ? '1' : '0');
      }
      return { hide: !!data.hide, completed: !!data.completed };
    }
  } catch {
    // Fallback to localStorage
  }
  const keys = getStorageKeys(role);
  if (typeof window !== 'undefined') {
    return {
      hide: window.localStorage.getItem(keys.hide) === '1',
      completed: window.localStorage.getItem(keys.completed) === '1',
    };
  }
  return { hide: false, completed: false };
}

// Save tour preferences to DB + localStorage
async function saveTourPrefs(role: TourRole, prefs: { hide?: boolean; completed?: boolean }) {
  // Save to localStorage immediately for instant local reads
  const keys = getStorageKeys(role);
  if (typeof window !== 'undefined') {
    if (prefs.hide !== undefined) window.localStorage.setItem(keys.hide, prefs.hide ? '1' : '0');
    if (prefs.completed !== undefined) window.localStorage.setItem(keys.completed, prefs.completed ? '1' : '0');
  }
  // Persist to DB
  try {
    await fetch('/api/tour-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, version: TOUR_VERSION, ...prefs }),
    });
  } catch {
    // DB save failed, localStorage still works
  }
}

function getStepsForRoute(role: TourRole, pathname: string): TourStep[] {
  if (role === 'admin') {
    if (pathname === '/portal-interno-hks-2026') {
      return [
        {
          id: 'admin-sidebar',
          title: 'DockSidebar',
          description: 'Este menu centraliza os módulos para navegar rapidamente no painel.',
          selector: '[data-tour="admin-docksidebar"]',
          placement: 'right',
        },
        {
          id: 'admin-filters',
          title: 'Filtros de período',
          description: 'Troque entre hoje, ontem e janelas maiores para ler a operação.',
          selector: '[data-tour="admin-period-filters"]',
          placement: 'bottom',
        },
        {
          id: 'admin-kpis',
          title: 'Métricas principais',
          description: 'Resumo rápido de leads, propostas, vendas, documentos e fechamento.',
          selector: '[data-tour="admin-kpis"]',
          placement: 'bottom',
        },
        {
          id: 'admin-radar',
          title: 'Radar estratégico',
          description: 'Priorize sem contato, estagnação e potencial financeiro em aberto.',
          selector: '[data-tour="admin-radar"]',
          placement: 'bottom',
        },
        {
          id: 'admin-scanner',
          title: 'Scanner Inteligente',
          description: 'Inicie a proposta com upload e extração inteligente dos documentos.',
          selector: '[data-tour="admin-scanner"]',
          placement: 'auto',
        },
        {
          id: 'admin-last-extraction',
          title: 'Última extração da IA',
          description: 'Aqui você revisa o último CNPJ, razão social e demais dados extraídos pelo scanner.',
          selector: '[data-tour="admin-last-extraction"]',
          placement: 'left',
        },
        {
          id: 'admin-manual',
          title: 'Proposta manual',
          description: 'Quando necessário, monte a proposta manualmente com anexos por etapa.',
          selector: '[data-tour="admin-proposta-manual"]',
          placement: 'left',
        },
      ];
    }

    return [];
  }

  if (role === 'corretor') {
    if (pathname === '/dashboard/corretor') {
      return [
        {
          id: 'corretor-sidebar',
          title: 'DockSidebar',
          description: 'Use este menu para navegar entre propostas, CRM e demais módulos.',
          selector: '[data-tour="corretor-docksidebar"]',
          placement: 'right',
        },
        {
          id: 'corretor-overview',
          title: 'Visão geral',
          description: 'Este quadro mostra seus indicadores e atividades prioritárias.',
          selector: '[data-tour="corretor-overview"]',
          placement: 'bottom',
        },
      ];
    }

    return [];
  }

  return [];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function rectanglesOverlap(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function overlapArea(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): number {
  const overlapWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return overlapWidth * overlapHeight;
}

export default function GuidedTour({
  role,
  triggerMode = 'floating',
  triggerClassName,
}: GuidedTourProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isBrowser = typeof window !== 'undefined';
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const trackedElementRef = useRef<Element | null>(null);
  const steps = useMemo(() => getStepsForRoute(role, pathname), [pathname, role]);
  const currentStep = steps[stepIndex] || null;

  useEffect(() => {
    if (!isBrowser) return;
    const searchParams = new URLSearchParams(window.location.search);
    const forceTourParam = searchParams.get('tour');
    const shouldForceOpen = forceTourParam === '1' || forceTourParam === 'true';
    if (!shouldForceOpen || steps.length === 0) return;

    setDontShowAgain(false);
    setStepIndex(0);
    setOpen(true);

    searchParams.delete('tour');
    const query = searchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [isBrowser, pathname, router, steps.length]);

  // Load tour preferences from DB on mount / route change
  useEffect(() => {
    if (steps.length === 0) {
      setOpen(false);
      setStepIndex(0);
      return;
    }

    let cancelled = false;

    const checkPrefs = async () => {
      const prefs = await loadTourPrefs(role);
      if (cancelled) return;
      if (!prefs.hide && !prefs.completed) {
        setOpen(true);
      }
    };

    const timeoutId = window.setTimeout(() => {
      checkPrefs();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pathname, role, steps.length]);

  useEffect(() => {
    if (!open) return;
    if (stepIndex < steps.length) return;
    const timeoutId = window.setTimeout(() => {
      setStepIndex(0);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, stepIndex, steps.length]);

  useEffect(() => {
    if (!isBrowser || !open || role !== 'admin') return;

    const previousHtmlOverflow = window.document.documentElement.style.overflow;
    const previousBodyOverflow = window.document.body.style.overflow;
    const previousBodyTouchAction = window.document.body.style.touchAction;

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };

    const preventScrollKeys = (event: KeyboardEvent) => {
      const blockedKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (blockedKeys.includes(event.key)) {
        event.preventDefault();
      }
    };

    window.document.documentElement.style.overflow = 'hidden';
    window.document.body.style.overflow = 'hidden';
    window.document.body.style.touchAction = 'none';
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventScrollKeys, { passive: false });

    return () => {
      window.document.documentElement.style.overflow = previousHtmlOverflow;
      window.document.body.style.overflow = previousBodyOverflow;
      window.document.body.style.touchAction = previousBodyTouchAction;
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventScrollKeys);
    };
  }, [isBrowser, open, role]);

  useEffect(() => {
    const clearRectAsync = () => {
      window.setTimeout(() => {
        setTargetRect(null);
      }, 0);
    };

    if (!isBrowser || !open || !currentStep?.selector) {
      trackedElementRef.current = null;
      clearRectAsync();
      return;
    }

    const element = window.document.querySelector(currentStep.selector);
    trackedElementRef.current = element;
    if (!element) {
      clearRectAsync();
      return;
    }

    let rafId = 0;
    const updatePosition = () => {
      if (!trackedElementRef.current) {
        setTargetRect(null);
        return;
      }

      const nextRect = trackedElementRef.current.getBoundingClientRect();
      setTargetRect((prev) => {
        if (
          prev &&
          Math.abs(prev.left - nextRect.left) < 0.5 &&
          Math.abs(prev.top - nextRect.top) < 0.5 &&
          Math.abs(prev.width - nextRect.width) < 0.5 &&
          Math.abs(prev.height - nextRect.height) < 0.5
        ) {
          return prev;
        }

        return nextRect;
      });
    };

    const scheduleUpdate = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(updatePosition);
    };

    const initialRect = element.getBoundingClientRect();
    const outOfViewport =
      initialRect.bottom < 0 ||
      initialRect.top > window.innerHeight ||
      initialRect.right < 0 ||
      initialRect.left > window.innerWidth;

    if (outOfViewport) {
      (element as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, true);
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [currentStep?.selector, isBrowser, open, stepIndex]);

  const tooltipStyle = useMemo(() => {
    if (!isBrowser) {
      return {
        left: 12,
        top: 12,
        maxWidth: 360,
      };
    }

    const width = 360;
    const maxWidth = Math.min(window.innerWidth - 24, width);
    const estimatedHeight = 260;
    const gap = 14;
    const viewportPadding = 12;

    if (!targetRect || !currentStep) {
      return {
        left: clamp((window.innerWidth - maxWidth) / 2, viewportPadding, window.innerWidth - maxWidth - viewportPadding),
        top: clamp((window.innerHeight - estimatedHeight) / 2, viewportPadding, window.innerHeight - estimatedHeight - viewportPadding),
        maxWidth,
      };
    }

    const targetSafeArea = {
      left: Math.max(0, targetRect.left - 12),
      top: Math.max(0, targetRect.top - 12),
      right: Math.min(window.innerWidth, targetRect.right + 12),
      bottom: Math.min(window.innerHeight, targetRect.bottom + 12),
    };

    const availableSpace: Record<ResolvedPlacement, number> = {
      right: window.innerWidth - targetRect.right - gap - viewportPadding,
      left: targetRect.left - gap - viewportPadding,
      top: targetRect.top - gap - viewportPadding,
      bottom: window.innerHeight - targetRect.bottom - gap - viewportPadding,
    };

    const sortedBySpace = (['right', 'left', 'bottom', 'top'] as ResolvedPlacement[]).sort(
      (a, b) => availableSpace[b] - availableSpace[a],
    );

    const placement = currentStep.placement || 'auto';
    const preferredOrder =
      placement === 'auto'
        ? sortedBySpace
        : [placement as ResolvedPlacement, ...sortedBySpace.filter((p) => p !== placement)];

    const createCandidate = (resolvedPlacement: ResolvedPlacement) => {
      let left = 0;
      let top = 0;

      if (resolvedPlacement === 'right') {
        left = targetRect.right + gap;
        top = targetRect.top + (targetRect.height - estimatedHeight) / 2;
      } else if (resolvedPlacement === 'left') {
        left = targetRect.left - maxWidth - gap;
        top = targetRect.top + (targetRect.height - estimatedHeight) / 2;
      } else if (resolvedPlacement === 'top') {
        left = targetRect.left + (targetRect.width - maxWidth) / 2;
        top = targetRect.top - estimatedHeight - gap;
      } else {
        left = targetRect.left + (targetRect.width - maxWidth) / 2;
        top = targetRect.bottom + gap;
      }

      left = clamp(left, viewportPadding, window.innerWidth - maxWidth - viewportPadding);
      top = clamp(top, viewportPadding, window.innerHeight - estimatedHeight - viewportPadding);

      const rect = {
        left,
        top,
        right: left + maxWidth,
        bottom: top + estimatedHeight,
      };

      return { left, top, rect };
    };

    const candidates = preferredOrder.map(createCandidate);
    const nonOverlappingCandidate = candidates.find((candidate) => !rectanglesOverlap(candidate.rect, targetSafeArea));

    if (nonOverlappingCandidate) {
      return {
        left: nonOverlappingCandidate.left,
        top: nonOverlappingCandidate.top,
        maxWidth,
      };
    }

    const bestCandidate = candidates.reduce((best, candidate) => {
      if (!best) return candidate;
      const currentOverlap = overlapArea(candidate.rect, targetSafeArea);
      const bestOverlap = overlapArea(best.rect, targetSafeArea);
      return currentOverlap < bestOverlap ? candidate : best;
    }, candidates[0]);

    return {
      left: bestCandidate.left,
      top: bestCandidate.top,
      maxWidth,
    };
  }, [currentStep, isBrowser, targetRect]);

  const overlayPanels = useMemo(() => {
    if (!isBrowser || !open) return [];

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!targetRect) {
      return [
        {
          left: 0,
          top: 0,
          width: viewportWidth,
          height: viewportHeight,
        },
      ];
    }

    const padding = 8;
    const left = clamp(targetRect.left - padding, 0, viewportWidth);
    const top = clamp(targetRect.top - padding, 0, viewportHeight);
    const right = clamp(targetRect.right + padding, 0, viewportWidth);
    const bottom = clamp(targetRect.bottom + padding, 0, viewportHeight);

    const panels = [
      { left: 0, top: 0, width: viewportWidth, height: top },
      { left: 0, top, width: left, height: Math.max(bottom - top, 0) },
      { left: right, top, width: Math.max(viewportWidth - right, 0), height: Math.max(bottom - top, 0) },
      { left: 0, top: bottom, width: viewportWidth, height: Math.max(viewportHeight - bottom, 0) },
    ];

    return panels.filter((panel) => panel.width > 0 && panel.height > 0);
  }, [isBrowser, open, targetRect]);

  const handleClose = (completed = false) => {
    // Save to DB + localStorage
    if (dontShowAgain) {
      saveTourPrefs(role, { hide: true });
    }
    if (completed) {
      saveTourPrefs(role, { completed: true });
    }
    setOpen(false);
  };

  const handleManualOpen = () => {
    setDontShowAgain(false);
    setStepIndex(0);
    setOpen(true);
  };

  const triggerButtonClassName =
    triggerMode === 'inline'
      ? `flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#0a0a0a]/90 px-3 py-2 text-xs font-semibold text-[#D4AF37] shadow-md shadow-black/40 backdrop-blur ${
          triggerClassName || ''
        }`
      : `fixed top-5 right-5 z-[109] hidden md:flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#0a0a0a]/95 px-4 py-2 text-xs font-semibold text-[#D4AF37] shadow-lg shadow-black/40 backdrop-blur ${
          triggerClassName || ''
        }`;

  const TriggerButton = (
    <button
      type="button"
      onClick={handleManualOpen}
      className={triggerButtonClassName}
      aria-label="Abrir tour"
    >
      <HelpCircle className="h-4 w-4" />
      <span className={triggerMode === 'inline' ? 'hidden sm:inline' : ''}>Abrir tour</span>
    </button>
  );

  if (steps.length === 0) {
    return TriggerButton;
  }

  const overlayContent =
    open && currentStep ? (
      <>
        {overlayPanels.map((panel, index) => (
          <div
            key={`tour-overlay-${index}`}
            className="fixed z-[110] bg-black/55 backdrop-blur-[3px]"
            style={{
              left: panel.left,
              top: panel.top,
              width: panel.width,
              height: panel.height,
            }}
          />
        ))}

        {targetRect && (
          <div
            className="pointer-events-none fixed z-[111] rounded-xl border-2 border-[#D4AF37] shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_0_28px_rgba(212,175,55,0.25)]"
            style={{
              left: Math.max(0, targetRect.left - 6),
              top: Math.max(0, targetRect.top - 6),
              width: Math.max(0, targetRect.width + 12),
              height: Math.max(0, targetRect.height + 12),
            }}
          />
        )}

        <div
          className="fixed z-[112] w-full rounded-xl border border-white/15 bg-[#0a0a0a] p-4 text-white shadow-2xl"
          style={{
            left: tooltipStyle.left,
            top: tooltipStyle.top,
            maxWidth: tooltipStyle.maxWidth,
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/45">
                Etapa {stepIndex + 1} de {steps.length}
              </p>
              <h3 className="text-sm font-semibold text-white">{currentStep.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mb-4 text-sm text-white/80">{currentStep.description}</p>

          <label className="mb-4 flex items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-white/30 bg-black/50 accent-[#D4AF37]"
            />
            Não exibir novamente automaticamente
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                onClick={() => handleClose(false)}
              >
                Pular
              </Button>

              {stepIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  className="bg-[#D4AF37] text-black hover:bg-[#E8C25B]"
                  onClick={() => setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))}
                >
                  Próximo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="bg-[#D4AF37] text-black hover:bg-[#E8C25B]"
                  onClick={() => handleClose(true)}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Concluir tour
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    ) : null;

  return (
    <>
      {TriggerButton}
      {isBrowser && overlayContent ? createPortal(overlayContent, window.document.body) : null}
    </>
  );
}
