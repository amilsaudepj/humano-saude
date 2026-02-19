'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas-pro';
import {
  Palette, Download, Loader2, CheckCircle, AlertTriangle,
  RotateCcw, RectangleVertical, Square, Phone, User,
  Sparkles, Plus, Trash2, Wand2, Info, Clock, Heart,
  TrendingUp, AlertCircle, Target, Flame, Search, Building2,
  Stethoscope, Shield, MapPin, RefreshCw, Eye, Upload,
  Send, Undo2, MessageSquare, Paperclip, X, Lightbulb,
} from 'lucide-react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ═══════════ TYPES ═══════════ */
interface FaixaPreco { faixa: string; valor: string }
type Status = 'editing' | 'generating' | 'success' | 'error';
type Ratio = '4:5' | '9:16';
type Modalidade = 'PME' | 'PF' | 'Adesão';
type Template = 'tabela' | 'preco' | 'hospitais';
type Acomodacao = 'Enfermaria' | 'Apartamento' | '';
type Abrangencia = 'Nacional' | 'Estadual' | 'Municipal' | '';

interface AnguloConfig {
  id: string; nome: string; icone: string; cor: string;
  headline: string; sub: string; badge: string; descricao: string;
}
interface BgImg { id?: string; nome: string; url: string; thumb?: string }
interface OpCfg { id: string; nome: string; logo: string; corPrimaria: string; corSecundaria: string; corAccent: string; hospitais: string[]; redeRegional?: Record<string, string[]> }

/* ═══════════ ÂNGULOS META ANDROMEDA ═══════════ */
const ANGULOS: AnguloConfig[] = [
  { id: 'reajuste', nome: 'Dor do Reajuste', icone: 'flame', cor: '#EF4444', headline: 'SEU PLANO REAJUSTOU?', sub: 'Troque agora e economize até 40%', badge: 'REAJUSTE 2026', descricao: 'Ataca a dor do reajuste anual' },
  { id: 'economia', nome: 'Economia Real', icone: 'trending', cor: '#22C55E', headline: 'ECONOMIZE ATÉ R$500/MÊS', sub: 'Compare e descubra o melhor custo-benefício', badge: 'ECONOMIA REAL', descricao: 'Foco em valor e economia' },
  { id: 'urgencia', nome: 'Urgência/Escassez', icone: 'clock', cor: '#F59E0B', headline: 'CONDIÇÃO ESPECIAL POR TEMPO LIMITADO', sub: 'Valor promocional válido somente esta semana', badge: 'SÓ ESTA SEMANA', descricao: 'Cria urgência e deadline' },
  { id: 'familia', nome: 'Proteção Familiar', icone: 'heart', cor: '#EC4899', headline: 'PROTEJA QUEM VOCÊ AMA', sub: 'O melhor plano para sua família', badge: 'PROTEÇÃO TOTAL', descricao: 'Emocional, família, filhos' },
  { id: 'autoridade', nome: 'Autoridade/Social', icone: 'target', cor: '#8B5CF6', headline: '+10.000 FAMÍLIAS JÁ ESCOLHERAM', sub: 'A operadora mais bem avaliada do RJ', badge: 'MAIS ESCOLHIDO', descricao: 'Prova social e credibilidade' },
  { id: 'oportunidade', nome: 'Oportunidade Única', icone: 'alert', cor: '#3B82F6', headline: 'PREÇO PROMOCIONAL', sub: 'Garanta agora antes do próximo reajuste', badge: 'OPORTUNIDADE', descricao: 'Oportunidade que não volta' },
  { id: 'rede', nome: 'Rede Premium', icone: 'hospital', cor: '#06B6D4', headline: 'QUER TER ACESSO A ESSA REDE?', sub: 'Os melhores hospitais e laboratórios do RJ', badge: 'REDE PREMIUM', descricao: 'Vende pela rede hospitalar/labs' },
];

/* ═══════════ IMAGENS UNSPLASH ═══════════ */
const u = (id: string) => ({ url: `https://images.unsplash.com/photo-${id}?w=1080&q=80`, thumb: `https://images.unsplash.com/photo-${id}?w=120&q=50` });
const BG_IMAGES: Record<string, BgImg[]> = {
  hospital: [
    { id: 'h1', nome: 'Hospital Moderno', ...u('1519494026892-80bbd2d6fd0d') },
    { id: 'h2', nome: 'Recepção', ...u('1586773860418-d37222d8fce3') },
    { id: 'h3', nome: 'Clínica', ...u('1551190822-a9333d879b1f') },
    { id: 'h4', nome: 'Corredor', ...u('1538108149393-fbbd81895907') },
    { id: 'h5', nome: 'Quarto', ...u('1516549655169-df83a0774514') },
    { id: 'h6', nome: 'Fachada', ...u('1587351021759-3e566ab3e36d') },
  ],
  família: [
    { id: 'f1', nome: 'Família Feliz', ...u('1609220136736-443140cffec6') },
    { id: 'f2', nome: 'Pais e Filhos', ...u('1511895426328-dc8714191300') },
    { id: 'f3', nome: 'Parque', ...u('1475503572774-15a45e5d60b9') },
    { id: 'f4', nome: 'Abraço', ...u('1606107557195-0e29a4b5b4aa') },
    { id: 'f5', nome: 'Caminhada', ...u('1581579438747-104c53d7fbc4') },
    { id: 'f6', nome: 'Brincadeira', ...u('1536640712-4d4c36ff0e4e') },
  ],
  médico: [
    { id: 'm1', nome: 'Médico', ...u('1612349317150-e413f6a5b16d') },
    { id: 'm2', nome: 'Consulta', ...u('1631217868264-e5b90bb7e133') },
    { id: 'm3', nome: 'Equipe', ...u('1582750433449-648ed127bb54') },
    { id: 'm4', nome: 'Estetoscópio', ...u('1584982751601-97dcc096659c') },
    { id: 'm5', nome: 'Sorriso', ...u('1559757148-5c350d0d3c56') },
    { id: 'm6', nome: 'Pediatra', ...u('1581594693702-fbdc51b2763b') },
  ],
  cidade: [
    { id: 'c1', nome: 'Cristo Redentor', ...u('1483729558449-99ef09a8c325') },
    { id: 'c2', nome: 'Copacabana', ...u('1544989164-31dc3291c7e1') },
    { id: 'c3', nome: 'Panorâmica', ...u('1516306580123-e6e52b1b7b5f') },
    { id: 'c4', nome: 'Ipanema', ...u('1518639192441-8fce0a366e2e') },
    { id: 'c5', nome: 'Pão de Açúcar', ...u('1564659907532-6b163e294e7c') },
    { id: 'c6', nome: 'Aterro', ...u('1551524559-8af4e6624178') },
  ],
  saúde: [
    { id: 's1', nome: 'Estetoscópio', ...u('1505751172876-fa1923c5c528') },
    { id: 's2', nome: 'Bem-estar', ...u('1571019613454-1cb2f99b2d8b') },
    { id: 's3', nome: 'Natureza', ...u('1506126613408-eca07ce68773') },
    { id: 's4', nome: 'Corrida', ...u('1571019614242-c5c5dee9f50c') },
    { id: 's5', nome: 'Yoga', ...u('1544367567-0f2fcb009e0b') },
    { id: 's6', nome: 'Meditação', ...u('1545389336-cf090694435e') },
  ],
  'hospitais reais': [
    { id: 'hr1', nome: 'Hospital Badim', url: '/images/hospitais/hospital badim.jpg', thumb: '/images/hospitais/hospital badim.jpg' },
    { id: 'hr2', nome: 'Barra D\'Or', url: '/images/hospitais/hospital barra dor .jpg', thumb: '/images/hospitais/hospital barra dor .jpg' },
    { id: 'hr3', nome: 'Copa D\'Or', url: '/images/hospitais/hospital copa dor.jpg', thumb: '/images/hospitais/hospital copa dor.jpg' },
    { id: 'hr4', nome: 'Samaritano Barra', url: '/images/hospitais/hospital samaritano barra.jpg', thumb: '/images/hospitais/hospital samaritano barra.jpg' },
    { id: 'hr5', nome: 'Hospital Vitória', url: '/images/hospitais/hospital vitoria barra.jpg', thumb: '/images/hospitais/hospital vitoria barra.jpg' },
    { id: 'hr6', nome: 'Pró-Cardíaco', url: '/images/hospitais/hospital pro cardiaco.png', thumb: '/images/hospitais/hospital pro cardiaco.png' },
    { id: 'hr7', nome: 'Quinta D\'Or', url: '/images/hospitais/hospital quinta dor.jpg', thumb: '/images/hospitais/hospital quinta dor.jpg' },
    { id: 'hr8', nome: 'São Vicente Gávea', url: '/images/hospitais/hospital sao vicente gavea.jpg', thumb: '/images/hospitais/hospital sao vicente gavea.jpg' },
    { id: 'hr9', nome: 'Casa de Saúde São José', url: '/images/hospitais/hospital casa de saude sao jose.webp', thumb: '/images/hospitais/hospital casa de saude sao jose.webp' },
    { id: 'hr10', nome: 'Hospital Jutta Batista', url: '/images/hospitais/hospital jutta batista.webp', thumb: '/images/hospitais/hospital jutta batista.webp' },
    { id: 'hr11', nome: 'Hospital Norte D\'Or', url: '/images/hospitais/hospital norte dor.jpg', thumb: '/images/hospitais/hospital norte dor.jpg' },
    { id: 'hr12', nome: 'Hospital Pasteur', url: '/images/hospitais/hospital pasteur.jpg', thumb: '/images/hospitais/hospital pasteur.jpg' },
    { id: 'hr13', nome: 'CHN Niterói', url: '/images/hospitais/hospital CHN.webp', thumb: '/images/hospitais/hospital CHN.webp' },
  ],
};

