'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import HeaderPF from './components/HeaderPF';
import HeroSection from './components/HeroSection';
import HeroVideoSection from './components/HeroVideoSection';
import TrustBar from '../components/TrustBar';
import WhatsAppFloat from '../components/WhatsAppFloat';

const SectionRede = dynamic(() => import('./components/SectionRede'), {
  loading: () => <section className="min-h-[40vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const StickyStatsReveal = dynamic(() => import('./components/StickyStatsReveal'), {
  loading: () => <div className="min-h-[100vh] bg-black" aria-hidden />,
});
const SectionOperadorasCarousel = dynamic(() => import('./components/SectionOperadorasCarousel'), {
  loading: () => <section className="min-h-[50vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const SectionPlanosCarousel = dynamic(() => import('./components/SectionPlanosCarousel'), {
  loading: () => <div className="min-h-[40vh]" style={{ background: '#0B1120' }} aria-hidden />,
});
const SectionVideoChecklist = dynamic(() => import('./components/SectionVideoChecklist'), {
  loading: () => <section className="min-h-[40vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const SectionCompare = dynamic(() => import('./components/SectionCompare'), {
  loading: () => <section className="min-h-[30vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const SectionFeatureHighlight = dynamic(() => import('./components/SectionFeatureHighlight'), {
  loading: () => <section className="min-h-[40vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const SectionStickyScroll = dynamic(() => import('./components/SectionStickyScroll'), {
  loading: () => <section className="min-h-[50vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const SectionDepoimentos = dynamic(() => import('./components/SectionDepoimentos'), {
  loading: () => <section className="min-h-[30vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const SectionFAQ = dynamic(() => import('./components/SectionFAQ'), {
  loading: () => <section className="min-h-[30vh]" style={{ background: '#FFFFFF' }} aria-hidden />,
});
const FooterPF = dynamic(() => import('./components/FooterPF'), {
  loading: () => <footer className="min-h-[20vh]" style={{ background: '#000' }} aria-hidden />,
});
export default function PessoaFisicaPage() {
  const heroVideoWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <HeaderPF />
      <main>
        <div ref={heroVideoWrapperRef} className="overflow-visible">
          <HeroSection scrollWrapperRef={heroVideoWrapperRef} />
          <HeroVideoSection />
        </div>
        <TrustBar />
        <SectionRede />
        <StickyStatsReveal />
        <SectionOperadorasCarousel />
        <SectionPlanosCarousel />
        <SectionVideoChecklist />
        <SectionCompare />
        <SectionFeatureHighlight />
        <SectionStickyScroll />
        <SectionDepoimentos />
        <SectionFAQ />
      </main>
      <FooterPF />
      <WhatsAppFloat />
    </>
  );
}
