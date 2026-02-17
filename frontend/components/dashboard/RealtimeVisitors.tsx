'use client';

// =====================================================
// RealtimeVisitors — Badge de visitantes online
// Auto-refresh: 5 segundos
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';

interface RealtimeVisitorsProps {
  className?: string;
  showTopPage?: boolean;
}

export default function RealtimeVisitors({ className, showTopPage = true }: RealtimeVisitorsProps) {
  const [activeUsers, setActiveUsers] = useState(0);
  const [topPage, setTopPage] = useState<string>('');

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/realtime');
      const json = await res.json();
      if (json.success && json.data) {
        setActiveUsers(json.data.activeUsers ?? 0);
        if (json.data.pages && json.data.pages.length > 0) {
          setTopPage(json.data.pages[0].page || '');
        } else {
          setTopPage('');
        }
      } else {
        setActiveUsers(0);
        setTopPage('');
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    const refresh = () => { void fetchRealtime(); };
    const initial = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [fetchRealtime]);

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="relative flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0a0a0a] px-3 py-1.5">
        {/* Pulse animation */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>

        <Radio className="h-3.5 w-3.5 text-emerald-400" />

        <AnimatePresence mode="wait">
          <motion.span
            key={activeUsers}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="text-sm font-bold text-white"
          >
            {activeUsers}
          </motion.span>
        </AnimatePresence>

        <span className="text-[10px] text-gray-500">LIVE</span>
      </div>

      {showTopPage && topPage && (
        <span className="hidden text-[10px] text-gray-600 md:inline truncate max-w-[150px]">
          📄 {topPage}
        </span>
      )}
    </div>
  );
}
