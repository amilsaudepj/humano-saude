'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Calculator,
  TrendingDown,
  Users,
  DollarSign,
  Phone,
  CheckCircle,
  Loader2,
  Plus,
  X,
  ArrowRight,
  Shield,
  Sparkles,
  Search,
  Camera,
  AlertCircle,
  Building2,
  User,
  Lock,
  Star,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mail,
  Heart,
  FileCheck,
  Info,
  Eye,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import styles from './CalculadoraEconomia.module.css';
import {
  salvarLeadIndicacao,
  marcarClicouContato,
} from '@/app/actions/leads-indicacao';
import { saveCalculadoraLead } from '@/app/actions/leads';
import type { CorretorPublico } from '@/app/actions/leads-indicacao';

// =============================================
// TIPOS
// =============================================

interface DadosFatura {
  operadora: string | null;
  plano: string | null;
  valor_total: number | null;
  beneficiarios: number | null;
  titular: string | null;
  razao_social: string | null;
  documento: string | null;
  tipo_pessoa: 'PF' | 'PJ' | null;
  faixas_etarias: string[] | null;
}

interface ResultadoSimulacao {
  valorAtual: number;
  propostas: PropostaResultado[];
  qtdVidas: number;
  modalidade: string;
}

interface PropostaResultado {
  operadora_id: string;
  operadora_nome: string;
  plano_nome: string;
  logo: string;
  valor_total: number;
  valores_por_faixa: { faixa: string; valor: number }[];
  coparticipacao: boolean;
  coparticipacao_pct?: number;
  abrangencia: string;
  rede_hospitalar: string[];
  economia_valor: number;
  economia_pct: number;
  notas: string | null;
}

type Etapa = 'upload' | 'dados' | 'resultado' | 'documentos';

// =============================================
// FAIXAS ETÁRIAS PADRÃO ANS
// =============================================

const FAIXAS_IDADE = [
  '0-18', '19-23', '24-28', '29-33', '34-38',
  '39-43', '44-48', '49-53', '54-58', '59+',
];

// =============================================
// DEPOIMENTOS (PROVA SOCIAL)
// =============================================

const DEPOIMENTOS = [
  {
    nome: 'Marcela Ribeiro',
    cargo: 'Empresária',
    segmento: 'Clínica Odontológica',
    texto: 'Economizei mais de R$ 1.200/mês no plano dos meus 8 funcionários! A equipe da Humano Saúde cuidou de toda a migração sem dor de cabeça nenhuma.',
    estrelas: 5,
    avatar: '👩‍💼',
  },
  {
    nome: 'Carlos Eduardo Santos',
    cargo: 'Diretor Financeiro',
    segmento: 'Escritório Contábil',
    texto: 'Reduzi 35% do valor que pagava na SulAmérica e ainda melhorei a cobertura. Atendimento impecável e processo super rápido.',
    estrelas: 5,
    avatar: '👨‍💼',
  },
  {
    nome: 'Fernanda Almeida',
    cargo: 'Pessoa Física',
    segmento: 'Família com 4 vidas',
    texto: 'Pagava R$ 3.800 de plano familiar e consegui reduzir para R$ 2.400 mantendo todos os hospitais que uso. Recomendo demais!',
    estrelas: 5,
    avatar: '👩‍👧‍👦',
  },
  {
    nome: 'Roberto Mendes',
    cargo: 'Sócio',
    segmento: 'Advocacia',
    texto: 'A análise gratuita já valeu a pena. Descobri que estava pagando a mais por coberturas que nem usava. Migrei sem perder carência.',
    estrelas: 5,
    avatar: '👨‍⚖️',
  },
  {
    nome: 'Patrícia Lopes',
    cargo: 'RH Manager',
    segmento: 'Startup de Tecnologia',
    texto: 'Eles encontraram um plano PME incrível para minha equipe de 15 pessoas. Economizamos quase R$ 4.000/mês no total!',
    estrelas: 5,
    avatar: '👩‍💻',
  },
  {
    nome: 'André Oliveira',
    cargo: 'Autônomo',
    segmento: 'Arquitetura e Design',
    texto: 'Como profissional liberal, achava impossível ter um bom plano de saúde pagando pouco. A Humano Saúde me mostrou opções que eu nem sabia que existiam.',
    estrelas: 5,
    avatar: '👷‍♂️',
  },
];

// =============================================
// TIPOS DE DOCUMENTOS
// =============================================

interface DocumentoUpload {
  id: string;
  label: string;
  descricao: string;
  nota?: string;
  arquivo: File | null;
  previewUrl: string | null;
  obrigatorio: boolean;
  apenasPJ?: boolean;
}

const DOCUMENTOS_INICIAIS: DocumentoUpload[] = [
  { id: 'identidade', label: 'Identidade (RG/CNH)', descricao: 'Frente e verso', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'cpf', label: 'CPF', descricao: 'Documento do CPF', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'comprovante_residencia', label: 'Comprovante de Residência', descricao: 'Conta de luz, água ou telefone', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'estado_civil', label: 'Comprovante de Estado Civil', descricao: 'Certidão de nascimento/casamento', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'certidao_casamento', label: 'Certidão de Casamento', descricao: 'Se aplicável', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'certidao_nascimento', label: 'Certidão de Nascimento', descricao: 'Dos dependentes menores', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'carteirinha_plano', label: 'Carteirinha do Plano Atual', descricao: 'Foto da carteirinha frente/verso', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'carta_permanencia', label: 'Carta de Permanência', descricao: 'Do plano atual', nota: 'Não tem? Providenciamos para você!', arquivo: null, previewUrl: null, obrigatorio: false },
  { id: 'contrato_social', label: 'Contrato Social', descricao: 'Obrigatório para empresas', arquivo: null, previewUrl: null, obrigatorio: false, apenasPJ: true },
];

// =============================================
// CARD 2 — Sequência animada: lupa na fatura → empresas → redução encontrada
// =============================================

