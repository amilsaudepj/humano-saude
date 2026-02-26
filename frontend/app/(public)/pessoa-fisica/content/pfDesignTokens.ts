/**
 * Tokens de ID visual da página Pessoa Física – tema claro (fundo branco)
 * Fonte: Design System Humano Saúde (design-system/DesignSystemContent + globals.css)
 *
 * Paleta oficial:
 * - Dourado principal #B8941F → CTAs, destaques, bordas
 * - Dourado tema #D4AF37 → ícones, links
 * - Gradiente dourado: #bf953f → #aa771c
 * - Fundo branco #FFFFFF, cinza claro #f9fafb
 * - Texto preto #000000 / #1a1a1a, cinza médio #646464
 * - Tipografia: Montserrat (principal)
 * - WhatsApp: #25D366 apenas em botões de contato explícito
 */

export const PF_TOKENS = {
  /** Fundo principal – branco */
  bg: '#FFFFFF',
  /** Fundo alternativo (Design System: cinza claro) */
  bgAlt: '#f9fafb',

  /** Texto principal em fundo claro */
  text: '#1a1a1a',
  /** Texto secundário (Design System: cinza médio) */
  textMuted: '#646464',
  /** Legendas */
  textCaption: 'rgba(0, 0, 0, 0.45)',

  /** CTA e destaques – Dourado principal (Design System) */
  primary: '#B8941F',
  /** Hover CTA (Design System: dourado tema) */
  primaryHover: '#C5A028',
  /** Bordas e glow dourado */
  primaryMuted: 'rgba(184, 148, 31, 0.25)',
  primarySoft: 'rgba(184, 148, 31, 0.12)',

  /** Gradiente dourado no texto (degrade claro → escuro) */
  gradientStart: '#bf953f',
  gradientEnd: '#aa771c',
  gradient: 'linear-gradient(90deg, #d4af37 0%, #bf953f 40%, #aa771c 100%)',

  /** Bordas em contexto claro */
  border: 'rgba(0, 0, 0, 0.08)',
  borderHover: 'rgba(0, 0, 0, 0.12)',

  /** Botão WhatsApp (Design System: verde apenas para contato) */
  whatsapp: '#25D366',
  whatsappHover: '#20BD5A',

  /** Glow/ambient em dourado */
  glow: 'rgba(184, 148, 31, 0.12)',
  glowStrong: 'rgba(184, 148, 31, 0.2)',

  /** Seção do vídeo (hero + seção 2) – cor sólida única para os dois blocos ficarem iguais */
  heroVideoSectionBg: '#efe2c8',
} as const;