/* ═══════════ OPERADORAS ═══════════ */
const OPERADORAS: OpCfg[] = [
  { id: 'amil', nome: 'Amil', logo: '/images/operadoras/amil-logo.png', corPrimaria: '#2D0A7A', corSecundaria: '#5B2FD6', corAccent: '#FFD700',
    hospitais: ['Copa D\'Or','Quinta D\'Or','Barra D\'Or','Norte D\'Or','Clínica São Vicente'],
    redeRegional: {
      'zona-sul': ['Copa D\'Or', 'Clínica São Vicente', 'Casa de Saúde São José'],
      'zona-norte': ['Quinta D\'Or', 'Norte D\'Or'],
      'zona-oeste': ['Barra D\'Or'],
      'centro': ['Copa D\'Or'],
      'baixada': ['Caxias D\'Or'],
      'niteroi': ['Niterói D\'Or'],
    },
  },
  { id: 'sulamerica', nome: 'SulAmérica', logo: '/images/operadoras/sulamerica-logo.png', corPrimaria: '#FF6600', corSecundaria: '#E55800', corAccent: '#003399',
    hospitais: ['Copa D\'Or','Samaritano','Barra D\'Or','Quinta D\'Or'],
    redeRegional: {
      'zona-sul': ['Hospital Adventista Silvestre', 'Hospital Rio Laranjeiras', 'Casa de Saúde Pinheiro Machado'],
      'zona-norte': ['Copa D\'Or', 'Quinta D\'Or'],
      'zona-oeste': ['Clínicas Jacarepaguá', 'Cemeru'],
      'centro': ['Hospital Adventista Silvestre'],
      'baixada': ['Caxias D\'Or'],
      'niteroi': ['Niterói D\'Or'],
    },
  },
  { id: 'bradesco', nome: 'Bradesco Saúde', logo: '/images/operadoras/bradesco-logo.png', corPrimaria: '#CC092F', corSecundaria: '#A00724', corAccent: '#FFFFFF',
    hospitais: ['Copa D\'Or','Samaritano','Barra D\'Or','Quinta D\'Or','Norte D\'Or'],
    redeRegional: {
      'zona-sul': ['Perinatal Laranjeiras', 'Copa D\'Or', 'Samaritano Botafogo'],
      'zona-norte': ['Norte D\'Or', 'Quinta D\'Or'],
      'zona-oeste': ['Barra D\'Or', 'Oeste D\'Or', 'Rios D\'Or', 'Real D\'Or', 'Hospital Bangu', 'Perinatal Barra'],
      'centro': ['Copa D\'Or'],
      'baixada': ['Caxias D\'Or'],
      'niteroi': ['Niterói D\'Or', 'Hospital Icaraí'],
    },
  },
  { id: 'porto', nome: 'Porto Saúde', logo: '/images/operadoras/portosaude-logo.png', corPrimaria: '#0066CC', corSecundaria: '#004FA3', corAccent: '#4DA6FF',
    hospitais: ['Copa Star','Pró-Cardíaco','Samaritano Barra','Barra D\'Or','Quinta D\'Or'],
    redeRegional: {
      'zona-sul': ['Copa Star', 'Copa D\'Or', 'Pró-Cardíaco'],
      'zona-norte': ['Quinta D\'Or'],
      'zona-oeste': ['Samaritano Barra', 'Barra D\'Or'],
      'centro': ['Copa D\'Or'],
      'baixada': ['Caxias D\'Or'],
      'niteroi': ['Niterói D\'Or'],
    },
  },
  { id: 'assim', nome: 'Assim Saúde', logo: '/images/operadoras/assimsaude-logo.png', corPrimaria: '#0072BC', corSecundaria: '#005A96', corAccent: '#00A3E0',
    hospitais: ['Hospital Badim','Hospital Pasteur','Norte D\'Or'],
    redeRegional: {
      'zona-sul': ['Clínica Cirúrgica Santa Bárbara'],
      'zona-norte': ['Casa de Saúde Grajaú', 'Casa de Saúde São Bento', 'Hospital de Irajá'],
      'zona-oeste': ['Memorial Campo Grande', 'Barra Day'],
      'centro': ['Casa de Saúde São Bento'],
      'baixada': ['Hospital de Irajá'],
      'niteroi': ['Casa de Saúde Grajaú'],
    },
  },
  { id: 'levesaude', nome: 'Leve Saúde', logo: '/images/operadoras/levesaude-logo.png', corPrimaria: '#7B2D8E', corSecundaria: '#5C1F6B', corAccent: '#A855F7',
    hospitais: ['Clínica Leve Saúde','Hospital Badim','Norte D\'Or'],
    redeRegional: {
      'zona-sul': ['Clínica Leve Saúde Botafogo'],
      'zona-norte': ['Clínica Leve Saúde Tijuca'],
      'zona-oeste': ['Clínica Leve Saúde Barra'],
      'centro': ['Clínica Leve Saúde Centro'],
      'baixada': ['Clínica Leve Saúde Caxias'],
      'niteroi': ['Clínica Leve Saúde Niterói'],
    },
  },
  { id: 'unimed', nome: 'Unimed', logo: '/images/operadoras/unimed-logo.png', corPrimaria: '#00995D', corSecundaria: '#006B3F', corAccent: '#4CAF50',
    hospitais: ['Hospital Unimed-Rio','Copa D\'Or','Barra D\'Or'],
    redeRegional: {
      'zona-sul': ['Hospital Unimed-Rio', 'Rede Referenciada'],
      'zona-norte': ['Hospital Unimed-Rio', 'Rede Referenciada'],
      'zona-oeste': ['Hospital Unimed-Rio', 'Rede Referenciada'],
      'centro': ['Hospital Unimed-Rio', 'Rede Referenciada'],
      'baixada': ['Hospital Unimed-Rio', 'Rede Referenciada'],
      'niteroi': ['Hospital Unimed-Rio', 'Rede Referenciada'],
    },
  },
  { id: 'preventsenior', nome: 'Prevent Senior', logo: '/images/operadoras/preventsenior-logo.png', corPrimaria: '#1E3A5F', corSecundaria: '#0D2137', corAccent: '#FF8C00',
    hospitais: ['Rede Própria Prevent Senior','Copa D\'Or','Samaritano'],
    redeRegional: {
      'zona-sul': ['Rede Própria Prevent Senior'],
      'zona-norte': ['Rede Própria Prevent Senior'],
      'zona-oeste': ['Day Hospital Sancta Maggiore São Francisco'],
      'centro': ['Rede Própria Prevent Senior'],
      'baixada': ['Rede Própria Prevent Senior'],
      'niteroi': ['Rede Própria Prevent Senior'],
    },
  },
  { id: 'medsenior', nome: 'MedSenior', logo: '/images/operadoras/medsenior-logo.png', corPrimaria: '#1B8A2E', corSecundaria: '#146B22', corAccent: '#4CAF50',
    hospitais: ['Unidade MedSenior','Copa D\'Or','Quinta D\'Or'],
    redeRegional: {
      'zona-sul': ['Unidade MedSenior Botafogo'],
      'zona-norte': ['Unidade MedSenior Tijuca'],
      'zona-oeste': ['Unidade MedSenior Barra da Tijuca'],
      'centro': ['Unidade MedSenior Botafogo'],
      'baixada': ['Unidade MedSenior Caxias'],
      'niteroi': ['Unidade MedSenior Niterói'],
    },
  },
];