function Card2Animacao({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setPhase((p) => (p + 1) % 3), 2600);
    return () => clearInterval(t);
  }, [active]);
  useEffect(() => {
    if (active) setPhase(0);
  }, [active]);

  return (
    <motion.div
      className="relative w-28 h-36 sm:w-28 sm:h-36 md:w-32 md:h-40 lg:w-36 lg:h-44 rounded-xl bg-gradient-to-br from-[#9b7316]/15 to-[#9b7316]/5 border border-[#9b7316]/30 shadow-xl shadow-[#9b7316]/10 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#9b7316]/12 to-transparent" />
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2">
        <AnimatePresence mode="wait">
          {/* Fase 1: Lupa escaneando a fatura */}
          {phase === 0 && (
            <motion.div
              key="lupa"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            >
              <div className="relative">
                <FileText className="h-8 w-8 sm:h-9 sm:w-9 text-[#8a650c]/70" strokeWidth={1.5} />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ x: -12 }}
                  animate={{ x: 12 }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.3, ease: 'easeInOut' }}
                >
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-[#8a650c]" strokeWidth={2.5} />
                </motion.div>
              </div>
              <span className="text-[11px] sm:text-xs text-[#8a650c] font-bold text-center leading-tight">IA analisando</span>
            </motion.div>
          )}
          {/* Fase 2: Empresas aparecendo */}
          {phase === 1 && (
            <motion.div
              key="empresas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            >
              <div className="flex items-end gap-0.5 sm:gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.4 }}
                  >
                    <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-[#8a650c]" strokeWidth={1.8} />
                  </motion.div>
                ))}
              </div>
              <span className="text-[11px] sm:text-xs text-[#8a650c] font-bold text-center">Operadoras</span>
            </motion.div>
          )}
          {/* Fase 3: Redução encontrada */}
          {phase === 2 && (
            <motion.div
              key="reducao"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xs sm:text-sm text-[#8a650c] font-bold text-center leading-tight block"
              >
                Redução<br />encontrada
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="text-base sm:text-lg font-black text-[#17663b]"
              >
                -35%
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-[#8a650c]/45 opacity-50" />
      <div className="absolute bottom-8 left-3 h-1 w-1 rounded-full bg-[#8a650c]/35 opacity-50" />
    </motion.div>
  );
}

// =============================================
// CARD 3 — Economia com animação de redução
// =============================================

const ECONOMIA_PCT_FINAL = 40;
const ECONOMIA_DURATION_MS = 2200; // subida suave até 40% em 2.2s
const ECONOMIA_TICK_MS = 55;       // atualiza a cada ~55ms

function Card3EconomiaAnimacao({ active }: { active: boolean }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!active) {
      setPct(0);
      return;
    }
    setPct(0);
    const steps = Math.ceil(ECONOMIA_DURATION_MS / ECONOMIA_TICK_MS);
    const stepValue = ECONOMIA_PCT_FINAL / steps;
    let step = 0;
    const t = setInterval(() => {
      step += 1;
      const value = Math.min(
        ECONOMIA_PCT_FINAL,
        Math.round(step * stepValue),
      );
      setPct(value);
      if (value >= ECONOMIA_PCT_FINAL) clearInterval(t);
    }, ECONOMIA_TICK_MS);
    return () => clearInterval(t);
  }, [active]);

  return (
    <motion.div
      className="relative w-28 h-36 sm:w-28 sm:h-36 md:w-32 md:h-40 lg:w-36 lg:h-44 rounded-xl bg-gradient-to-br from-[#0d5c34]/20 to-[#0d5c34]/8 border border-[#17663b]/40 shadow-xl shadow-[#17663b]/10 flex flex-col items-center justify-center gap-2 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d5c34]/15 to-transparent" />
      {/* Ícone seta para baixo — redução */}
      <div className="relative z-10 flex flex-col items-center gap-0.5">
        <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 text-[#0d5c34]" strokeWidth={2.5} />
        <span className="text-xs sm:text-sm font-bold text-[#0d5c34] tracking-tight">Economia</span>
      </div>
      {/* Destaque: percentual em pill — sem key para não piscar; número sobe suave */}
      <motion.div
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 px-3 py-1.5 rounded-lg bg-[#0d5c34]/25 border border-[#0d5c34]/40"
      >
        <span className="text-lg sm:text-xl font-black tabular-nums text-[#0d5c34] leading-none transition-opacity duration-75">
          -{active ? pct : 0}%
        </span>
      </motion.div>
      {/* Barra sutil de redução (opcional, mais discreta) */}
      <div className="relative z-10 w-full px-3">
        <div className="h-1 w-full rounded-full bg-[#0d5c34]/15 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#0d5c34]/40"
            initial={{ width: '100%' }}
            animate={active ? { width: ['100%', '65%', '100%'] } : { width: '100%' }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================

export default function CalculadoraEconomia({
  corretor,
}: {
  corretor?: CorretorPublico;
}) {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [uploading, setUploading] = useState(false);
  const [calculando, setCalculando] = useState(false);

  // Fase dos cards do hero (0 → 1 → 2 → 0): efeito de carregamento em sequência
  // Fase 2 (último card) dura mais para “demorar um pouco mais pra recomeçar o looping”
  const [heroPhase, setHeroPhase] = useState(0);
  useEffect(() => {
    const delays = [2500, 2500, 6800]; // ms: card 1, card 2, card 3 (último demora mais a mudar)
    const phaseRef = { current: 0 };
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeoutId = setTimeout(() => {
        phaseRef.current = (phaseRef.current + 1) % 3;
        setHeroPhase(phaseRef.current);
        schedule();
      }, delays[phaseRef.current]);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  // Progresso OCR
  const [ocrProgresso, setOcrProgresso] = useState(0);
  const [ocrEtapa, setOcrEtapa] = useState('');

  // Dados da fatura (OCR ou manual)
  const [dadosFatura, setDadosFatura] = useState<DadosFatura>({
    operadora: null,
    plano: null,
    valor_total: null,
    beneficiarios: null,
    titular: null,
    razao_social: null,
    documento: null,
    tipo_pessoa: null,
    faixas_etarias: null,
  });

  // Input manual
  const [valorManual, setValorManual] = useState('');
  const [operadoraManual, setOperadoraManual] = useState('');
  const [idades, setIdades] = useState<string[]>([]);
  const [novaIdade, setNovaIdade] = useState('');

  // Lead data
  const [nome, setNome] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  // Resultado
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [contatoClicado, setContatoClicado] = useState(false);

  // Preview da imagem da fatura
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Arquivo da fatura para enviar ao admin
  const [faturaFile, setFaturaFile] = useState<File | null>(null);

  // Câmera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const valorRef = useRef<HTMLDivElement>(null);
  const idadesRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLDivElement>(null);
  const telefoneRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Tipo pessoa (PF/PJ)
  const [tipoPessoa, setTipoPessoa] = useState<'PF' | 'PJ'>('PF');

  // Carrossel depoimentos
  const [depoimentoIndex, setDepoimentoIndex] = useState(0);

  // Documentos para adesão
  const [documentos, setDocumentos] = useState<DocumentoUpload[]>(DOCUMENTOS_INICIAIS);
  const [enviadoDocumentos, setEnviadoDocumentos] = useState(false);

  // ─── CÂMERA ──────────────────────────────────

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        setCameraError('Erro ao iniciar o vídeo da câmera.');
      });
    }
  }, [cameraActive]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `fatura_foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
          stopCamera();
          handleUpload(file);
        }
      },
      'image/jpeg',
      0.92,
    );
  };

  // ─── CARROSSEL DEPOIMENTOS ──────────────────
  const totalPages = Math.ceil(DEPOIMENTOS.length / 3);

  useEffect(() => {
    const interval = setInterval(() => {
      setDepoimentoIndex((prev) => (prev + 1) % totalPages);
    }, 8000);
    return () => clearInterval(interval);
  }, [totalPages]);

  // ─── COMPRESSÃO DE IMAGEM ────────────────────
  const compressImage = useCallback((file: File, maxWidth = 1600, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      // Se não é imagem, retorna sem comprimir
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Redimensionar se necessário
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressed = new File([blob], file.name, { type: 'image/jpeg' });
                console.log(`[Compress] ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`);
                resolve(compressed);
              } else {
                resolve(file); // Original é menor, mantém
              }
            },
            'image/jpeg',
            quality,
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }, []);

  // ─── CONVERSOR PDF → IMAGEM (preview via CDN) ────────
  const pdfToPreviewImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      // Carregar pdf.js via CDN (não precisa de dependência instalada)
      const PDFJS_VERSION = '4.8.69';
      const cdnBase = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjsLib = (window as any).pdfjsLib || await new Promise<any>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${cdnBase}/pdf.min.mjs`;
        script.type = 'module';
        // Fallback: usar versão não-module
        const scriptFallback = document.createElement('script');
        scriptFallback.src = `${cdnBase}/pdf.min.js`;
        scriptFallback.onload = () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lib = (window as any).pdfjsLib;
          if (lib) {
            lib.GlobalWorkerOptions.workerSrc = `${cdnBase}/pdf.worker.min.js`;
            resolve(lib);
          } else {
            reject(new Error('pdf.js não carregou'));
          }
        };
        scriptFallback.onerror = reject;
        document.head.appendChild(scriptFallback);
      });

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx as any, viewport } as any).promise;

      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      console.error('[PDF Preview] Erro ao converter:', err);
      return null;
    }
  }, []);

  // ─── UPLOAD E OCR ────────────────────────────

  const handleUpload = useCallback(async (originalFile: File) => {
    setUploading(true);
    setOcrProgresso(0);

    const isPDF = originalFile.type === 'application/pdf' || originalFile.name.toLowerCase().endsWith('.pdf');

    // Gerar preview
    if (!isPDF) {
      setPreviewUrl(URL.createObjectURL(originalFile));
    } else {
      // Converter primeira página do PDF para imagem
      setOcrEtapa('📄 Convertendo PDF para preview...');
      const pdfPreview = await pdfToPreviewImage(originalFile);
      setPreviewUrl(pdfPreview);
    }

    // Comprimir imagem (PDF passa direto sem compressão)
    let file: File;
    if (isPDF) {
      setOcrEtapa('📄 PDF detectado, enviando...');
      file = originalFile;
    } else {
      setOcrEtapa('📷 Otimizando imagem...');
      file = await compressImage(originalFile);
      if (file.size < originalFile.size) {
        const reduction = ((1 - file.size / originalFile.size) * 100).toFixed(0);
        console.log(`[Compress] Reduzido ${reduction}%: ${(originalFile.size / 1024).toFixed(0)}KB -> ${(file.size / 1024).toFixed(0)}KB`);
      }
    }

        // Animação de progresso
    const progressSteps = isPDF
      ? [
          { pct: 15, label: '📄 PDF recebido!' },
          { pct: 35, label: '📖 Lendo o documento...' },
          { pct: 55, label: '📊 Extraindo operadora e valores...' },
          { pct: 75, label: '🧑‍💼 Identificando beneficiários...' },
          { pct: 90, label: '✅ Quase pronto...' },
        ]
      : [
          { pct: 15, label: '📷 Imagem recebida!' },
          { pct: 35, label: '🔍 Lendo a fatura...' },
          { pct: 55, label: '📊 Extraindo operadora e valores...' },
          { pct: 75, label: '🧑‍💼 Identificando beneficiários...' },
          { pct: 90, label: '✅ Quase pronto...' },
        ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setOcrProgresso(progressSteps[stepIndex].pct);
        setOcrEtapa(progressSteps[stepIndex].label);
        stepIndex++;
      }
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('fatura', file);
      // Guardar arquivo para enviar ao admin depois
      setFaturaFile(file);

      console.log(`[Upload] Enviando: ${file.name}, size: ${(file.size / 1024).toFixed(0)}KB, type: ${file.type}`);

      const res = await fetch('/api/calculadora/ocr', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      let data: { success: boolean; dados?: DadosFatura; error?: string };
      if (!res.ok) {
        let errorMsg = 'Erro ao processar a fatura.';
        try { const errData = await res.json(); errorMsg = errData.error || errorMsg; } catch { /* */ }
        data = { success: false, error: errorMsg };
      } else {
        data = await res.json();
      }

      console.log('[Upload] Response:', data.success ? '✅' : '❌', JSON.stringify(data).substring(0, 300));
      setOcrProgresso(100);

      if (data.success && data.dados) {
        setOcrEtapa('✅ Dados extraídos com sucesso!');
        setDadosFatura(data.dados);
        if (data.dados.valor_total) {
          setValorManual(
            Number(data.dados.valor_total).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          );
        }
        if (data.dados.operadora) {
          const listaOperadoras = [
            'Amil', 'Bradesco Saúde', 'SulAmérica', 'Unimed',
            'Porto Saúde', 'Prevent Senior', 'MedSênior',
            'Assim Saúde', 'Golden Cross', 'Outro',
          ];
          const operadoraDetectada = data.dados.operadora;
          const match = listaOperadoras.find(
            (op) => operadoraDetectada.toLowerCase().includes(op.toLowerCase()) ||
                    op.toLowerCase().includes(operadoraDetectada.toLowerCase())
          );
          setOperadoraManual(match || operadoraDetectada);
        }
        if (data.dados.faixas_etarias && Array.isArray(data.dados.faixas_etarias) && data.dados.faixas_etarias.length > 0) {
          setIdades(data.dados.faixas_etarias);
        } else if (data.dados.beneficiarios && data.dados.beneficiarios > 0) {
          const idadesDefault = Array(data.dados.beneficiarios).fill('29-33');
          setIdades(idadesDefault);
        }
        if (data.dados.tipo_pessoa === 'PF' || data.dados.tipo_pessoa === 'PJ') {
          setTipoPessoa(data.dados.tipo_pessoa);
        }
        if (data.dados.titular || data.dados.razao_social) {
          setNome(data.dados.razao_social || data.dados.titular || '');
        }
        toast.success('Dados extraídos com sucesso!');
        setTimeout(() => {
          setUploading(false);
          setEtapa('dados');
        }, 1500);
      } else {
        const errorMsg = data.error || 'Não foi possível ler a fatura automaticamente.';
        setOcrEtapa('⚠️ Não conseguiu ler — preencha manualmente');
        toast.error(errorMsg, { duration: 5000 });
        setTimeout(() => {
          setUploading(false);
          setPreviewUrl(null);
          setOcrProgresso(0);
          setOcrEtapa('');
          setEtapa('dados');
          toast.info('Preencha os dados manualmente abaixo', { duration: 4000 });
        }, 2500);
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error('[Upload] Erro:', err);
      setOcrProgresso(100);
      setOcrEtapa('⚠️ Erro de conexão');
      toast.error('Erro ao processar fatura. Tente novamente ou preencha manualmente.', { duration: 5000 });
      setTimeout(() => {
        setUploading(false);
        setPreviewUrl(null);
        setOcrProgresso(0);
        setOcrEtapa('');
        setEtapa('dados');
        toast.info('Preencha os dados manualmente abaixo', { duration: 4000 });
      }, 2500);
    }
  }, [compressImage, pdfToPreviewImage]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  // ─── IDADES ─────────────────────────────────

  const adicionarIdade = () => {
    if (novaIdade && idades.length < 20) {
      setIdades((prev) => [...prev, novaIdade]);
      setNovaIdade('');
    }
  };

  const removerIdade = (index: number) => {
    setIdades((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── CALCULAR ───────────────────────────────

  const scrollToField = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Shake animation via temporary class
    ref.current?.classList.add('animate-shake');
    setTimeout(() => ref.current?.classList.remove('animate-shake'), 600);
  };

  const calcular = async () => {
    // Parse formato brasileiro: 2.251,38 → remove pontos de milhar, troca vírgula por ponto
    const valorLimpo = valorManual.replace(/[^\d.,]/g, '');
    const valor = parseFloat(
      valorLimpo.includes(',')
        ? valorLimpo.replace(/\./g, '').replace(',', '.')
        : valorLimpo
    );
    if (!valor || valor <= 0) {
      toast.error('Informe o valor atual da mensalidade');
      scrollToField(valorRef);
      return;
    }
    if (idades.length === 0) {
      toast.error('Adicione pelo menos uma faixa etária');
      scrollToField(idadesRef);
      return;
    }
    if (!nomeResponsavel.trim()) {
      toast.error('Informe o nome do responsável');
      scrollToField(nomeRef);
      return;
    }
    const telDigits = telefone.replace(/\D/g, '');
    if (!telefone.trim() || telDigits.length < 10 || telDigits.length > 11) {
      toast.error('Informe um WhatsApp válido com DDD');
      scrollToField(telefoneRef);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      toast.error('Informe um e-mail válido');
      scrollToField(emailRef);
      return;
    }

    setCalculando(true);

    try {
      const simRes = await fetch('/api/calculadora/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_atual: valor,
          operadora_atual: operadoraManual || dadosFatura.operadora || null,
          idades,
          tipo_pessoa: tipoPessoa,
        }),
      });

      const simData = await simRes.json();

      if (simData.success && simData.propostas?.length > 0) {
        const res: ResultadoSimulacao = {
          valorAtual: valor,
          propostas: simData.propostas,
          qtdVidas: simData.qtd_vidas,
          modalidade: simData.modalidade,
        };
        setResultado(res);
      } else {
        const propostas: PropostaResultado[] = [
          {
            operadora_id: 'porto',
            operadora_nome: 'Porto Saúde',
            plano_nome: 'Plano estimado',
            logo: '/images/operadoras/portosaude-logo.png',
            valor_total: Math.round(valor * 0.65 * 100) / 100,
            valores_por_faixa: [],
            coparticipacao: false,
            abrangencia: 'RJ',
            rede_hospitalar: [],
            economia_valor: Math.round(valor * 0.35 * 100) / 100,
            economia_pct: 35,
            notas: 'Estimativa sujeita à análise',
          },
          {
            operadora_id: 'sulamerica',
            operadora_nome: 'SulAmérica',
            plano_nome: 'Plano estimado',
            logo: '/images/operadoras/sulamerica-logo.png',
            valor_total: Math.round(valor * 0.72 * 100) / 100,
            valores_por_faixa: [],
            coparticipacao: false,
            abrangencia: 'Nacional',
            rede_hospitalar: [],
            economia_valor: Math.round(valor * 0.28 * 100) / 100,
            economia_pct: 28,
            notas: 'Estimativa sujeita à análise',
          },
          {
            operadora_id: 'amil',
            operadora_nome: 'Amil',
            plano_nome: 'Plano estimado',
            logo: '/images/operadoras/amil-logo.png',
            valor_total: Math.round(valor * 0.78 * 100) / 100,
            valores_por_faixa: [],
            coparticipacao: false,
            abrangencia: 'Nacional',
            rede_hospitalar: [],
            economia_valor: Math.round(valor * 0.22 * 100) / 100,
            economia_pct: 22,
            notas: 'Estimativa sujeita à análise',
          },
        ];
        setResultado({
          valorAtual: valor,
          propostas,
          qtdVidas: idades.length,
          modalidade: tipoPessoa === 'PJ' ? 'PME' : 'PF',
        });
      }

      const bestEconomia = simData.propostas?.[0]?.economia_valor || Math.round(valor * 0.3 * 100) / 100;
      const leadResult = await salvarLeadIndicacao({
        corretor_id: corretor?.id,
        nome: nomeResponsavel || nome || null as unknown as undefined,
        email: email || null as unknown as undefined,
        telefone: telefone || null as unknown as undefined,
        operadora_atual: operadoraManual || dadosFatura.operadora || null as unknown as undefined,
        plano_atual: dadosFatura.plano || null as unknown as undefined,
        valor_atual: valor,
        qtd_vidas: idades.length,
        idades,
        valor_estimado_min: simData.propostas?.[0]?.valor_total || Math.round(valor * 0.65 * 100) / 100,
        valor_estimado_max: simData.propostas?.[simData.propostas.length - 1]?.valor_total || Math.round(valor * 0.78 * 100) / 100,
        economia_estimada: bestEconomia,
        origem: corretor ? 'link_corretor' : 'trafego_pago',
        metadata: {
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          tipo_pessoa: tipoPessoa,
        },
      });

      if (leadResult.success && leadResult.lead_id) {
        setLeadId(leadResult.lead_id);
      }

      // ═══ SALVAR TAMBÉM NO INSURANCE_LEADS (Painel Admin) com TODOS os dados ═══
      try {
        // Upload da fatura original para Storage (admin precisa ver)
        let faturaUrl: string | null = null;
        if (faturaFile) {
          try {
            const faturaFormData = new FormData();
            faturaFormData.append('fatura', faturaFile);
            faturaFormData.append('telefone', telefone.replace(/\D/g, ''));
            const uploadRes = await fetch('/api/calculadora/fatura-upload', {
              method: 'POST',
              body: faturaFormData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success) faturaUrl = uploadData.url;
          } catch (e) {
            console.warn('[Calculadora] Falha upload fatura:', e);
          }
        }

        const resultadoCompleto = resultado || (simData.success ? {
          valorAtual: valor,
          propostas: simData.propostas,
          qtdVidas: simData.qtd_vidas,
          modalidade: simData.modalidade,
        } : null);

        const adminResult = await saveCalculadoraLead({
          nome: nomeResponsavel || nome || 'Lead Calculadora',
          telefone,
          email: email || undefined,
          operadora_atual: operadoraManual || dadosFatura.operadora || undefined,
          valor_atual: valor,
          idades,
          economia_estimada: bestEconomia,
          valor_proposto: simData.propostas?.[0]?.valor_total || undefined,
          tipo_pessoa: tipoPessoa,
          plano_atual: dadosFatura.plano || undefined,
          corretor_slug: corretor?.slug || undefined,
          corretor_id: corretor?.id || undefined,
          // ═══ TUDO para o admin ═══
          dados_ocr: {
            ...dadosFatura,
            fatura_url: faturaUrl,
            preview_url: previewUrl,
          },
          resultado_simulacao: resultadoCompleto ? {
            valorAtual: resultadoCompleto.valorAtual,
            qtdVidas: resultadoCompleto.qtdVidas,
            modalidade: resultadoCompleto.modalidade,
          } : undefined,
          propostas: resultadoCompleto?.propostas?.map((p: PropostaResultado) => ({
            operadora_id: p.operadora_id,
            operadora_nome: p.operadora_nome,
            plano_nome: p.plano_nome,
            valor_total: p.valor_total,
            economia_valor: p.economia_valor,
            economia_pct: p.economia_pct,
            coparticipacao: p.coparticipacao,
            abrangencia: p.abrangencia,
            rede_hospitalar: p.rede_hospitalar,
            notas: p.notas,
          })) || undefined,
        });
        // Usar o ID do insurance_leads para vincular documentos
        if (adminResult.success && adminResult.lead_id) {
          setLeadId(adminResult.lead_id);
        }
      } catch (e) {
        console.warn('[Calculadora] Falha ao salvar no insurance_leads (admin):', e);
      }
    } catch {
      toast.error('Erro ao calcular. Tente novamente.');
    }

    setCalculando(false);
    setEtapa('resultado');

    // Auto-scroll para o resultado — aguarda AnimatePresence renderizar
    const tryScroll = (attempts = 0) => {
      if (resultadoRef.current) {
        resultadoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 10) {
        requestAnimationFrame(() => tryScroll(attempts + 1));
      } else {
        // Fallback: scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    setTimeout(() => tryScroll(), 100);
  };

  // ─── DOCUMENTOS ─────────────────────────────

  const handleDocumentoUpload = (docId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setDocumentos((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, arquivo: file, previewUrl: url } : d,
      ),
    );
    toast.success(`${file.name} anexado com sucesso`);
  };

  const removerDocumento = (docId: string) => {
    setDocumentos((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, arquivo: null, previewUrl: null } : d,
      ),
    );
  };

  const enviarDocumentos = async () => {
    const docsAnexados = documentos.filter((d) => d.arquivo);
    if (docsAnexados.length === 0) {
      toast.info('Nenhum documento anexado. Você pode enviar depois.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('lead_id', leadId || '');
      formData.append('telefone', telefone || '');
      formData.append('nome', nomeResponsavel || nome || '');

      for (const doc of docsAnexados) {
        if (doc.arquivo) {
          formData.append(`doc_${doc.id}`, doc.arquivo);
        }
      }

      const res = await fetch('/api/calculadora/documentos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`${data.quantidade} documento(s) enviado(s) com sucesso! Nossa equipe entrará em contato.`);
        setEnviadoDocumentos(true);
      } else {
        toast.error(data.error || 'Erro ao enviar documentos. Tente novamente.');
      }
    } catch {
      toast.error('Erro ao enviar documentos. Tente novamente.');
    }
  };

  // ─── CONTATO WHATSAPP ────────────────────────

  const handleContatoWhatsApp = async () => {
    if (leadId && !contatoClicado) {
      await marcarClicouContato(leadId);
      setContatoClicado(true);
    }

    const melhorProposta = resultado?.propostas?.[0];
    const valorAtualStr = resultado?.valorAtual ? formatCurrency(resultado.valorAtual) : '';
    const msg = encodeURIComponent(
      `Olá! Fiz uma simulação e gostaria de saber mais sobre como economizar no meu plano de saúde. Meu valor atual é ${valorAtualStr}${melhorProposta ? ` e encontrei economia de até ${melhorProposta.economia_pct}% com ${melhorProposta.operadora_nome}` : ''}.`,
    );
    window.open(`https://wa.me/5521988179407?text=${msg}`, '_blank');
  };

  const handleContatoTelefone = async () => {
    if (leadId && !contatoClicado) {
      await marcarClicouContato(leadId);
      setContatoClicado(true);
    }

    window.open('tel:+5521988179407', '_self');
  };

  // ─── FORMATAÇÃO ──────────────────────────────

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Documentos filtrados por tipo pessoa
  const documentosFiltrados = documentos.filter(
    (d) => !d.apenasPJ || tipoPessoa === 'PJ',
  );

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className={cn('min-h-screen bg-white text-slate-900', styles.lightTheme)}>
      {/* Header — logo + WhatsApp CTA */}
      <header className={cn('border-b backdrop-blur-xl', styles.darkHeader)}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            src="/images/logos/LOGO 1 SEM FUNDO.png"
            alt="Humano Saúde"
            width={160}
            height={48}
            className="brightness-100"
            priority
          />
          <a
            href="https://wa.me/5521988179407?text=Ol%C3%A1!%20Vim%20do%20link%20de%20economia%20e%20quero%20saber%20mais%20sobre%20redu%C3%A7%C3%A3o%20do%20meu%20plano%20de%20sa%C3%BAde."
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-sm font-semibold hover:bg-[#c9a432] transition-all shadow-lg shadow-[#D4AF37]/20',
              styles.headerCta,
            )}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
            </svg>
            <span>Analisar com Especialista</span>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero — esconde nas etapas resultado e documentos */}
        {etapa !== 'resultado' && etapa !== 'documentos' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4',
              styles.heroAutoTag,
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Análise automática em segundos
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Descubra quanto você pode{' '}
            <span className={styles.heroHighlight}>
              economizar
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Envie sua fatura ou informe o valor atual e veja instantaneamente
            quanto pode reduzir no seu plano de saúde.
          </p>

          {/* ─── Animação 3D: Fatura → IA → Propostas ─── */}
          <div className="mt-8 mb-2" style={{ perspective: '1200px' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="flex items-center justify-center gap-3 sm:gap-5 md:gap-6 lg:gap-8"
            >
              {/* Card 1 — em destaque quando heroPhase === 0 (vem à frente e maior) */}
              <motion.div
                animate={{
                  opacity: heroPhase >= 0 ? 1 : 0.45,
                  scale: heroPhase === 0 ? 1.14 : 0.92,
                  zIndex: heroPhase === 0 ? 20 : 0,
                }}
                transition={{
                  opacity: { duration: 0.35 },
                  scale: { duration: 0.35, ease: 'easeOut' },
                  zIndex: { duration: 0 },
                }}
                className="relative w-26 h-34 sm:w-24 sm:h-32 md:w-28 md:h-36 lg:w-32 lg:h-40 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] border-dashed shadow-xl shadow-black/30 flex flex-col items-center justify-center gap-1.5 overflow-hidden"
                style={{ position: 'relative' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent" />
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="relative flex flex-col items-center gap-0.5">
                    <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-white/50" />
                    <motion.div
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex items-center justify-center"
                    >
                      <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]/80" strokeWidth={2.5} />
                    </motion.div>
                  </div>
                  <span className="text-[11px] sm:text-xs text-white/40 font-medium">Upload fatura</span>
                </div>
                <div className="absolute bottom-1.5 left-2 right-2 space-y-1">
                  <div className="h-[2px] bg-white/10 rounded-full" />
                  <div className="h-[2px] bg-white/8 rounded-full w-3/4" />
                  <div className="h-[2px] bg-white/6 rounded-full w-1/2" />
                </div>
              </motion.div>

              {/* Seta 1 — acende quando card 2 ativa */}
              <motion.div
                animate={{ opacity: heroPhase >= 1 ? 1 : 0.35 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  animate={{ x: heroPhase >= 1 ? [0, 6, 0] : 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#9b7316]/70" />
                </motion.div>
              </motion.div>

              {/* Card 2 — em destaque quando heroPhase === 1 (vem à frente e maior) */}
              <motion.div
                animate={{
                  opacity: heroPhase >= 1 ? 1 : 0.45,
                  scale: heroPhase === 1 ? 1.14 : 0.92,
                  zIndex: heroPhase === 1 ? 20 : 0,
                }}
                transition={{
                  opacity: { duration: 0.35 },
                  scale: { duration: 0.35, ease: 'easeOut' },
                  zIndex: { duration: 0 },
                }}
                style={{ position: 'relative' }}
              >
                <Card2Animacao active={heroPhase >= 1} />
              </motion.div>

              {/* Seta 2 — acende quando card 3 ativa */}
              <motion.div
                animate={{ opacity: heroPhase >= 2 ? 1 : 0.35 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  animate={{ x: heroPhase >= 2 ? [0, 6, 0] : 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                >
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#9b7316]/70" />
                </motion.div>
              </motion.div>

              {/* Card 3 — em destaque quando heroPhase === 2 (vem à frente e maior) */}
              <motion.div
                animate={{
                  opacity: heroPhase >= 2 ? 1 : 0.45,
                  scale: heroPhase === 2 ? 1.14 : 0.92,
                  zIndex: heroPhase === 2 ? 20 : 0,
                }}
                transition={{
                  opacity: { duration: 0.35 },
                  scale: { duration: 0.35, ease: 'easeOut' },
                  zIndex: { duration: 0 },
                }}
                style={{ position: 'relative' }}
              >
                <Card3EconomiaAnimacao active={heroPhase >= 2} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        )}

        {/* Steps indicator — ícones maiores no mobile e legenda sempre visível */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
          {[
            { id: 'upload', label: 'Fatura', icon: Upload },
            { id: 'dados', label: 'Dados', icon: Calculator },
            { id: 'resultado', label: 'Resultado', icon: TrendingDown },
            { id: 'documentos', label: 'Documentos', icon: FileCheck },
          ].map((step, i) => {
            const StepIcon = step.icon;
            const isActive = step.id === etapa;
            const stepOrder = ['upload', 'dados', 'resultado', 'documentos'];
            const currentIndex = stepOrder.indexOf(etapa);
            const stepIdx = stepOrder.indexOf(step.id);
            const isPast = stepIdx < currentIndex;
            return (
              <div key={step.id} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && (
                  <div
                    className={cn(
                      'w-4 sm:w-8 h-[2px] flex-shrink-0',
                      isPast ? 'bg-[#D4AF37]' : 'bg-white/10',
                    )}
                  />
                )}
                <div
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center items-center gap-0.5 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-full text-xs font-medium transition-all min-w-[56px] sm:min-w-0',
                    isActive
                      ? 'bg-[#D4AF37] text-black'
                      : isPast
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'bg-white/5 text-white/30',
                  )}
                >
                  {isPast ? (
                    <CheckCircle className="h-5 w-5 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  ) : (
                    <StepIcon className="h-5 w-5 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  )}
                  <span className="text-[10px] sm:text-xs font-semibold">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── ETAPA 1: UPLOAD ──────────────── */}
          {etapa === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              {/* Câmera ativa — preview de vídeo */}
              {cameraActive ? (
                <div className="bg-white/[0.03] border-2 border-dashed border-[#D4AF37]/30 rounded-2xl p-4 sm:p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-base font-semibold text-white">
                      📸 Aponte para sua fatura
                    </p>
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#F6E05E] transition-all"
                      >
                        <Camera className="h-5 w-5" />
                        Capturar foto
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-all"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : uploading ? (
                /* ─── Loading com progresso IA ─── */
                <div className="bg-white/[0.03] border-2 border-dashed border-[#D4AF37]/30 rounded-2xl p-8 sm:p-12 text-center">
                  <div className="flex flex-col items-center gap-6">
                    {/* Preview da imagem OU ícone de PDF */}
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview da fatura"
                          className="rounded-xl max-h-48 object-contain border border-white/10 shadow-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-[10px] text-white/60 text-center">Sua fatura</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <FileText className="h-12 w-12 text-red-400" />
                      </div>
                    )}

                    {/* IA Spinner com animação */}
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-[#D4AF37] animate-pulse" />
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="w-full max-w-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white">{ocrEtapa}</p>
                        <span className="text-xs text-[#D4AF37] font-bold">{ocrProgresso}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${ocrProgresso}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-white/20">Leitura Inteligente</span>
                        <span className="text-[10px] text-white/20">Leitura Inteligente</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Preview se já tem uma imagem (voltou para upload) */}
                  {previewUrl && (
                    <div className="mb-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={previewUrl}
                          alt="Fatura enviada"
                          className="h-20 w-20 rounded-lg object-cover border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-[#D4AF37]" />
                            Fatura já enviada
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">Envie outra ou continue para a próxima etapa</p>
                        </div>
                        <button
                          onClick={() => {
                            setPreviewUrl(null);
                            setDadosFatura({ operadora: null, plano: null, valor_total: null, beneficiarios: null, titular: null, razao_social: null, documento: null, tipo_pessoa: null, faixas_etarias: null });
                          }}
                          className="shrink-0 px-3 py-2 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Duas opções: no mobile "Enviar arquivo" primeiro; no desktop lado a lado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tirar foto — no mobile aparece em segundo (order-2) */}
                    <button
                      onClick={startCamera}
                      className="bg-white/[0.03] border-2 border-dashed border-white/[0.12] rounded-2xl p-8 text-center hover:border-[#D4AF37]/30 transition-all cursor-pointer group flex flex-col items-center gap-4 order-2 sm:order-1"
                    >
                      <div className="h-16 w-16 rounded-2xl bg-white/[0.05] flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-all">
                        <Camera className="h-7 w-7 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white mb-1">
                          Tirar foto
                        </p>
                        <p className="text-xs text-white/40">
                          Use a câmera do celular
                        </p>
                      </div>
                    </button>

                    {/* Enviar arquivo — no mobile aparece primeiro (order-1) */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="bg-white/[0.03] border-2 border-dashed border-white/[0.12] rounded-2xl p-8 text-center hover:border-[#D4AF37]/30 transition-all cursor-pointer group flex flex-col items-center gap-4 order-1 sm:order-2"
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileInput}
                        className="hidden"
                        id="fatura-upload"
                      />
                      <label htmlFor="fatura-upload" className="cursor-pointer flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/[0.05] flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-all">
                          <Upload className="h-7 w-7 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white mb-1">
                            Enviar arquivo
                          </p>
                          <p className="text-xs text-white/40">
                            JPG, PNG ou PDF — máx. 15MB
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ─── Aviso de Segurança (abaixo do upload) ─── */}
                  <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1d7f4a]/14 border border-[#1d7f4a]/24">
                    <Lock className="h-4 w-4 text-[#17663b] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      <span className="text-[#17663b] font-semibold">Ambiente Seguro:</span>{' '}
                      Seus documentos são processados de forma privada e criptografada.
                      Utilizamos tecnologia de ponta para garantir que apenas nossa equipe
                      técnica tenha acesso aos seus dados para fins de análise de plano de saúde.
                    </p>
                  </div>

                  {cameraError && (
                    <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-400">{cameraError}</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-xs text-white/30 uppercase">ou</span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>

              <button
                onClick={() => setEtapa('dados')}
                className="w-full py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 text-sm font-medium hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all"
              >
                Prefiro digitar manualmente
              </button>

            </motion.div>
          )}

          {/* ─── ETAPA 2: DADOS ──────────────── */}
          {etapa === 'dados' && (
            <motion.div
              key="dados"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl space-y-6">
                {/* Preview da fatura na etapa dados */}
                {previewUrl && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <img
                      src={previewUrl}
                      alt="Fatura"
                      className="h-16 w-16 rounded-lg object-cover border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/40">Fatura anexada</p>
                      {dadosFatura.operadora && (
                        <p className="text-sm text-white/70 font-medium">{dadosFatura.operadora}</p>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                  </div>
                )}

                {/* OCR Success — Dados detectados pela IA */}
                {(dadosFatura.operadora || dadosFatura.documento || dadosFatura.razao_social) && (
                  <div className="rounded-xl bg-green-500/5 border border-green-500/10 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border-b border-green-500/10">
                      <Sparkles className="h-4 w-4 text-green-400" />
                      <p className="text-green-400 font-medium text-sm">Dados extraídos automaticamente</p>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {/* Operadora detectada */}
                      {dadosFatura.operadora && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-24 shrink-0">Operadora</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                            <CheckCircle className="h-3 w-3 text-[#D4AF37]" />
                            <span className="text-[#D4AF37] text-sm font-semibold">{dadosFatura.operadora}</span>
                          </span>
                        </div>
                      )}
                      {/* Razão Social / Titular */}
                      {(dadosFatura.razao_social || dadosFatura.titular) && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-24 shrink-0">{dadosFatura.tipo_pessoa === 'PJ' ? 'Razão Social' : 'Titular'}</span>
                          <span className="text-white/70 text-sm">{dadosFatura.razao_social || dadosFatura.titular}</span>
                        </div>
                      )}
                      {/* CNPJ / CPF */}
                      {dadosFatura.documento && (
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-24 shrink-0">{dadosFatura.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'}</span>
                          <span className="text-white/70 text-sm font-mono">{dadosFatura.documento}</span>
                        </div>
                      )}
                      {/* Valor + Vidas + Tipo */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/30 text-xs w-24 shrink-0">Resumo</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {dadosFatura.valor_total && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-xs text-white/60">
                              <DollarSign className="h-3 w-3" />
                              R$ {dadosFatura.valor_total}
                            </span>
                          )}
                          {dadosFatura.beneficiarios && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-xs text-white/60">
                              <Users className="h-3 w-3" />
                              {dadosFatura.beneficiarios} vida{dadosFatura.beneficiarios > 1 ? 's' : ''}
                            </span>
                          )}
                          {dadosFatura.tipo_pessoa && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] text-xs text-white/60">
                              {dadosFatura.tipo_pessoa === 'PJ' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                              {dadosFatura.tipo_pessoa === 'PJ' ? 'Empresa' : 'Pessoa Física'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tipo de contratação (PF/PJ) */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Tipo de contratação
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoPessoa('PF')}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all',
                        tipoPessoa === 'PF'
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
                      )}
                    >
                      <User className="h-4 w-4" />
                      Pessoa Física
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoPessoa('PJ')}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all',
                        tipoPessoa === 'PJ'
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      Empresa (PJ)
                    </button>
                  </div>
                  {dadosFatura.tipo_pessoa && (
                    <p className="text-[11px] text-[#D4AF37]/60 mt-1.5 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Detectado automaticamente
                    </p>
                  )}
                </div>

                {/* Valor atual */}
                <div ref={valorRef}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white">
                      Valor atual da mensalidade *
                    </label>
                    {dadosFatura.valor_total && valorManual && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[10px] text-[#D4AF37] font-medium">
                        <Sparkles className="h-3 w-3" />
                        Detectado automaticamente
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/30">R$</span>
                    <input
                      type="text"
                      value={valorManual}
                      onChange={(e) => setValorManual(e.target.value)}
                      placeholder="Ex: 1.200,00"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg focus:outline-none focus:border-[#D4AF37]/40"
                    />
                  </div>
                </div>

                {/* Operadora */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white">
                      Operadora atual
                    </label>
                    {dadosFatura.operadora && operadoraManual && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[10px] text-[#D4AF37] font-medium">
                        <Sparkles className="h-3 w-3" />
                        Identificada automaticamente
                      </span>
                    )}
                  </div>
                  <select
                    value={operadoraManual}
                    onChange={(e) => setOperadoraManual(e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl bg-white/5 border text-sm focus:outline-none focus:border-[#D4AF37]/40',
                      dadosFatura.operadora && operadoraManual
                        ? 'border-[#D4AF37]/30 text-[#D4AF37]'
                        : 'border-white/10 text-white',
                    )}
                  >
                    <option value="">Selecione</option>
                    {[
                      'Amil', 'Bradesco Saúde', 'SulAmérica', 'Unimed',
                      'Porto Saúde', 'Prevent Senior', 'MedSênior',
                      'Assim Saúde', 'Golden Cross', 'Outro',
                    ].map((op) => (
                      <option key={op} value={op} className="bg-[#111]">
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faixas etárias — UX didática */}
                <div ref={idadesRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#D4AF37]" />
                      Quem está no plano? *
                    </label>
                    {dadosFatura.faixas_etarias && dadosFatura.faixas_etarias.length > 0 && idades.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[10px] text-[#D4AF37] font-medium">
                        <Sparkles className="h-3 w-3" />
                        Detectadas automaticamente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 mb-4">
                    Adicione cada pessoa do plano clicando na faixa de idade correspondente
                  </p>

                  {/* Grid de faixas etárias — todas visíveis como cards clicáveis */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                    {FAIXAS_IDADE.map((faixa) => {
                      const count = idades.filter((i) => i === faixa).length;
                      const label = faixa === '59+' ? '59+ anos' : `${faixa} anos`;
                      return (
                        <button
                          key={faixa}
                          type="button"
                          onClick={() => {
                            if (idades.length < 20) {
                              setIdades((prev) => [...prev, faixa]);
                            }
                          }}
                          className={cn(
                            'relative flex items-center justify-center py-3.5 px-2 rounded-xl border transition-all text-center',
                            count > 0
                              ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 shadow-sm shadow-[#D4AF37]/5'
                              : 'bg-white/[0.03] border-white/[0.08] hover:border-[#D4AF37]/20 hover:bg-[#D4AF37]/5',
                          )}
                        >
                          {count > 0 && (
                            <span className="absolute -top-2.5 -right-2 h-6 w-6 rounded-full bg-[#D4AF37] text-black text-xs font-bold flex items-center justify-center shadow-md">
                              {count}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-white/80">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista de beneficiários adicionados */}
                  {idades.length > 0 && (
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                        <p className="text-sm text-white/60 font-medium">
                          {idades.length} {idades.length === 1 ? 'beneficiário' : 'beneficiários'}
                        </p>
                        <button
                          onClick={() => setIdades([])}
                          className="text-xs text-red-400/50 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          Limpar
                        </button>
                      </div>
                      {/* Lista */}
                      <div className="p-3 flex flex-wrap gap-2">
                        {idades.map((idade, i) => {
                          return (
                            <motion.span
                              key={`${idade}-${i}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="inline-flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm"
                            >
                              <span className="text-white/80 font-medium">{idade === '59+' ? '59+ anos' : `${idade} anos`}</span>
                              <button
                                onClick={() => removerIdade(i)}
                                className="ml-0.5 p-1 rounded hover:bg-red-500/20 text-white/25 hover:text-red-400 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </motion.span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {idades.length === 0 && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.1]">
                      <Info className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-white/50 font-medium mb-1">Como funciona?</p>
                        <p className="text-[11px] text-white/30 leading-relaxed">
                          Clique na faixa de idade de cada pessoa que usa o plano.
                          Por exemplo: se são 2 adultos (30 e 35 anos) e 1 criança (5 anos),
                          clique em &quot;29-33&quot;, &quot;34-38&quot; e &quot;0-18&quot;.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dados de contato (obrigatório) */}
                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="h-4 w-4 text-[#D4AF37]" />
                    <p className="text-sm font-medium text-white">
                      Dados para contato <span className="text-red-400">*</span>
                    </p>
                  </div>

                  {/* Razão Social / Empresa (auto-preenchido) */}
                  {nome && (
                    <div className="mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                        {tipoPessoa === 'PJ' ? 'Razão Social / Empresa' : 'Titular do plano'}
                      </p>
                      <p className="text-sm text-white/70 font-medium">{nome}</p>
                      {dadosFatura.documento && (
                        <p className="text-xs text-white/40 font-mono mt-0.5">{dadosFatura.documento}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Nome do responsável */}
                    <div ref={nomeRef}>
                      <label className="text-xs text-white/50 mb-1 block">
                        Nome do responsável <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                          type="text"
                          value={nomeResponsavel}
                          onChange={(e) => setNomeResponsavel(e.target.value)}
                          placeholder="Nome completo do responsável"
                          className={cn(
                            'w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white focus:outline-none focus:border-[#D4AF37]/40',
                            !nomeResponsavel.trim() ? 'border-white/10' : 'border-green-500/20',
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* WhatsApp */}
                      <div ref={telefoneRef}>
                        <label className="text-xs text-white/50 mb-1 block">
                          WhatsApp <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            type="tel"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            placeholder="(21) 99999-9999"
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white focus:outline-none focus:border-[#D4AF37]/40',
                              !telefone.trim() ? 'border-white/10' : 'border-green-500/20',
                            )}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div ref={emailRef}>
                        <label className="text-xs text-white/50 mb-1 block">
                          E-mail <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com.br"
                            className={cn(
                              'w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white focus:outline-none focus:border-[#D4AF37]/40',
                              !email.trim() ? 'border-white/10' : 'border-green-500/20',
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={calcular}
                  disabled={calculando}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black font-bold text-base hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {calculando ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      Ver minha economia
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── ETAPA 3: RESULTADO ──────────── */}
          {etapa === 'resultado' && resultado && (
            <motion.div
              ref={resultadoRef}
              key="resultado"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Header do resultado */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium mb-4">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {resultado.propostas.length} {resultado.propostas.length === 1 ? 'proposta encontrada' : 'propostas encontradas'}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Encontramos opções para{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F6E05E]">
                    economizar
                  </span>
                </h2>
                <p className="text-white/40 text-sm">
                  Valor atual: <span className="text-red-400 font-semibold line-through">{formatCurrency(resultado.valorAtual)}</span>
                  {' • '}{resultado.qtdVidas} vida{resultado.qtdVidas > 1 ? 's' : ''}
                  {' • '}{resultado.modalidade}
                </p>
              </div>

              {/* Cards das propostas — centralizados */}
              <div className={cn(
                'flex flex-wrap justify-center gap-4 overflow-visible',
              )}>
                {resultado.propostas.map((proposta, index) => {
                  const isBest = index === 0;
                  const economiaAnual = Math.round(proposta.economia_valor * 12 * 100) / 100;
                  return (
                    <motion.div
                      key={proposta.operadora_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className={cn(
                        'relative bg-white/[0.03] border rounded-2xl p-5 backdrop-blur-xl flex flex-col overflow-visible w-full md:w-[calc(33.333%-1rem)] md:max-w-[320px]',
                        isBest
                          ? 'border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20 mt-3'
                          : 'border-white/[0.08]',
                      )}
                    >
                      {isBest && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-lg shadow-[#D4AF37]/20">
                            ⭐ Melhor economia
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-4 mt-1">
                        <div className="h-12 w-12 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0">
                          <Image
                            src={proposta.logo}
                            alt={proposta.operadora_nome}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{proposta.operadora_nome}</p>
                          <p className="text-[11px] text-white/40 truncate">{proposta.plano_nome}</p>
                        </div>
                      </div>

                      <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-white/40 uppercase">Economia mensal</span>
                          <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                            -{proposta.economia_pct}%
                          </span>
                        </div>
                        <p className="text-xl font-bold text-green-400">
                          {formatCurrency(proposta.economia_valor)}
                          <span className="text-xs text-white/30 font-normal">/mês</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-white/40">Valor mensal</span>
                        <span className="text-lg font-bold text-[#D4AF37]">
                          {formatCurrency(proposta.valor_total)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                        <span className="text-xs text-white/40">Economia no ano</span>
                        <span className="text-sm font-semibold text-green-400">
                          {formatCurrency(economiaAnual)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 flex-1">
                        {proposta.coparticipacao && (
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>Coparticipação{proposta.coparticipacao_pct ? ` ${proposta.coparticipacao_pct}%` : ''}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Shield className="h-3 w-3 shrink-0" />
                          <span>{proposta.abrangencia}</span>
                        </div>
                        {proposta.rede_hospitalar.length > 0 && (
                          <div className="flex items-start gap-2 text-xs text-white/40">
                            <Building2 className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{proposta.rede_hospitalar.slice(0, 3).join(', ')}</span>
                          </div>
                        )}
                        {proposta.notas && (
                          <p className="text-[10px] text-white/25 italic">{proposta.notas}</p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (leadId && !contatoClicado) {
                            marcarClicouContato(leadId);
                            setContatoClicado(true);
                          }
                          const valorAtualStr = resultado?.valorAtual ? formatCurrency(resultado.valorAtual) : '';
                          const msg = encodeURIComponent(
                            `Olá! Fiz uma simulação e quero a proposta do plano *${proposta.plano_nome}* da *${proposta.operadora_nome}*. Valor atual: ${valorAtualStr} → Novo valor: ${formatCurrency(proposta.valor_total)} (economia de ${proposta.economia_pct}%).`,
                          );
                          window.open(`https://wa.me/5521988179407?text=${msg}`, '_blank');
                        }}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
                          isBest
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20'
                            : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50',
                        )}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
                        </svg>
                        Quero essa proposta
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA Documentos — agilizar proposta (logo após cards) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-[#D4AF37]/5 to-[#D4AF37]/[0.02] border border-[#D4AF37]/20 rounded-2xl p-6 text-center"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#D4AF37]/10 mb-3">
                  <FileCheck className="h-6 w-6 text-[#D4AF37]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Quer agilizar sua proposta e garantir o desconto?
                </h3>
                <p className="text-sm text-white/40 mb-4 max-w-md mx-auto">
                  Envie agora os documentos necessários para adesão e nossa equipe já inicia o processo de migração.
                </p>
                <button
                  onClick={() => {
                    setEtapa('documentos');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#F6E05E] transition-all"
                >
                  <Upload className="h-4 w-4" />
                  Enviar documentos
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>

              {/* Aviso migração/cancelamento */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 mb-1">
                      Migração e Cancelamento sem dor de cabeça
                    </h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      A migração e cancelamento do plano atual será <span className="text-white/70 font-medium">providenciado pela nossa equipe</span>.
                      Nossos especialistas só realizarão efetivação e cancelamento <span className="text-white/70 font-medium">após entrar em contato com o cliente</span> e
                      confirmar todos os detalhes. Você não precisa se preocupar com nada.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* CTA principal + opções de contato */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-2 text-center">
                  Quer garantir essa economia?
                </h3>
                <p className="text-sm text-white/40 text-center mb-6">
                  Fale agora com a Humano Saúde e receba uma análise personalizada gratuita
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleContatoWhatsApp}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#128C7E] text-white font-bold text-sm hover:bg-[#075E54] transition-all"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
                    </svg>
                    Chamar no WhatsApp
                  </button>
                  <button
                    onClick={handleContatoTelefone}
                    className="flex items-center justify-center gap-2 py-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-medium text-sm hover:border-[#D4AF37]/30 transition-all"
                  >
                    <Phone className="h-5 w-5" />
                    Ligar agora
                  </button>
                </div>

                {contatoClicado && (
                  <p className="text-xs text-green-400 text-center mt-3 flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Equipe Humano Saúde foi notificada do seu interesse!
                  </p>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-xs text-white/30 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Dados seguros
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Sem compromisso
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> 100% gratuito
                </span>
              </div>

              {/* Recalcular */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setEtapa('dados');
                    setResultado(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-sm text-white/30 hover:text-[#D4AF37] transition-colors"
                >
                  ← Fazer nova simulação
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── ETAPA 4: DOCUMENTOS ──────────── */}
          {etapa === 'documentos' && (
            <motion.div
              key="documentos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="text-center mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-medium mb-3">
                  <FileCheck className="h-3.5 w-3.5" />
                  Documentos para adesão
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Envie seus documentos
                </h2>
                <p className="text-sm text-white/40 max-w-md mx-auto">
                  Todos os documentos são <span className="text-[#D4AF37]">opcionais</span>. Envie o que tiver agora e complete depois.
                </p>
              </div>

              {/* Aviso migração */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/50 leading-relaxed">
                    <span className="text-blue-400 font-medium">Migração sem preocupação:</span> A migração e cancelamento do plano atual será providenciado integralmente pela nossa equipe.
                    Nossos especialistas só realizarão a efetivação e cancelamento após contato e confirmação com o cliente.
                  </p>
                </div>
              </div>

              {/* Lista de documentos */}
              <div className="space-y-3">
                {documentosFiltrados.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      'bg-white/[0.03] border rounded-xl p-4 transition-all',
                      doc.arquivo
                        ? 'border-green-500/20 bg-green-500/[0.02]'
                        : 'border-white/[0.08]',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Ícone / Preview */}
                      <div className="shrink-0">
                        {doc.previewUrl ? (
                          <img
                            src={doc.previewUrl}
                            alt={doc.label}
                            className="h-12 w-12 rounded-lg object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white/20" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{doc.label}</p>
                        <p className="text-[11px] text-white/40">{doc.descricao}</p>
                        {doc.nota && (
                          <p className="text-[11px] text-[#D4AF37] mt-0.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {doc.nota}
                          </p>
                        )}
                        {doc.arquivo && (
                          <p className="text-[11px] text-green-400 mt-0.5 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {doc.arquivo.name}
                          </p>
                        )}
                      </div>

                      {/* Upload / Remove */}
                      <div className="shrink-0">
                        {doc.arquivo ? (
                          <button
                            onClick={() => removerDocumento(doc.id)}
                            className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentoUpload(doc.id, file);
                              }}
                              className="hidden"
                              id={`doc-${doc.id}`}
                            />
                            <label
                              htmlFor={`doc-${doc.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] cursor-pointer transition-all"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Enviar
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status & CTAs */}
              <div className="space-y-3">
                {!enviadoDocumentos ? (
                  <>
                    <button
                      onClick={enviarDocumentos}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black font-bold text-sm hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <FileCheck className="h-5 w-5" />
                      Enviar documentos ({documentosFiltrados.filter((d) => d.arquivo).length} anexado{documentosFiltrados.filter((d) => d.arquivo).length !== 1 ? 's' : ''})
                    </button>
                    <button
                      onClick={() => {
                        setEtapa('resultado');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 text-sm hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all"
                    >
                      ← Voltar ao resultado
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Documentos enviados com sucesso!</span>
                    </div>
                    <p className="text-xs text-white/40">
                      Nossa equipe entrará em contato em breve para dar continuidade à sua proposta.
                    </p>
                    <button
                      onClick={handleContatoWhatsApp}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
                      </svg>
                      Falar com especialista
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── SEÇÃO: PROVA SOCIAL (CARROSSEL) ─── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-20 mb-12"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9b7316]/18 border border-[#9b7316]/35 text-[#8a650c] text-xs font-medium mb-3">
              <Heart className="h-3.5 w-3.5" />
              Depoimentos reais
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              O que nossos clientes dizem
            </h2>
            <p className="text-sm text-white/40">
              Mais de 500 famílias e empresas economizando com a Humano Saúde
            </p>
          </div>

          {/* Carrossel — 3 cards visíveis */}
          <div className="relative max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={depoimentoIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {DEPOIMENTOS.slice(depoimentoIndex * 3, depoimentoIndex * 3 + 3).map((dep) => (
                  <div
                    key={dep.nome}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col"
                  >
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: dep.estrelas }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                      ))}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed mb-4 italic flex-1">
                      &ldquo;{dep.texto}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="h-10 w-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-xl">
                        {dep.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{dep.nome}</p>
                        <p className="text-[11px] text-white/40">
                          {dep.cargo} • {dep.segmento}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Controles */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDepoimentoIndex((prev) => (prev - 1 + totalPages) % totalPages)}
                className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setDepoimentoIndex(i)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === depoimentoIndex ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-white/15 hover:bg-white/30',
                    )}
                  />
                ))}
              </div>

              <button
                onClick={() => setDepoimentoIndex((prev) => (prev + 1) % totalPages)}
                className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>

      </main>

      {/* ─── FOOTER PROFISSIONAL ─── */}
      <footer className={cn('border-t', styles.darkFooter)}>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Coluna 1 — Logo & Sobre */}
            <div>
              <Image
                src="/images/logos/LOGO 1 SEM FUNDO.png"
                alt="Humano Saúde"
                width={140}
                height={42}
                className="brightness-110 mb-3"
              />
              <p className="text-xs text-white/40 leading-relaxed mb-3">
                Consultoria especializada em planos de saúde empresariais e individuais.
                Redução de custos com qualidade e cobertura garantidas.
              </p>
              <p className="text-[10px] text-white/25 leading-relaxed">
                SUSEP nº 251174847
              </p>
            </div>

            {/* Coluna 2 — Contato */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Contato</h4>
              <div className="space-y-2.5">
                <a
                  href="tel:+5521988179407"
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-[#D4AF37] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  (21) 98817-9407
                </a>
                <a
                  href="https://wa.me/5521988179407"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-[#25D366] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href="mailto:comercial@humanosaude.com.br"
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-[#D4AF37] transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  comercial@humanosaude.com.br
                </a>
              </div>
            </div>

            {/* Coluna 3 — Endereço */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Endereço</h4>
              <div className="flex items-start gap-2 text-xs text-white/40 leading-relaxed">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Av. das Américas, 7607 — Sala 318<br />
                  Barra da Tijuca, Rio de Janeiro — RJ<br />
                  CEP 22793-081
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[10px] text-white/25 leading-relaxed">
                  HDM Consultoria Imobiliária e Seguros LTDA — ME<br />
                  CNPJ: 50.216.907/0001-60 · SUSEP: 251174847
                </p>
              </div>
            </div>
          </div>

          {/* Linha separadora + LGPD + copyright */}
          <div className="border-t border-white/[0.06] pt-6 space-y-4">
            {/* Bloco LGPD completo */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-[#D4AF37]/60" />
                <span className="text-xs font-semibold text-white/40">Privacidade e Proteção de Dados</span>
              </div>
              <p className="text-[10px] text-white/25 leading-relaxed">
                Em conformidade com a <span className="text-white/35 font-medium">Lei Geral de Proteção de Dados (Lei 13.709/2018)</span>,
                informamos que todos os dados coletados (faturas e documentos pessoais) são processados via infraestrutura
                segura Google Cloud e armazenados de forma sigilosa. Seus dados nunca serão compartilhados com terceiros
                sem sua autorização expressa. Para exercer seus direitos de titular de dados, entre em contato pelo e-mail{' '}
                <a href="mailto:comercial@humanosaude.com.br" className="text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors underline">
                  comercial@humanosaude.com.br
                </a>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-[11px] text-white/20">
                  © {new Date().getFullYear()} Humano Saúde — Todos os direitos reservados.
                </p>
                <p className="text-[10px] text-white/15 mt-0.5">
                  Valores estimados, sujeitos à análise. Registro SUSEP consultável no site oficial da SUSEP.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-white/20">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-green-500/40" />
                  SSL Criptografado
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-400/40" />
                  LGPD
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
