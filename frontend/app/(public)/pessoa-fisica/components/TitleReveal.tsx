'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const SPRING = { type: 'spring' as const, damping: 24, stiffness: 200 };

/**
 * ClonewebX: reveal de título ao scroll (estilo SplitText + ScrollTrigger).
 * clipPath inset(100% 0 0 0) → inset(0) + y 30 → 0 quando a seção entra.
 */
export default function TitleReveal({
  children,
  className = '',
  as: Tag = 'h2',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        initial={{ y: 30, clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={
          inView
            ? { y: 0, clipPath: 'inset(0% 0% 0% 0%)' }
            : { y: 30, clipPath: 'inset(100% 0% 0% 0%)' }
        }
        transition={{ ...SPRING, duration: 0.7 }}
      >
        {Tag === 'h1' && <h1 className={className} style={style}>{children}</h1>}
        {Tag === 'h2' && <h2 className={className} style={style}>{children}</h2>}
        {Tag === 'h3' && <h3 className={className} style={style}>{children}</h3>}
      </motion.div>
    </div>
  );
}