/* ═══════════ LOGOS DE HOSPITAIS E LABS ═══════════ */
const HOSPITAL_LOGOS: Record<string, string> = {
  'hospital badim': '/images/logos/logo badim.png',
  'badim': '/images/logos/logo badim.png',
  'hospital barra d\'or': '/images/logos/logo barra dor.gif',
  'barra d\'or': '/images/logos/logo barra dor.gif',
  'hospital copa d\'or': '/images/logos/logo copa dor.webp',
  'copa d\'or': '/images/logos/logo copa dor.webp',
  'copa star': '/images/logos/logo copa star.jpeg',
  'hospital copa star': '/images/logos/logo copa star.jpeg',
  'copa dor star': '/images/logos/logo copa star.jpeg',
  'hospital samaritano': '/images/logos/logo hospital samaritano.png',
  'samaritano': '/images/logos/logo hospital samaritano.png',
  'samaritano botafogo': '/images/logos/logo hospital samaritano.png',
  'samaritano barra': '/images/logos/logo hospital samaritano.png',
  'hospital vitória': '/images/logos/logo hospital vitoria.png',
  'hospital vitoria': '/images/logos/logo hospital vitoria.png',
  'hospital são vicente': '/images/logos/logo sao vicente gavea.svg',
  'são vicente': '/images/logos/logo sao vicente gavea.svg',
  'clínica são vicente': '/images/logos/logo sao vicente gavea.svg',
  'pró-cardíaco': '/images/logos/logo pro cardiaco.webp',
  'pro-cardiaco': '/images/logos/logo pro cardiaco.webp',
  'hospital quinta d\'or': '/images/logos/logo quinta dor.png',
  'quinta d\'or': '/images/logos/logo quinta dor.png',
  'casa de saúde são josé': '/images/logos/logo casa de saude sao jose.png',
  'hospital americas': '/images/logos/logo badim.png',
  'hospital américas': '/images/logos/logo badim.png',
  'são vicente de paulo': '/images/logos/logo sao vicente de paulo.png',
  'jutta batista': '/images/logos/logo jutta batista.png',
  'hospital jutta batista': '/images/logos/logo jutta batista.png',
  /* Rede D'Or — usam logo Barra D'Or como rede */
  'norte d\'or': '/images/logos/logo norte dor.svg',
  'hospital norte d\'or': '/images/logos/logo norte dor.svg',
  'glória d\'or': '/images/logos/logo barra dor.gif',
  'gloria d\'or': '/images/logos/logo barra dor.gif',
  'oeste d\'or': '/images/logos/logo barra dor.gif',
  'caxias d\'or': '/images/logos/logo barra dor.gif',
  'niterói d\'or': '/images/logos/logo barra dor.gif',
  'niteroi d\'or': '/images/logos/logo barra dor.gif',
  'hospital bangu': '/images/logos/logo barra dor.gif',
  'rio barra': '/images/logos/logo barra dor.gif',
  'perinatal barra': '/images/logos/logo barra dor.gif',
  'perinatal laranjeiras': '/images/logos/logo barra dor.gif',
  'rios d\'or': '/images/logos/logo barra dor.gif',
  'real d\'or': '/images/logos/logo barra dor.gif',
  'hospital icaraí': '/images/logos/logo barra dor.gif',
  'hospital icarai': '/images/logos/logo barra dor.gif',
  'hospital pasteur': '/images/logos/logo pasteur.png',
  'pasteur': '/images/logos/logo pasteur.png',
  'chn': '/images/logos/logo CHN.png',
  'centro hospitalar de niterói': '/images/logos/logo CHN.png',
  'centro hospitalar de niteroi': '/images/logos/logo CHN.png',
  /* Labs que vêm da DB como rede hospitalar */
  'rede labs a+': '/images/logos/logo labs.webp',
  'labs a+': '/images/logos/logo labs.webp',
  'rede labs': '/images/logos/logo labs.webp',
  /* Rede própria — usa logo da operadora */
  'rede própria prevent senior': '/images/operadoras/preventsenior-logo.png',
  'rede propria prevent senior': '/images/operadoras/preventsenior-logo.png',
  'sancta maggiore': '/images/operadoras/preventsenior-logo.png',
  'day hospital sancta maggiore': '/images/operadoras/preventsenior-logo.png',
  'day hospital sancta maggiore são francisco': '/images/operadoras/preventsenior-logo.png',
  'clínica leve saúde': '/images/operadoras/levesaude-logo.png',
  'clinica leve saude': '/images/operadoras/levesaude-logo.png',
  'clínicas leve saúde': '/images/operadoras/levesaude-logo.png',
  'clinicas leve saude': '/images/operadoras/levesaude-logo.png',
  'clínica leve saúde botafogo': '/images/operadoras/levesaude-logo.png',
  'clínica leve saúde tijuca': '/images/operadoras/levesaude-logo.png',
  'clínica leve saúde barra': '/images/operadoras/levesaude-logo.png',
  'clínica leve saúde centro': '/images/operadoras/levesaude-logo.png',
  'clínica leve saúde caxias': '/images/operadoras/levesaude-logo.png',
  'clínica leve saúde niterói': '/images/operadoras/levesaude-logo.png',
  'unidade medsenior': '/images/operadoras/medsenior-logo.png',
  'unidade medsenior botafogo': '/images/operadoras/medsenior-logo.png',
  'unidade medsenior tijuca': '/images/operadoras/medsenior-logo.png',
  'unidade medsenior barra da tijuca': '/images/operadoras/medsenior-logo.png',
  'unidade medsenior caxias': '/images/operadoras/medsenior-logo.png',
  'unidade medsenior niterói': '/images/operadoras/medsenior-logo.png',
  'hospital unimed-rio': '/images/operadoras/unimed-logo.png',
  'hospital unimed': '/images/operadoras/unimed-logo.png',
  'rede referenciada': '/images/operadoras/unimed-logo.png',
  /* Outros — sem logo própria, não atribui fallback falso */
};
/* Normaliza nome: minúscula, sem acentos, sem aspas curvas, sem pontuação */
const normName = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019\u201C\u201D`´]/g, "'").trim();
const getHospitalLogo = (nome: string): string | null => {
  const n = normName(nome);
  if (HOSPITAL_LOGOS[n]) return HOSPITAL_LOGOS[n];
  for (const [key, val] of Object.entries(HOSPITAL_LOGOS)) {
    const k = normName(key);
    if (n.includes(k) || k.includes(n)) return val;
  }
  return null;
};
const LAB_LOGOS: Record<string, string> = {
  'lâmina': '/images/logos/logo lamina.png',
  'lamina': '/images/logos/logo lamina.png',
  'sérgio franco': '/images/logos/logo sergio franco.svg',
  'sergio franco': '/images/logos/logo sergio franco.svg',
  'labs a+': '/images/logos/logo labs.webp',
  'labs a': '/images/logos/logo labs.webp',
  'rede labs': '/images/logos/logo labs.webp',
  'rede labs a+': '/images/logos/logo labs.webp',
  'lafe': '/images/logos/logo labs.webp',
  'dasa': '/images/logos/logo alta diagnosticos.png',
  'alta diagnósticos': '/images/logos/logo alta diagnosticos.png',
  'alta diagnosticos': '/images/logos/logo alta diagnosticos.png',
  'felippe mattoso': '/images/logos/logo felippe mattoso.png',
  'bronstein': '/images/logos/logo sergio franco.svg',
  'richet': '/images/logos/logo alta diagnosticos.png',
  'fleury': '/images/logos/logo felippe mattoso.png',
  'cdpi': '/images/logos/logo alta diagnosticos.png',
};
/* fallback: se avif nao renderizar, tenta png/svg */
const getLabLogo = (nome: string): string | null => {
  const n = normName(nome);
  /* match exato primeiro */
  if (LAB_LOGOS[n]) return LAB_LOGOS[n];
  /* match parcial */
  for (const [key, val] of Object.entries(LAB_LOGOS)) {
    const k = normName(key);
    if (n.includes(k) || k.includes(n)) return val;
  }
  return null;
};

/* ═══════════ ZONAS / BAIRROS RJ ═══════════ */
interface ZonaConfig {
  id: string; nome: string; bairros: string[];
  hospitais: string[]; labs: string[];
  bgKeyword: string; /* keyword para buscar imagens de fundo */
}

const ZONAS_RJ: ZonaConfig[] = [
  {
    id: 'zona-sul', nome: 'Zona Sul',
    bairros: ['Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Laranjeiras', 'Gávea', 'Lagoa', 'Humaitá', 'Urca', 'Leme', 'Catete', 'Glória'],
    hospitais: ['Copa Star', 'Copa D\'Or', 'Samaritano Botafogo', 'Jutta Batista', 'Glória D\'Or', 'Clínica São Vicente', 'Pró-Cardíaco', 'Casa de Saúde São José', 'São Lucas Copacabana'],
    labs: ['Sérgio Franco', 'Richet', 'Bronstein', 'LAFE', 'Lâmina', 'Fleury', 'CDPI'],
    bgKeyword: 'copacabana',
  },
  {
    id: 'zona-norte', nome: 'Zona Norte',
    bairros: ['Tijuca', 'Méier', 'Maracanã', 'Vila Isabel', 'Grajaú', 'Penha', 'Bonsucesso', 'Ilha do Governador', 'Ramos', 'Olaria', 'São Cristóvão', 'Cascadura'],
    hospitais: ['Quinta D\'Or', 'Norte D\'Or', 'Hospital Badim', 'Hospital Pasteur', 'Pan-Americano'],
    labs: ['Sérgio Franco', 'Bronstein', 'Richet', 'LAFE', 'Lâmina', 'CDPI'],
    bgKeyword: 'tijuca',
  },
  {
    id: 'zona-oeste', nome: 'Zona Oeste',
    bairros: ['Barra da Tijuca', 'Recreio', 'Jacarepaguá', 'Campo Grande', 'Santa Cruz', 'Bangu', 'Taquara'],
    hospitais: ['Barra D\'Or', 'Samaritano Barra', 'Rio Barra', 'Oeste D\'Or', 'Hospital Bangu', 'Perinatal Barra', 'Hospital Vitória'],
    labs: ['Sérgio Franco', 'Richet', 'Bronstein', 'LAFE', 'Lâmina', 'CDPI'],
    bgKeyword: 'barra da tijuca',
  },
  {
    id: 'centro', nome: 'Centro',
    bairros: ['Centro', 'Lapa', 'Santa Teresa', 'Glória', 'Cidade Nova', 'Praça Mauá', 'Rio Comprido'],
    hospitais: ['Casa de Portugal', 'Glória D\'Or'],
    labs: ['Sérgio Franco', 'Richet', 'Bronstein', 'LAFE', 'CDPI'],
    bgKeyword: 'centro rio',
  },
  {
    id: 'baixada', nome: 'Baixada Fluminense',
    bairros: ['Duque de Caxias', 'Nova Iguaçu', 'São João de Meriti', 'Nilópolis', 'Belford Roxo', 'Mesquita'],
    hospitais: ['Caxias D\'Or', 'Mário Lioni'],
    labs: ['LAFE', 'Sérgio Franco', 'Bronstein', 'Richet'],
    bgKeyword: 'duque de caxias',
  },
  {
    id: 'niteroi', nome: 'Niterói / São Gonçalo',
    bairros: ['Niterói', 'São Gonçalo', 'Icaraí', 'Centro Niterói', 'Itaipu', 'Piratininga'],
    hospitais: ['Niterói D\'Or', 'CHN'],
    labs: ['LAFE', 'CDPI', 'Sérgio Franco', 'Bronstein', 'Richet'],
    bgKeyword: 'niteroi',
  },
];

const FALLBACK_FAIXAS: FaixaPreco[] = [
  { faixa: '0-18', valor: 'R$ 0,00' },{ faixa: '19-23', valor: 'R$ 0,00' },
  { faixa: '24-28', valor: 'R$ 0,00' },{ faixa: '29-33', valor: 'R$ 0,00' },
  { faixa: '34-38', valor: 'R$ 0,00' },{ faixa: '39-43', valor: 'R$ 0,00' },
  { faixa: '44-48', valor: 'R$ 0,00' },{ faixa: '49-53', valor: 'R$ 0,00' },
  { faixa: '54-58', valor: 'R$ 0,00' },{ faixa: '59+', valor: 'R$ 0,00' },
];
const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/* Garante que a cor do texto de preço seja legível sobre fundo escuro */
const ensureReadable = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Luminance check - if too dark, lighten significantly
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum < 0.35) {
    // Lighten by mixing with white
    const factor = 0.6;
    const lr = Math.round(r + (255 - r) * factor);
    const lg = Math.round(g + (255 - g) * factor);
    const lb = Math.round(b + (255 - b) * factor);
    return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
  }
  return hex;
};

const AngIco = ({ t, className }: { t: string; className?: string }) => {
  const p = { className: className || 'h-4 w-4' };
  if (t === 'flame') return <Flame {...p} />;
  if (t === 'clock') return <Clock {...p} />;
  if (t === 'heart') return <Heart {...p} />;
  if (t === 'trending') return <TrendingUp {...p} />;
  if (t === 'alert') return <AlertCircle {...p} />;
  if (t === 'hospital') return <Building2 {...p} />;
  return <Target {...p} />;
};

/* ═══════════ COMPONENT ═══════════ */
export default function BannerGenerator({ corretorId }: { corretorId: string | null }) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [opIdx, setOpIdx] = useState(0);
  const [ratio, setRatio] = useState<Ratio>('9:16');
  const [template, setTemplate] = useState<Template>('tabela');
  const [modalidade, setModalidade] = useState<Modalidade>('PME');
  const [faixas, setFaixas] = useState<FaixaPreco[]>(FALLBACK_FAIXAS);
  const [nomePlano, setNomePlano] = useState('');
  const [coparticipacao, setCoparticipacao] = useState(false);
  const [copartTexto, setCopartTexto] = useState('');
  const [acomodacao, setAcomodacao] = useState<Acomodacao>('');
  const [abrangencia, setAbrangencia] = useState<Abrangencia>('');
  const [seguroViagem, setSeguroViagem] = useState(false);
  const [reembolso, setReembolso] = useState(false);
  const [cta, setCta] = useState('SAIBA MAIS - FAÇA COTAÇÃO');
  const [anguloIdx, setAnguloIdx] = useState(0);
  const [bgCat, setBgCat] = useState('none');
  const [bgUrl, setBgUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BgImg[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEnhanceLoading, setAiEnhanceLoading] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState('');
  const [previewFullUrl, setPreviewFullUrl] = useState('');
  const [aiRefinePrompt, setAiRefinePrompt] = useState('');
  const [aiRefineLoading, setAiRefineLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<string[]>([]); /* histórico de imagens IA geradas */
  const [aiAttachment, setAiAttachment] = useState(''); /* base64 da imagem anexada */
  const [aiAttachmentName, setAiAttachmentName] = useState(''); /* nome do arquivo anexado */
  const aiAttachRef = useRef<HTMLInputElement>(null);
  const [aiUserIdea, setAiUserIdea] = useState(''); /* ideia em linguagem natural do corretor */
  const [aiOptimizing, setAiOptimizing] = useState(false); /* gerando prompt otimizado */
  const [aiOptimizedPrompt, setAiOptimizedPrompt] = useState(''); /* prompt gerado pela IA */
  const [aiImageUrlFeed, setAiImageUrlFeed] = useState(''); /* versão feed 4:5 */
  const [aiImageUrlStories, setAiImageUrlStories] = useState(''); /* versão stories 9:16 */
  const [aiFormatLoading, setAiFormatLoading] = useState<'feed' | 'stories' | null>(null);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSavedUrl, setAiSavedUrl] = useState('');
  const [status, setStatus] = useState<Status>('editing');
  const [resultUrl, setResultUrl] = useState('');
  const [loadingPrecos, setLoadingPrecos] = useState(false);
  const [zonaIdx, setZonaIdx] = useState(-1); /* -1 = nenhuma zona selecionada */
  const [redeHospitalarDB, setRedeHospitalarDB] = useState<string[]>([]);
  const [bgPosX, setBgPosX] = useState(50); /* % horizontal 0-100 */
  const [bgPosY, setBgPosY] = useState(50); /* % vertical 0-100 */
  const [customHeadline, setCustomHeadline] = useState('');
  const [customBadge, setCustomBadge] = useState('');
  const [customFooter, setCustomFooter] = useState('* Rede depende do plano escolhido');
  const [aiAnguloLoading, setAiAnguloLoading] = useState(false);

  const op = OPERADORAS[opIdx];
  const angulo = ANGULOS[anguloIdx];
  const zona = zonaIdx >= 0 ? ZONAS_RJ[zonaIdx] : null;
  const displayHeadline = customHeadline || angulo.headline;
  const displayBadge = customBadge || angulo.badge;

  /* Hospitais a exibir no banner: zona+operadora se disponível, senão operadora hardcoded (Geral) */
  const hospitaisRaw = zona
    ? (op.redeRegional?.[zona.id]?.length ? op.redeRegional[zona.id] : zona.hospitais)
    : op.hospitais;
  const labsRaw = zona ? zona.labs : [];

  /* Deduplica por logo — não repetir mesma logo no banner */
  const dedupeByLogo = (items: string[], logoFn: (n: string) => string | null): string[] => {
    const seen = new Set<string>();
    return items.filter(name => {
      const logo = logoFn(name);
      const key = logo || name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const hospitaisExibir = dedupeByLogo(hospitaisRaw, getHospitalLogo);
  const labsExibir = dedupeByLogo(labsRaw, getLabLogo);

  const fetchPrecos = useCallback(async (opId: string, mod: Modalidade) => {
    setLoadingPrecos(true);
    try {
      const res = await fetch(`/api/corretor/banners/precos?operadora=${opId}&modalidade=${mod}`);
      const json = await res.json();
      if (json.data?.length > 0) {
        setFaixas(json.data.map((f: { faixa_etaria: string; valor: number }) => ({ faixa: f.faixa_etaria, valor: fmtBRL(f.valor) })));
        if (json.plano) {
          setNomePlano(json.plano.plano_nome || '');
          setCoparticipacao(json.plano.coparticipacao || false);
          if (json.plano.coparticipacao) setCopartTexto('Com Coparticipação');
          if (json.plano.acomodacao) setAcomodacao(json.plano.acomodacao);
          if (json.plano.abrangencia) setAbrangencia(json.plano.abrangencia);
          if (json.plano.rede_hospitalar?.length > 0) {
            setRedeHospitalarDB(json.plano.rede_hospitalar);
          } else {
            setRedeHospitalarDB([]);
          }
        }
      } else { setFaixas(FALLBACK_FAIXAS); setNomePlano(''); setRedeHospitalarDB([]); }
    } catch { setFaixas(FALLBACK_FAIXAS); setRedeHospitalarDB([]); }
    finally { setLoadingPrecos(false); }
  }, []);

  useEffect(() => { fetchPrecos(OPERADORAS[opIdx].id, modalidade); }, [opIdx, modalidade, fetchPrecos]);
  useEffect(() => { setCustomHeadline(''); setCustomBadge(''); }, [anguloIdx]);

  const updateFaixa = (i: number, k: 'faixa' | 'valor', v: string) => setFaixas(p => p.map((f, j) => j === i ? { ...f, [k]: v } : f));
  const removeFaixa = (i: number) => setFaixas(p => p.filter((_, j) => j !== i));
  const addFaixa = () => setFaixas(p => [...p, { faixa: '', valor: '' }]);

  const generateAiText = async () => {
    const prompt = aiPrompt.trim() || `Gere mensagem persuasiva com ângulo "${angulo.nome}" para ${op.nome} ${nomePlano} ${modalidade}. Use gatilhos de ${angulo.id}.`;
    setAiLoading(true);
    try {
      const res = await fetch('/api/corretor/banners/ai-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, operadora: op.nome, plano: nomePlano, modalidade }) });
      const json = await res.json();
      if (json.success && json.text) { toast.success('Texto gerado com IA!'); }
      else toast.error(json.error || 'Erro ao gerar');
    } catch { toast.error('Erro de conexão'); }
    finally { setAiLoading(false); }
  };

  const generateAnguloText = async () => {
    setAiAnguloLoading(true);
    try {
      const res = await fetch('/api/corretor/banners/ai-angulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angulo: { id: angulo.id, nome: angulo.nome, descricao: angulo.descricao, headline: angulo.headline, sub: angulo.sub, badge: angulo.badge },
          operadora: op.nome, plano: nomePlano, modalidade,
          zona: zona?.nome || '',
        }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.headline) setCustomHeadline(json.headline);
        if (json.badge) setCustomBadge(json.badge);
        toast.success('🎲 Novo texto gerado!');
      } else toast.error(json.error || 'Erro ao gerar');
    } catch { toast.error('Erro de conexão'); }
    finally { setAiAnguloLoading(false); }
  };

  const searchUnsplash = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const query = encodeURIComponent(searchQuery.trim());
      const res = await fetch(`/api/corretor/banners/unsplash?q=${query}`);
      const json = await res.json();
      if (json.results) setSearchResults(json.results);
    } catch { toast.error('Erro ao buscar imagens'); }
    finally { setSearchLoading(false); }
  };

  const captureCanvas = async () => {
    if (!bannerRef.current) return null;
    return html2canvas(bannerRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null, logging: false });
  };

  /* Preview em tamanho real (sem baixar) */
  const previewBannerFull = async () => {
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      setPreviewFullUrl(canvas.toDataURL('image/png'));
    } catch { toast.error('Erro ao gerar preview'); }
  };

  const generate = async () => {
    if (!bannerRef.current) return;
    setStatus('generating');
    try {
      const canvas = await captureCanvas();
      if (!canvas) { setStatus('error'); return; }
      canvas.toBlob(async (blob) => {
        if (!blob) { setStatus('error'); return; }
        const fd = new FormData();
        fd.append('file', blob, 'banner.png');
        fd.append('corretorId', corretorId || 'admin');
        fd.append('nomeCorretor', nome || 'Corretor');
        fd.append('operadora', op.id);
        fd.append('templateId', template);
        const res = await fetch('/api/corretor/banners/generate', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success && data.imageUrl) { setResultUrl(data.imageUrl); setStatus('success'); toast.success('Banner salvo!'); }
        else { setStatus('error'); toast.error(data.error || 'Erro ao salvar'); }
      }, 'image/png');
    } catch { setStatus('error'); toast.error('Erro ao gerar'); }
  };

  const downloadLocal = async () => {
    const canvas = await captureCanvas();
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `banner-${op.id}-${angulo.id}-${template}-${Date.now()}.png`;
    a.click();
    toast.success('Download iniciado!');
  };

  const downloadUploaded = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl; a.download = `banner-${op.id}-${Date.now()}.png`; a.target = '_blank'; a.click();
  };

  const enhanceWithAI = async () => {
    const canvas = await captureCanvas();
    if (!canvas) { toast.error('Erro ao capturar preview'); return; }
    setAiEnhanceLoading(true);
    setAiImageUrl('');
    setAiHistory([]);
    setAiRefinePrompt('');
    setAiUserIdea('');
    setAiOptimizedPrompt('');
    setAiImageUrlFeed('');
    setAiImageUrlStories('');
    setAiSavedUrl('');
    try {
      const imageBase64 = canvas.toDataURL('image/png');
      const res = await fetch('/api/corretor/banners/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, operadora: op.nome, plano: nomePlano, modalidade, angulo: angulo.id, template, ratio }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setAiImageUrl(data.imageUrl);
        setAiHistory([data.imageUrl]);
        toast.success('🎨 Imagem gerada com IA!');
      } else {
        toast.error(data.error || 'Erro ao gerar imagem com IA');
      }
    } catch { toast.error('Erro de conexão com IA'); }
    finally { setAiEnhanceLoading(false); }
  };

  const refineAiImage = async () => {
    if (!aiRefinePrompt.trim() || !aiImageUrl) return;
    const canvas = await captureCanvas();
    if (!canvas) { toast.error('Erro ao capturar preview'); return; }
    setAiRefineLoading(true);
    try {
      const imageBase64 = canvas.toDataURL('image/png');
      const payload: Record<string, string> = {
        imageBase64,
        operadora: op.nome,
        plano: nomePlano,
        modalidade,
        angulo: angulo.id,
        template,
        ratio,
        refinementPrompt: aiRefinePrompt.trim(),
        previousImageBase64: aiImageUrl,
      };
      if (aiAttachment) {
        payload.attachmentBase64 = aiAttachment;
      }
      const res = await fetch('/api/corretor/banners/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setAiImageUrl(data.imageUrl);
        setAiHistory(prev => [...prev, data.imageUrl]);
        setAiRefinePrompt('');
        setAiAttachment('');
        setAiAttachmentName('');
        setAiSavedUrl('');
        toast.success('✨ Ajuste aplicado com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao refinar imagem');
      }
    } catch { toast.error('Erro de conexão com IA'); }
    finally { setAiRefineLoading(false); }
  };

  const handleAiAttachment = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens são aceitas'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande (máx. 10MB)'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAiAttachment(e.target?.result as string);
      setAiAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  /* ═══ Assistente de Prompt — transforma ideia do corretor em prompt técnico ═══ */
  const optimizePrompt = async () => {
    if (!aiUserIdea.trim()) return;
    setAiOptimizing(true);
    try {
      const res = await fetch('/api/corretor/banners/ai-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Transforme este pedido do corretor em um prompt técnico avançado de design para IA generativa de imagem.

PEDIDO DO USUÁRIO: "${aiUserIdea.trim()}"

${aiAttachment ? 'NOTA: O usuário anexou uma imagem (logo/foto). Instrua a IA sobre onde e como posicioná-la no banner.' : ''}

CONTEXTO DO BANNER ATUAL:
- Operadora: ${op.nome}
- Plano: ${nomePlano}
- Formato: ${ratio === '9:16' ? 'Stories 9:16 (1080×1920)' : 'Feed 4:5 (1080×1350)'}

Gere APENAS o prompt técnico de design (instruções de composição, tipografia, cores, posição), máximo 500 caracteres. Sem explicações.`,
          operadora: op.nome,
          plano: nomePlano,
          modalidade,
        }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setAiOptimizedPrompt(data.text);
        setAiRefinePrompt(data.text);
        toast.success('🧠 Prompt otimizado gerado!');
      } else {
        toast.error('Erro ao otimizar prompt');
      }
    } catch { toast.error('Erro de conexão'); }
    finally { setAiOptimizing(false); }
  };

  /* ═══ Gerar imagem em formato alternativo (Stories ↔ Feed) ═══ */
  const generateAiFormat = async (targetRatio: 'feed' | 'stories') => {
    if (!aiImageUrl) return;
    const canvas = await captureCanvas();
    if (!canvas) { toast.error('Erro ao capturar preview'); return; }
    setAiFormatLoading(targetRatio);
    try {
      const imageBase64 = canvas.toDataURL('image/png');
      const res = await fetch('/api/corretor/banners/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          operadora: op.nome,
          plano: nomePlano,
          modalidade,
          angulo: angulo.id,
          template,
          ratio: targetRatio === 'stories' ? '9:16' : '4:5',
          refinementPrompt: `Adapte este banner para o formato ${targetRatio === 'stories' ? 'Stories/Reels vertical (9:16, 1080x1920)' : 'Feed Instagram (4:5, 1080x1350)'}. Mantenha TODOS os elementos visuais, textos, cores e estilo. Apenas reorganize o layout para caber no novo formato.`,
          previousImageBase64: aiImageUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        if (targetRatio === 'stories') {
          setAiImageUrlStories(data.imageUrl);
        } else {
          setAiImageUrlFeed(data.imageUrl);
        }
        toast.success(`📐 Versão ${targetRatio === 'stories' ? 'Stories' : 'Feed'} gerada!`);
      } else {
        toast.error(data.error || 'Erro ao gerar formato');
      }
    } catch { toast.error('Erro de conexão com IA'); }
    finally { setAiFormatLoading(null); }
  };

  /* ═══ Salvar imagem IA na galeria (Supabase) ═══ */
  const saveAiImage = async () => {
    if (!aiImageUrl || aiSaving) return;
    setAiSaving(true);
    try {
      const res = await fetch('/api/corretor/banners/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: aiImageUrl,
          corretorId: corretorId || 'criativopro-user',
          nomeCorretor: nome || 'Corretor',
          operadora: op.id,
          plano: nomePlano,
          formato: ratio,
          origem: 'criativopro',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSavedUrl(data.imageUrl);
        toast.success('✅ Imagem salva na galeria!');
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch { toast.error('Erro de conexão'); }
    finally { setAiSaving(false); }
  };

  const undoAiImage = () => {
    if (aiHistory.length <= 1) return;
    const newHistory = aiHistory.slice(0, -1);
    setAiHistory(newHistory);
    setAiImageUrl(newHistory[newHistory.length - 1]);
    toast.success('↩️ Versão anterior restaurada');
  };

  const isStories = ratio === '9:16';
  const W = 1080;
  const H = isStories ? 1920 : 1350;
  const previewW = isStories ? 340 : 380;
  const previewH = isStories ? 604 : 475;
  const scaleFactor = previewW / W;
  const hasBg = bgCat !== 'none' && bgUrl;
  const faixasVisiveis = faixas; /* mostra TODAS as faixas ANS em ambos formatos */

  /* Info badges para dentro do banner */
  const infoBadges: string[] = [];
  if (acomodacao) infoBadges.push(acomodacao);
  if (abrangencia) infoBadges.push(abrangencia);
  if (coparticipacao && copartTexto) infoBadges.push(copartTexto);
  if (reembolso) infoBadges.push('Com Reembolso');
  if (seguroViagem) infoBadges.push('Seguro Viagem');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ════════ COLUNA ESQUERDA: FORMULÁRIO ════════ */}
      <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-2 scrollbar-thin">

        {/* GUIA COMO USAR - sempre visível */}
        <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-[#D4AF37] font-bold text-sm sm:text-base">📖 CriativoPRO — Gerador de Criativos Profissionais</h3>
          </div>
          <ol className="text-xs sm:text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
            <li><strong className="text-gray-300">Modalidade:</strong> PME, PF ou Adesão + Coparticipação</li>
            <li><strong className="text-gray-300">Template & Formato:</strong> Tabela, Preço ou Hospitais + Stories / Reels ou Feed</li>
            <li><strong className="text-gray-300">Ângulo de Venda:</strong> Selecione a abordagem e personalize textos</li>
            <li><strong className="text-gray-300">Região / Bairro:</strong> A IA escolhe hospitais e labs da zona</li>
            <li><strong className="text-gray-300">Operadora:</strong> Escolha a operadora do plano</li>
            <li><strong className="text-gray-300">Dados do Plano:</strong> Edite preços, faixas e detalhes</li>
            <li><strong className="text-gray-300">Imagem de Fundo:</strong> Escolha ou busque uma imagem</li>
            <li><strong className="text-gray-300">Seus Dados:</strong> Seu nome e WhatsApp (opcional)</li>
          </ol>
          <p className="text-xs sm:text-sm text-[#D4AF37] mt-2">💡 A prévia atualiza em tempo real. Quando estiver pronto, clique em "Gerar" ou "Baixar".</p>
        </div>

        {/* ─── ETAPA 1 — MODALIDADE & COPARTICIPAÇÃO ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
            Modalidade & Coparticipação
          </h3>
          <div className="flex gap-2 mb-3">
            {(['PME','PF','Adesão'] as Modalidade[]).map(m => (
              <button key={m} onClick={() => setModalidade(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${modalidade === m ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400'}`}>
                {m}
              </button>
            ))}
          </div>
          <label className="text-xs text-gray-400 mb-1 block">Coparticipação</label>
          <div className="flex gap-2">
            {([
              { label: 'Sem', value: '', active: false },
              { label: 'Com Copart.', value: 'Com Coparticipação', active: true },
              { label: 'Parcial TP', value: 'Copart. Parcial TP', active: true },
            ] as const).map(opt => (
              <button key={opt.label}
                onClick={() => { setCoparticipacao(opt.active); setCopartTexto(opt.value); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${copartTexto === opt.value ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── ETAPA 2 — TEMPLATE & FORMATO ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
            Template & Formato
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wide mb-2 block">Template</span>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'tabela' as Template, label: '📊 Tabela', desc: 'Tabela de preços' },
                  { key: 'preco' as Template, label: '💰 Preço', desc: 'Destaque de preço' },
                  { key: 'hospitais' as Template, label: '🏥 Hospitais', desc: 'Logos da rede' },
                ]).map(t => (
                  <button key={t.key} onClick={() => setTemplate(t.key)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-medium border transition-all text-center ${template === t.key ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    <span className="block text-sm mb-0.5">{t.label}</span>
                    <span className="block text-[10px] opacity-60">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wide mb-2 block">Formato</span>
              <div className="flex gap-2">
                {(['9:16','4:5'] as Ratio[]).map(r => (
                  <button key={r} onClick={() => setRatio(r)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${ratio === r ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400'}`}>
                    {r === '9:16' ? '📱 Stories / Reels' : '📐 Feed'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── ETAPA 3 — ÂNGULO DE VENDA ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
            Ângulo de Venda
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {ANGULOS.map((a, i) => (
              <button key={a.id} onClick={() => setAnguloIdx(i)}
                className={`text-left p-3 rounded-lg border transition-all ${i === anguloIdx ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 hover:border-gray-600'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AngIco t={a.icone} className="text-[#D4AF37] w-4 h-4" />
                  <span className="text-white text-xs font-medium">{a.nome}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{a.sub}</p>
              </button>
            ))}
          </div>

          {/* ── Personalização manual dos textos ── */}
          <div className="mt-3 space-y-2.5 bg-[#1a1a1a] rounded-lg p-3 border border-gray-700/50">
            <p className="text-xs text-[#D4AF37] font-bold flex items-center gap-1.5">✏️ Personalizar textos do criativo</p>
            <div>
              <label className="text-gray-500 text-xs uppercase mb-1 block">Headline (título principal)</label>
              <input value={customHeadline} onChange={e => setCustomHeadline(e.target.value)} placeholder={angulo.headline}
                className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37] outline-none" />
            </div>
            <div>
              <label className="text-gray-500 text-xs uppercase mb-1 block">Badge (etiqueta)</label>
              <input value={customBadge} onChange={e => setCustomBadge(e.target.value)} placeholder={angulo.badge}
                className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37] outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-gray-500 text-xs uppercase mb-1 block">CTA (botão)</label>
                <input value={cta} onChange={e => setCta(e.target.value)} placeholder="SAIBA MAIS"
                  className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37] outline-none" />
              </div>
              <div>
                <label className="text-gray-500 text-xs uppercase mb-1 block">Nome do Plano</label>
                <input value={nomePlano} onChange={e => setNomePlano(e.target.value)} placeholder="Ex: Essencial II"
                  className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37] outline-none" />
              </div>
            </div>
            {coparticipacao && (
              <div>
                <label className="text-gray-500 text-xs uppercase mb-1 block">Texto Coparticipação (badge)</label>
                <input value={copartTexto} onChange={e => setCopartTexto(e.target.value)} placeholder="Com Coparticipação"
                  className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37] outline-none" />
              </div>
            )}
            <div>
              <label className="text-gray-500 text-xs uppercase mb-1 block">Rodapé (disclaimer)</label>
              <input value={customFooter} onChange={e => setCustomFooter(e.target.value)} placeholder="* Rede depende do plano escolhido"
                className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37] outline-none" />
            </div>
            {(customHeadline || customBadge) && (
              <button onClick={() => { setCustomHeadline(''); setCustomBadge(''); }}
                className="text-xs text-red-400 hover:text-red-300 underline">🔄 Restaurar textos originais do ângulo</button>
            )}
          </div>

          {/* Botão Gerar Texto IA */}
          <button onClick={generateAnguloText} disabled={aiAnguloLoading}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs transition-all disabled:opacity-50">
            {aiAnguloLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiAnguloLoading ? 'Gerando...' : '🎲 Gerar Novo Texto com IA'}
          </button>
        </div>

        {/* ─── ETAPA 4 — REGIÃO / BAIRRO ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
            <MapPin className="w-4 h-4 text-[#D4AF37]" /> Região / Bairro
          </h3>
          <p className="text-gray-500 text-xs mb-3">Selecione a região para exibir hospitais e labs no banner</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={() => setZonaIdx(-1)}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${zonaIdx === -1 ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
              Geral
            </button>
            {ZONAS_RJ.map((z, i) => (
              <button key={z.id} onClick={() => setZonaIdx(i)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${zonaIdx === i ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                {z.nome}
              </button>
            ))}
          </div>
          {zona && (
            <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2">
              <div>
                <span className="text-gray-500 text-xs uppercase block mb-1">🏥 Hospitais {op.nome} • {zona.nome}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(op.redeRegional?.[zona.id]?.length ? op.redeRegional[zona.id] : zona.hospitais).map((h, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">{h}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase block mb-1">🔬 Laboratórios</span>
                <div className="flex flex-wrap gap-1.5">
                  {zona.labs.map((l, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-purple-600/10 text-purple-400 border border-purple-500/30">{l}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase block mb-1">📍 Bairros</span>
                <p className="text-gray-400 text-xs">{zona.bairros.join(', ')}</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── ETAPA 5 — OPERADORA ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
            Operadora
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {OPERADORAS.map((o, i) => (
              <button key={o.id} onClick={() => setOpIdx(i)}
                className={`relative rounded-lg p-2 border transition-all text-center ${i === opIdx ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 hover:border-gray-600'}`}>
                {o.logo ? (
                  <div className="bg-white rounded-lg p-2 mx-auto mb-1 flex items-center justify-center" style={{ width: 60, height: 48 }}>
                    <img src={o.logo} alt={o.nome} style={{ width: 52, height: 40, objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div className="w-12 h-12 mx-auto mb-1 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: o.corPrimaria }}>{o.nome[0]}</div>
                )}
                <span className="text-xs text-gray-400 block truncate">{o.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── ETAPA 6 — DADOS DO PLANO ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">6</span>
            Dados do Plano
          </h3>
          {/* Detalhes extras do plano */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Acomodação</label>
              <select value={acomodacao} onChange={e => setAcomodacao(e.target.value as Acomodacao)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] outline-none">
                <option value="">Não informar</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Enfermaria">Enfermaria</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Abrangência</label>
              <select value={abrangencia} onChange={e => setAbrangencia(e.target.value as Abrangencia)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4AF37] outline-none">
                <option value="">Não informar</option>
                <option value="Nacional">Nacional</option>
                <option value="Estadual">Estadual</option>
                <option value="Municipal">Municipal</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={reembolso} onChange={e => setReembolso(e.target.checked)} className="accent-[#D4AF37]" />
              <Stethoscope className="w-3 h-3" /> Com Reembolso
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={seguroViagem} onChange={e => setSeguroViagem(e.target.checked)} className="accent-[#D4AF37]" />
              <Shield className="w-3 h-3" /> Seguro Viagem
            </label>
          </div>
          {/* Faixas de preço */}
          {loadingPrecos ? (
            <div className="text-center py-4"><RefreshCw className="w-5 h-5 text-[#D4AF37] animate-spin mx-auto" /><span className="text-gray-500 text-xs mt-1 block">Carregando preços...</span></div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-500 text-xs uppercase">Faixas Etárias</span>
                <span className="text-gray-600 text-xs">{faixas.length} faixas (todas visíveis)</span>
              </div>
              {faixas.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={f.faixa} onChange={e => updateFaixa(i, 'faixa', e.target.value)} placeholder="0-18"
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-[#D4AF37] outline-none" />
                  <input value={f.valor} onChange={e => updateFaixa(i, 'valor', e.target.value)} placeholder="R$ 299,90"
                    className="w-28 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-[#D4AF37] outline-none" />
                  <button onClick={() => removeFaixa(i)} className="text-red-500 hover:text-red-400 text-xs p-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={addFaixa} className="text-[#D4AF37] text-xs hover:underline mt-1">+ Adicionar faixa</button>
            </div>
          )}
        </div>

        {/* ─── ETAPA 7 — IMAGEM DE FUNDO ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">7</span>
            Imagem de Fundo
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={() => { setBgCat('none'); setBgUrl(''); setBgPosX(50); setBgPosY(50); }}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${bgCat === 'none' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400'}`}>
              Sem Imagem
            </button>
            {Object.keys(BG_IMAGES).map(cat => (
              <button key={cat} onClick={() => { setBgCat(cat); setBgUrl(BG_IMAGES[cat as keyof typeof BG_IMAGES][0].url); }}
                className={`px-3 py-1.5 rounded-lg text-xs border capitalize transition-all ${bgCat === cat ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-700 text-gray-400'}`}>
                {cat}
              </button>
            ))}
          </div>
          {bgCat !== 'none' && BG_IMAGES[bgCat as keyof typeof BG_IMAGES] && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {BG_IMAGES[bgCat as keyof typeof BG_IMAGES].map(img => (
                <button key={img.url} onClick={() => setBgUrl(img.url)}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${bgUrl === img.url ? 'border-[#D4AF37]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <NextImage src={img.url} alt={img.nome} fill className="object-cover" unoptimized />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-white py-0.5">{img.nome}</span>
                </button>
              ))}
            </div>
          )}
          {/* Busca customizada */}
          {hasBg && (
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Ajustar posição da imagem
              </p>
              <div className="flex gap-4">
                <label className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">Horizontal ← →</span>
                  <input type="range" min={0} max={100} value={bgPosX} onChange={e => setBgPosX(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#D4AF37]" />
                </label>
                <label className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">Vertical ↑ ↓</span>
                  <input type="range" min={0} max={100} value={bgPosY} onChange={e => setBgPosY(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#D4AF37]" />
                </label>
                <button onClick={() => { setBgPosX(50); setBgPosY(50); }}
                  className="text-xs text-gray-500 hover:text-[#D4AF37] self-end pb-0.5" title="Resetar posição">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUnsplash()}
              placeholder="Buscar imagem... ex: hospital, família" className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-[#D4AF37] outline-none" />
            <button onClick={searchUnsplash} disabled={searchLoading}
              className="px-3 py-2 bg-[#D4AF37]/20 text-[#D4AF37] rounded-lg text-xs hover:bg-[#D4AF37]/30 disabled:opacity-50 flex items-center gap-1">
              {searchLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Buscar
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {searchResults.map((img, i) => (
                <button key={i} onClick={() => { setBgUrl(img.url); setBgCat('busca'); }}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${bgUrl === img.url ? 'border-[#D4AF37]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <NextImage src={img.url} alt={img.nome} fill className="object-cover" unoptimized />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-center text-white py-0.5">{img.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── ETAPA 8 — SEUS DADOS ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="bg-[#D4AF37] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">8</span>
            Seus Dados (Opcional)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs uppercase mb-1 block">Nome</label>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#D4AF37] outline-none" />
            </div>
            <div>
              <label className="text-gray-500 text-xs uppercase mb-1 block">WhatsApp</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(21) 99999-9999"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#D4AF37] outline-none" />
            </div>
          </div>
        </div>

        {/* ─── AÇÕES ─── */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={downloadLocal}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#D4AF37] to-[#b8960c] text-black rounded-lg font-bold text-sm hover:opacity-90 transition">
              <Download className="w-4 h-4" /> Baixar PNG
            </button>
            <button onClick={generate} disabled={status === 'generating'}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
              {status === 'generating' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {status === 'generating' ? 'Gerando...' : 'Gerar & Salvar'}
            </button>
          </div>
          <button onClick={enhanceWithAI} disabled={aiEnhanceLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-xs hover:opacity-90 transition disabled:opacity-50">
            {aiEnhanceLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            🎨 Gerar Versão IA (imagem)
          </button>
          {status === 'success' && resultUrl && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-center">
              <p className="text-green-400 text-xs mb-2">✅ Banner salvo com sucesso!</p>
              <button onClick={downloadUploaded} className="text-[#D4AF37] text-xs hover:underline flex items-center gap-1 mx-auto">
                <Download className="w-3 h-3" /> Baixar versão salva
              </button>
            </div>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-xs text-center">❌ Erro ao gerar. Tente novamente.</p>
          )}
        </div>
      </div>

      {/* ════════ COLUNA DIREITA: PREVIEW ════════ */}
      <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#D4AF37]" /> Prévia em Tempo Real
          <span className="text-gray-500 text-xs ml-auto">{W}×{H}px • {ratio}</span>
        </h3>

        {/* Container de preview com escala */}
        <div className="relative mx-auto cursor-pointer group" style={{ width: previewW, height: previewH }} onClick={previewBannerFull} title="Clique para ver em tamanho real">
          <div className="absolute inset-0 rounded-xl overflow-hidden border-2 border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/10 group-hover:border-[#D4AF37]/60 transition-colors">
            <div className="absolute top-2 right-2 z-10 bg-black/60 text-white/70 text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">🔍 Ver tamanho real</div>
            <div ref={bannerRef} style={{ width: W, height: H, transform: `scale(${scaleFactor})`, transformOrigin: 'top left' }}
              className="relative overflow-hidden">

              {/* Background — horizontal via object-position, vertical via scale+translateY */}
              {hasBg ? (
                <>
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                    <img src={bgUrl} alt="" crossOrigin="anonymous"
                      style={{
                        position: 'absolute',
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        objectPosition: `${bgPosX}% 50%`,
                        transformOrigin: 'center center',
                        transform: `scaleY(1.3) translateY(${(50 - bgPosY) * 0.23}%)`,
                        display: 'block', pointerEvents: 'none',
                      }} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
                </>
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${op.corPrimaria}22, #050505 40%, #050505 60%, ${op.corPrimaria}22)` }} />
              )}

              {/* Tudo relativo ao banner */}
              <div className="absolute inset-0 flex flex-col" style={{ padding: isStories ? (template === 'tabela' ? '28px 48px' : '60px 50px') : (template === 'tabela' ? '24px 44px' : '40px 50px') }}>

                {/* HEADER: Logo + badge + angulo */}
                <div className="flex items-start justify-between" style={{ marginBottom: template === 'tabela' ? (isStories ? 8 : 4) : 16 }}>
                  <div className="flex items-center gap-4">
                    {op.logo && (
                      <div className="bg-white rounded-2xl p-3 shadow-lg" style={{ width: isStories ? 320 : (template === 'tabela' ? 200 : 250), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={op.logo} alt={op.nome} crossOrigin="anonymous" style={{ width: isStories ? 280 : (template === 'tabela' ? 168 : 210), maxHeight: isStories ? 110 : (template === 'tabela' ? 70 : 86), objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-3 rounded-full text-white font-black" style={{ background: op.corPrimaria, fontSize: isStories ? 36 : (template === 'tabela' ? 26 : 30) }}>
                    {modalidade}
                  </div>
                </div>

                {/* HEADLINE — caixa alta, largura total, 2 linhas impactantes (NÃO no template tabela — aparece após a tabela) */}
                {template !== 'tabela' && (
                <div className="mb-4" style={{ width: '100%' }}>
                  <h2 className="font-black leading-[1.05] text-white" style={{ fontSize: (() => {
                    const len = displayHeadline.length;
                    if (isStories) return len > 35 ? 58 : len > 25 ? 68 : 80;
                    return len > 35 ? 50 : len > 25 ? 58 : 68;
                  })(), textTransform: 'uppercase' as const, textShadow: '3px 3px 12px rgba(0,0,0,0.9)', width: '100%', wordBreak: 'break-word' as const }}>
                    {displayHeadline}
                  </h2>
                  <div className="mt-3 px-6 py-2 rounded-full inline-block font-bold text-white" style={{ background: op.corPrimaria, fontSize: isStories ? 34 : 30 }}>
                    {displayBadge}
                  </div>
                </div>
                )}

                {/* INFO BADGES - acomodação, abrangência, reembolso, seguro viagem (NÃO no template tabela — aparece após headline) */}
                {infoBadges.length > 0 && template !== 'tabela' && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {infoBadges.map((b, i) => (
                      <span key={i} className="flex items-center gap-3 rounded-full text-white font-bold border-2 border-white/40" style={{ fontSize: isStories ? 36 : 30, padding: '14px 26px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: isStories ? 40 : 34 }}>✓</span> {b}
                      </span>
                    ))}
                  </div>
                )}

                {/* NOME DO PLANO */}
                {nomePlano && (
                  <div className="text-center" style={{ marginBottom: template === 'tabela' ? (isStories ? 6 : 2) : 12 }}>
                    <span className="text-white/60 font-medium" style={{ fontSize: isStories ? (template === 'tabela' ? 26 : 30) : (template === 'tabela' ? 22 : 26) }}>Plano</span>
                    <h3 className="font-black" style={{ fontSize: isStories ? (template === 'tabela' ? 42 : 48) : (template === 'tabela' ? 34 : 42), color: ensureReadable(op.corPrimaria), textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                      {nomePlano}{coparticipacao && copartTexto ? ` (${copartTexto === 'Com Coparticipação' ? 'C/ Copart.' : copartTexto})` : ''}
                    </h3>
                  </div>
                )}

                {/* TABELA DE PREÇOS — auto-scale para caber no banner */}
                {template === 'tabela' && (() => {
                  const n = faixasVisiveis.length;
                  /* Escala dinâmica: quanto mais faixas, menor fonte e padding */
                  const tHeadFs = isStories ? (n > 8 ? 36 : 42) : (n > 8 ? 28 : n > 6 ? 32 : 38);
                  const tHeadPy = isStories ? (n > 8 ? 14 : 18) : (n > 8 ? 7 : n > 6 ? 9 : 14);
                  const tRowFs = isStories ? (n > 8 ? 36 : n > 6 ? 40 : 44) : (n > 8 ? 27 : n > 6 ? 30 : 36);
                  const tRowPy = isStories ? (n > 8 ? 10 : n > 6 ? 12 : 14) : (n > 8 ? 4 : n > 6 ? 5 : 8);
                  return (
                  <div className="flex flex-col min-h-0">
                    <div className="rounded-2xl overflow-hidden border border-white/20" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
                      {/* Header da tabela */}
                      <div className="flex text-white font-black" style={{ background: op.corPrimaria, padding: `${tHeadPy}px 40px`, fontSize: tHeadFs }}>
                        <span className="flex-1">Faixa Etária</span>
                        <span>Valor Mensal</span>
                      </div>
                      {/* Linhas — auto-scaled */}
                      {faixasVisiveis.map((f, i) => (
                        <div key={i} className="flex items-center text-white border-t border-white/10"
                          style={{ padding: `${tRowPy}px 40px`, fontSize: tRowFs, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.04)' }}>
                          <span className="flex-1 text-white/80">{f.faixa}</span>
                          <span className="font-black" style={{ color: ensureReadable(op.corPrimaria) }}>{f.valor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })()}

                {/* ═══ TEMPLATE TABELA: HEADLINE CENTRALIZADO ABAIXO DA TABELA ═══ */}
                {template === 'tabela' && (
                  <div className="text-center" style={{ width: '100%', marginTop: isStories ? 8 : 14 }}>
                    <h2 className="font-black leading-[1.02] text-white" style={{ fontSize: isStories ? 76 : 66, textTransform: 'uppercase' as const, textShadow: '4px 4px 16px rgba(0,0,0,0.95)', wordBreak: 'break-word' as const, letterSpacing: '-2px' }}>
                      {displayHeadline}
                    </h2>
                    <div className="px-8 py-2 rounded-full inline-block font-bold text-white" style={{ background: op.corPrimaria, fontSize: isStories ? 32 : 28, marginTop: 4 }}>
                      {displayBadge}
                    </div>
                  </div>
                )}

                {/* ═══ TEMPLATE TABELA: INFO BADGES ABAIXO DO HEADLINE ═══ */}
                {template === 'tabela' && infoBadges.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center" style={{ marginTop: isStories ? 14 : 12 }}>
                    {infoBadges.map((b, i) => (
                      <span key={i} className="flex items-center gap-2 rounded-full text-white font-bold border-2 border-white/40" style={{ fontSize: isStories ? 34 : 32, padding: isStories ? '10px 24px' : '12px 24px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                        <span style={{ fontSize: isStories ? 36 : 36 }}>✓</span> {b}
                      </span>
                    ))}
                  </div>
                )}

                {/* Template BANNER PREÇO (sem tabela, destaque visual máximo) */}
                {template === 'preco' && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-center w-full">
                      {/* Preço grande destaque */}
                      <div className="mb-4">
                        <span className="text-white/60 font-semibold block" style={{ fontSize: isStories ? 40 : 34 }}>
                          A partir de
                        </span>
                        <div className="font-black text-white" style={{ fontSize: isStories ? 160 : 124, lineHeight: 1, textShadow: '4px 4px 20px rgba(0,0,0,0.8)' }}>
                          {faixas[0]?.valor || 'CONSULTE'}
                        </div>
                        <span className="text-white/70 font-bold" style={{ fontSize: isStories ? 36 : 30 }}>
                          {faixas[0]?.faixa ? `por pessoa/mês • Faixa ${faixas[0].faixa}` : 'por pessoa/mês'}
                        </span>
                      </div>
                      {/* Destaque de economia */}
                      <div className="mx-auto rounded-2xl py-4 px-8 inline-block" style={{ background: `${op.corPrimaria}cc`, backdropFilter: 'blur(8px)' }}>
                        <span className="text-white font-black block" style={{ fontSize: isStories ? 48 : 42, letterSpacing: '2px' }}>
                          {displayBadge}
                        </span>
                      </div>
                      {/* Lista de benefícios rápida */}
                      {infoBadges.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-3 mt-6">
                          {infoBadges.map((b, i) => (
                            <span key={i} className="flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold border-2 border-white/40" style={{ fontSize: isStories ? 34 : 28, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                              <span style={{ fontSize: isStories ? 38 : 32 }}>✓</span> {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SPACER para empurrar CTA e footer para baixo */}
                <div className="flex-shrink-0" />

                {/* LOGOS GRANDES — template Hospitais */}
                {template === 'hospitais' && hospitaisExibir.length > 0 && (
                  <div className="my-4">
                    <span className="text-white font-black block text-center mb-4" style={{ fontSize: isStories ? 44 : 38, textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}>
                      {angulo.id === 'rede' ? 'Sua rede inclui:' : 'Rede Credenciada'}
                    </span>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {hospitaisExibir.slice(0, 4).map((h, i) => {
                        const logo = getHospitalLogo(h);
                        return logo ? (
                          <span key={`hl-${i}`} className="bg-white rounded-2xl flex items-center justify-center shadow-xl" style={{ width: isStories ? 310 : 244, height: isStories ? 155 : 122, padding: 14, border: '3px solid rgba(255,255,255,0.3)' }}>
                            <img src={logo} alt={h} crossOrigin="anonymous" style={{ width: isStories ? 280 : 214, height: isStories ? 125 : 92, objectFit: 'contain' }} />
                          </span>
                        ) : null;
                      })}
                    </div>
                    {labsExibir.length > 0 && (
                      <>
                        <span className="text-white/70 font-bold block text-center mt-5 mb-3" style={{ fontSize: isStories ? 36 : 30 }}>
                          Laboratórios
                        </span>
                        <div className="flex flex-wrap gap-4 justify-center">
                          {labsExibir.slice(0, 4).map((l, i) => {
                            const logo = getLabLogo(l);
                            return logo ? (
                              <span key={`ll-${i}`} className="bg-white rounded-2xl flex items-center justify-center shadow-xl" style={{ width: isStories ? 266 : 210, height: isStories ? 133 : 105, padding: 12, border: '3px solid rgba(139,92,246,0.3)' }}>
                                <img src={logo} alt={l} crossOrigin="anonymous" style={{ width: isStories ? 240 : 186, height: isStories ? 108 : 81, objectFit: 'contain' }} />
                              </span>
                            ) : null;
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* REDE CREDENCIADA BADGES - Hospitais e Labs (compact, at bottom) */}
                {template !== 'hospitais' && hospitaisExibir.length > 0 && (() => {
                  const compact = template === 'tabela' && faixasVisiveis.length > 6;
                  const logoW = compact ? (isStories ? 250 : 200) : (isStories ? 260 : 210);
                  const logoH = compact ? (isStories ? 130 : 105) : (isStories ? 140 : 110);
                  const imgW = compact ? (isStories ? 226 : 180) : (isStories ? 236 : 190);
                  const imgH = compact ? (isStories ? 110 : 85) : (isStories ? 118 : 90);
                  return (
                  <div style={{ marginTop: compact ? (isStories ? 18 : 16) : (isStories ? 20 : 16), marginBottom: compact ? (isStories ? 14 : 14) : 16 }}>
                    <span className="text-white/60 font-bold block text-center" style={{ fontSize: compact ? (isStories ? 32 : 28) : (isStories ? 38 : 34), marginBottom: compact ? (isStories ? 10 : 10) : 14 }}>
                      Rede Credenciada{zona ? ` • ${zona.nome}` : ''}
                    </span>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {hospitaisExibir.slice(0, 3).map((h, i) => {
                        const logo = getHospitalLogo(h);
                        return (
                          <span key={`h-${i}`} className="flex items-center justify-center rounded-2xl overflow-hidden" style={{ background: `${op.corPrimaria}bb`, border: `2px solid ${ensureReadable(op.corPrimaria)}44`, backdropFilter: 'blur(8px)', padding: logo ? 0 : undefined }}>
                            {logo ? (
                              <span className="bg-white flex-shrink-0 flex items-center justify-center" style={{ width: logoW, height: logoH, borderRadius: compact ? 12 : 18, padding: compact ? 6 : 10 }}>
                                <img src={logo} alt={h} crossOrigin="anonymous" style={{ width: imgW, height: imgH, objectFit: 'contain', borderRadius: 6 }} />
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 px-5 py-3 text-white font-bold" style={{ fontSize: isStories ? 30 : 24 }}>
                                <span style={{ fontSize: isStories ? 34 : 28 }}>🏥</span> {h}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    {labsExibir.length > 0 && (
                      <div className="flex flex-wrap gap-3 justify-center mt-3">
                        {labsExibir.slice(0, 3).map((l, i) => {
                          const labLogo = getLabLogo(l);
                          return labLogo ? (
                            <span key={`l-${i}`} className="flex items-center justify-center rounded-2xl overflow-hidden" style={{ background: 'rgba(139,92,246,0.45)', border: '2px solid rgba(139,92,246,0.6)' }}>
                              <span className="bg-white flex-shrink-0 flex items-center justify-center" style={{ width: compact ? (isStories ? 210 : 166) : (isStories ? 210 : 170), height: compact ? (isStories ? 110 : 88) : (isStories ? 115 : 92), borderRadius: compact ? 12 : 16, padding: compact ? 6 : 8 }}>
                                <img src={labLogo} alt={l} crossOrigin="anonymous" style={{ width: compact ? (isStories ? 190 : 148) : (isStories ? 190 : 152), height: compact ? (isStories ? 92 : 72) : (isStories ? 96 : 76), objectFit: 'contain', borderRadius: 6 }} />
                              </span>
                            </span>
                          ) : (
                            <span key={`l-${i}`} className="flex items-center gap-2 px-5 py-2 rounded-full text-white/90 font-bold" style={{ fontSize: isStories ? 30 : 24, background: 'rgba(139,92,246,0.5)', border: '2px solid rgba(139,92,246,0.6)' }}>
                              <span style={{ fontSize: isStories ? 32 : 26 }}>🔬</span> {l}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {zona && (
                      <div className="text-center mt-3">
                        <span className="text-white/60 font-bold" style={{ fontSize: isStories ? 28 : 24 }}>
                          📍 Região: {zona.nome}
                        </span>
                      </div>
                    )}
                  </div>
                  );
                })()}

                {/* CTA */}
                <div className="mt-auto" style={{ marginBottom: template === 'tabela' ? (isStories ? 10 : 4) : 16 }}>
                  <div className="text-center rounded-2xl font-black text-white" style={{ background: `linear-gradient(135deg, ${op.corPrimaria}, ${op.corPrimaria}dd)`, fontSize: isStories ? (template === 'tabela' ? 38 : 42) : (template === 'tabela' ? 34 : 36), letterSpacing: '2px', padding: isStories ? (template === 'tabela' ? '20px 24px' : '24px 24px') : (template === 'tabela' ? '18px 20px' : '24px 24px') }}>
                    {cta}
                  </div>
                </div>

                {/* FOOTER: contato */}
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    {customFooter && (
                      <span className="text-white/50 font-bold" style={{ fontSize: isStories ? 26 : 22 }}>
                        {customFooter}
                      </span>
                    )}
                  </div>
                  {(nome || whatsapp) && (
                    <div className="text-right">
                      {nome && <p className="text-white font-bold" style={{ fontSize: isStories ? 34 : 30 }}>{nome}</p>}
                      {whatsapp && <p className="text-white/80 font-bold" style={{ fontSize: isStories ? 32 : 26 }}>📱 {whatsapp}</p>}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Info de tamanho */}
        <div className="text-center">
          <span className="text-gray-500 text-xs">
            Tamanho real: {W}×{H}px ({ratio === '9:16' ? 'Stories/Reels' : 'Feed'}) • {faixas.length} faixas
          </span>
        </div>

        {/* AI Generated Image Result */}
        {aiImageUrl && (
          <div className="bg-[#111] border border-purple-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Versão Gerada por IA
              </h4>
              {aiHistory.length > 1 && (
                <span className="text-purple-400/60 text-[10px] font-medium">
                  Versão {aiHistory.length} de {aiHistory.length}
                </span>
              )}
            </div>

            {/* ═══ Preview Principal ═══ */}
            <div className="relative mx-auto rounded-xl overflow-hidden border-2 border-purple-500/30 cursor-pointer group hover:border-purple-400/60 transition-colors" style={{ width: previewW, maxHeight: previewH + 100 }} onClick={() => setPreviewFullUrl(aiImageUrl)} title="Clique para ver em tamanho real">
              <div className="absolute top-2 left-2 z-10 bg-black/70 text-purple-300 text-[10px] px-2 py-1 rounded-full font-medium">
                {ratio === '9:16' ? '📱 Stories 9:16' : '📐 Feed 4:5'}
              </div>
              <div className="absolute top-2 right-2 z-10 bg-black/60 text-white/70 text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">🔍 Ver tamanho real</div>
              {(aiRefineLoading || aiFormatLoading) && (
                <div className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center gap-3 rounded-xl">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <span className="text-purple-300 text-xs font-medium">{aiFormatLoading ? 'Gerando formato...' : 'Aplicando ajuste...'}</span>
                </div>
              )}
              <img src={aiImageUrl} alt="Banner gerado por IA" className="w-full h-auto rounded-xl" />
            </div>

            {/* ═══ Gerar no outro formato ═══ */}
            <div className="flex gap-2 justify-center">
              {/* Botão Stories */}
              {aiImageUrlStories ? (
                <button onClick={() => setPreviewFullUrl(aiImageUrlStories)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-lg text-[11px] font-medium hover:bg-purple-500/25 transition">
                  📱 Ver Stories
                </button>
              ) : (
                <button onClick={() => generateAiFormat('stories')} disabled={!!aiFormatLoading}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400 rounded-lg text-[11px] hover:border-purple-500/40 hover:text-purple-300 transition disabled:opacity-40">
                  {aiFormatLoading === 'stories' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RectangleVertical className="w-3 h-3" />}
                  {aiFormatLoading === 'stories' ? 'Gerando...' : 'Gerar Stories 9:16'}
                </button>
              )}
              {/* Botão Feed */}
              {aiImageUrlFeed ? (
                <button onClick={() => setPreviewFullUrl(aiImageUrlFeed)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-lg text-[11px] font-medium hover:bg-purple-500/25 transition">
                  📐 Ver Feed
                </button>
              ) : (
                <button onClick={() => generateAiFormat('feed')} disabled={!!aiFormatLoading}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400 rounded-lg text-[11px] hover:border-purple-500/40 hover:text-purple-300 transition disabled:opacity-40">
                  {aiFormatLoading === 'feed' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                  {aiFormatLoading === 'feed' ? 'Gerando...' : 'Gerar Feed 4:5'}
                </button>
              )}
            </div>

            {/* ═══ Assistente de Prompt + Refinamento ═══ */}
            <div className="bg-[#0a0a0a] border border-purple-500/20 rounded-lg p-3 space-y-3">

              {/* ETAPA 1: Descreva sua ideia */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-[11px] font-semibold uppercase tracking-wider">Descreva sua edição</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => aiAttachRef.current?.click()}
                    disabled={aiRefineLoading || aiOptimizing}
                    className="px-2.5 py-2.5 border border-gray-700 text-gray-400 rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition disabled:opacity-40 shrink-0"
                    title="Anexar imagem (logo, foto, etc.)"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <input
                    value={aiUserIdea}
                    onChange={(e) => setAiUserIdea(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); optimizePrompt(); } }}
                    placeholder="Descreva o que quer mudar... Ex: quero a logo maior, mudar cor de fundo para azul"
                    disabled={aiRefineLoading || aiOptimizing}
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 outline-none disabled:opacity-50 transition"
                  />
                  <button
                    onClick={optimizePrompt}
                    disabled={!aiUserIdea.trim() || aiOptimizing || aiRefineLoading}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#b8960c] text-black rounded-lg font-bold text-xs hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                    title="A IA vai gerar o prompt técnico ideal"
                  >
                    {aiOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    Gerar Prompt
                  </button>
                </div>
                <input ref={aiAttachRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleAiAttachment(e.target.files[0]); e.target.value = ''; }} />

                {/* Anexo preview */}
                {aiAttachment && (
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 mt-2">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden border border-purple-500/30 shrink-0">
                      <img src={aiAttachment} alt="Anexo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-purple-300 text-[11px] font-medium truncate">{aiAttachmentName}</p>
                      <p className="text-purple-400/50 text-[9px]">Será enviada junto com o ajuste</p>
                    </div>
                    <button onClick={() => { setAiAttachment(''); setAiAttachmentName(''); }}
                      className="p-1 hover:bg-purple-500/20 rounded-full transition shrink-0" title="Remover anexo">
                      <X className="w-3.5 h-3.5 text-purple-400" />
                    </button>
                  </div>
                )}

                {/* Sugestões rápidas */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Colocar a logo que anexei', 'Deixar o preço maior', 'Mudar fundo para mais escuro', 'Mais clean e minimalista', 'Destacar nome do plano'].map((sug) => (
                    <button key={sug} onClick={() => { setAiUserIdea(sug); }}
                      className="px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]/80 rounded-md text-[10px] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition">
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* ETAPA 2: Prompt otimizado — revise e execute */}
              {aiOptimizedPrompt && (
                <div className="border-t border-purple-500/20 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-purple-300 text-[11px] font-semibold uppercase tracking-wider">Prompt Otimizado</span>
                    <span className="text-green-400 text-[9px] bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">✓ Pronto para executar</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={aiRefinePrompt}
                      onChange={(e) => setAiRefinePrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); refineAiImage(); } }}
                      disabled={aiRefineLoading}
                      className="flex-1 bg-[#1a1a1a] border border-purple-500/30 rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none disabled:opacity-50 transition"
                    />
                    <button
                      onClick={refineAiImage}
                      disabled={!aiRefinePrompt.trim() || aiRefineLoading}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-xs hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                      title="Executar o ajuste"
                    >
                      {aiRefineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Executar
                    </button>
                  </div>
                  <p className="text-gray-500 text-[9px] mt-1">💡 Revise o prompt se quiser, depois clique em Executar ou pressione Enter</p>
                </div>
              )}
            </div>

            {/* ═══ Botões de Ação ═══ */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => {
                const a = document.createElement('a');
                a.href = aiImageUrl;
                a.download = `banner-ia-${op.id}-${angulo.id}-${ratio === '9:16' ? 'stories' : 'feed'}-${Date.now()}.png`;
                a.click();
                toast.success('Download da versão IA iniciado!');
              }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium text-xs hover:opacity-90 transition">
                <Download className="w-3 h-3" /> Baixar {ratio === '9:16' ? 'Stories' : 'Feed'}
              </button>
              {aiImageUrlStories && ratio !== '9:16' && (
                <button onClick={() => {
                  const a = document.createElement('a');
                  a.href = aiImageUrlStories;
                  a.download = `banner-ia-${op.id}-${angulo.id}-stories-${Date.now()}.png`;
                  a.click();
                }} className="px-3 py-2 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:border-purple-400 transition flex items-center gap-1.5">
                  <Download className="w-3 h-3" /> Stories
                </button>
              )}
              {aiImageUrlFeed && ratio === '9:16' && (
                <button onClick={() => {
                  const a = document.createElement('a');
                  a.href = aiImageUrlFeed;
                  a.download = `banner-ia-${op.id}-${angulo.id}-feed-${Date.now()}.png`;
                  a.click();
                }} className="px-3 py-2 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:border-purple-400 transition flex items-center gap-1.5">
                  <Download className="w-3 h-3" /> Feed
                </button>
              )}
              {aiHistory.length > 1 && (
                <button onClick={undoAiImage}
                  className="px-3 py-2 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:border-purple-400 hover:text-purple-300 transition flex items-center gap-1.5"
                  title="Voltar para versão anterior">
                  <Undo2 className="w-3 h-3" /> Desfazer
                </button>
              )}
              <button onClick={saveAiImage} disabled={aiSaving || !!aiSavedUrl}
                className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5"
                title="Salvar na galeria">
                {aiSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                {aiSavedUrl ? '✅ Salvo' : aiSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => { setAiImageUrl(''); setAiHistory([]); setAiRefinePrompt(''); setAiAttachment(''); setAiAttachmentName(''); setAiUserIdea(''); setAiOptimizedPrompt(''); setAiImageUrlFeed(''); setAiImageUrlStories(''); setAiSavedUrl(''); }}
                className="px-3 py-2 border border-gray-700 text-gray-400 rounded-lg text-xs hover:border-gray-500 transition">
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════ MODAL PREVIEW TAMANHO REAL ════════ */}
      {previewFullUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewFullUrl('')}>
          <div className="relative max-w-full max-h-full overflow-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewFullUrl('')}
              className="sticky top-2 float-right z-10 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold border border-white/20 hover:border-white/50 transition-all shadow-xl mr-2 mt-2">
              ✕
            </button>
            <img src={previewFullUrl} alt="Preview tamanho real" style={{ maxHeight: '95vh', width: 'auto' }} className="rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
