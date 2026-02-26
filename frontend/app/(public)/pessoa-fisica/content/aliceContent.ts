import rawJson from './alice.copy.raw.json';
import safeJson from './alice.copy.safe.json';

// ── Types ──

export interface HeaderContent {
  navItems: string[];
  ctaLabel: string;
}

export interface HeroContent {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta?: string;
  trustLine?: string;
}

export interface PlanCard {
  title: string;
  description?: string;
  bullets?: string[];
}

export interface PlansContent {
  title: string;
  subtitle?: string;
  cards: PlanCard[];
}

export interface BenefitItem {
  title: string;
  description: string;
}

export interface BenefitsContent {
  title: string;
  subtitle?: string;
  items: BenefitItem[];
}

export interface FooterContent {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  disclaimer?: string;
}

export interface PageContent {
  header: HeaderContent;
  hero: HeroContent;
  plans: PlansContent;
  benefits: BenefitsContent;
  footer: FooterContent;
}

// ── Exports ──

export const aliceRaw = rawJson;
export const aliceSafe = safeJson;

export const aliceContent: PageContent = {
  header: safeJson.header,
  hero: safeJson.hero,
  plans: safeJson.plans,
  benefits: safeJson.benefits,
  footer: safeJson.footer,
};
