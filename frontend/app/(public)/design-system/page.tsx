import type { Metadata } from 'next';
import DesignSystemGate from './DesignSystemGate';

export const metadata: Metadata = {
  title: 'Design System | Identidade Visual Humano Saúde',
  description:
    'Guia de identidade visual: cores, tipografia, logos e materiais para divulgação. Use como referência em peças e canais.',
  robots: { index: false, follow: true },
};

export default function DesignSystemPage() {
  return <DesignSystemGate />;
}
