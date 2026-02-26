'use client';

import { PF_TOKENS } from '../content/pfDesignTokens';

/**
 * Seção 2: mesmo fundo dourado do spacer (token único = mesma cor).
 * Transição justa para a 3ª seção.
 */
export default function HeroVideoSection() {
  return (
    <section
      className="relative min-h-[26vh] w-full overflow-visible py-4 sm:py-5"
      style={{ background: PF_TOKENS.heroVideoSectionBg }}
      aria-label="Rede credenciada"
    />
  );
}
