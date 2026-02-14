'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Shield,
  FileText,
  ScrollText,
  AlertCircle,
  Target,
  MapPin,
  Monitor,
  Users,
  Heart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// ─── Constantes ────────────────────────────────────────────
const OPERADORAS = [
  'Todas',
  'Amil', 'Bradesco', 'SulAmérica', 'Unimed', 'Porto Saúde',
  'Prevent Senior', 'MedSênior', 'Leve Saúde', 'Assim Saúde', 'Outro',
];

const ESPECIALIDADES = [
  { value: 'pme', label: 'PME (Empresarial)' },
  { value: 'adesao', label: 'Adesão' },
  { value: 'individual', label: 'Individual / Familiar' },
  { value: 'todos', label: 'Todos os segmentos' },
];

const MOTIVACOES = [
  { value: 'renda_extra', label: 'Renda extra', icon: Target },
  { value: 'profissao_nova', label: 'Nova profissão', icon: Briefcase },
  { value: 'ampliar_carteira', label: 'Ampliar carteira', icon: Users },
  { value: 'indicacao', label: 'Indicação', icon: Heart },
  { value: 'migrar_operadora', label: 'Migrar de corretora', icon: MapPin },
  { value: 'experiencia_saude', label: 'Exp. em saúde', icon: Shield },
];

const COMO_CONHECEU = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'google', label: 'Google', icon: '🔍' },
  { value: 'indicacao_amigo', label: 'Indicação', icon: '🤝' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'evento', label: 'Evento', icon: '🎤' },
  { value: 'outro', label: 'Outro', icon: '💬' },
];

const TOTAL_STEPS = 4;

// ─── Validadores de Documento ──────────────────────────────
function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(nums)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(nums[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(nums[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(nums[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(nums[10])) return false;

  return true;
}

function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(nums)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) soma += Number(nums[i]) * pesos1[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (Number(nums[12]) !== d1) return false;

  soma = 0;
  for (let i = 0; i < 13; i++) soma += Number(nums[i]) * pesos2[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  if (Number(nums[13]) !== d2) return false;

  return true;
}

// ─── Formatadores ──────────────────────────────────────────
function formatPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return `(${nums}`;
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

function formatCpf(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

function formatCnpj(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 14);
  if (nums.length <= 2) return nums;
  if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`;
  if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`;
  if (nums.length <= 12) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`;
  return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`;
}

// ─── Componente do Popup de Termos (Google-style) ──────────
function TermosPopup({
  isOpen,
  onAccept,
  onClose,
}: {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    if (isOpen) setScrolledToBottom(false);
  }, [isOpen]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 50;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      setScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 md:p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0F1419] border border-white/[0.1] rounded-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 border-b border-white/[0.08] flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <ScrollText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">Termos de Uso e Política de Privacidade</h2>
            <p className="text-xs sm:text-sm md:text-base text-white/40">Leia atentamente antes de aceitar</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 space-y-4 sm:space-y-6"
        >
          {/* Termos de Uso */}
          <div>
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#D4AF37] mb-2 sm:mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              TERMOS DE USO DA PLATAFORMA HUMANO SAÚDE PARA CORRETORES
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-white/30 mb-3 sm:mb-4">Última atualização: 10 de fevereiro de 2026</p>

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base text-white/60 leading-relaxed">
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">1. ACEITAÇÃO DOS TERMOS</h4>
                <p>Ao acessar e utilizar a plataforma Humano Saúde na qualidade de corretor parceiro, você declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">2. CADASTRO E ELEGIBILIDADE</h4>
                <p>2.1. Para utilizar a plataforma, o corretor deve: ser maior de 18 anos; possuir CPF ou CNPJ válido e regular; fornecer informações verdadeiras, completas e atualizadas; manter a confidencialidade de suas credenciais de acesso.</p>
                <p className="mt-1">2.2. A Humano Saúde reserva-se o direito de recusar, suspender ou cancelar o cadastro a qualquer momento, sem aviso prévio.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">3. RESPONSABILIDADES DO CORRETOR</h4>
                <p>3.1. O corretor compromete-se a: atuar com ética e transparência junto aos clientes; não divulgar informações confidenciais da plataforma; não utilizar a plataforma para fins ilícitos; manter seus dados cadastrais atualizados; cumprir a legislação vigente, incluindo a LGPD.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">4. PROPRIEDADE INTELECTUAL</h4>
                <p>Todo o conteúdo, materiais de venda, logotipos e sistemas disponibilizados são propriedade da Humano Saúde, sendo vedada a reprodução sem autorização.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">5. COMISSÕES</h4>
                <p>5.1. As comissões serão calculadas conforme a grade vigente e pagas nos prazos estabelecidos.</p>
                <p className="mt-1">5.2. A Humano Saúde poderá alterar a grade de comissões mediante aviso prévio de 30 dias.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">6. LIMITAÇÃO DE RESPONSABILIDADE</h4>
                <p>A plataforma é fornecida &quot;como está&quot;. A Humano Saúde não garante disponibilidade ininterrupta do serviço.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">7. RESCISÃO</h4>
                <p>Qualquer das partes pode encerrar o vínculo mediante comunicação por escrito com 30 dias de antecedência.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">8. FORO</h4>
                <p>Fica eleito o foro da Comarca do Rio de Janeiro/RJ para dirimir quaisquer controvérsias.</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.08]" />

          {/* LGPD */}
          <div>
            <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#D4AF37] mb-2 sm:mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-white/30 mb-3 sm:mb-4">Em conformidade com a Lei nº 13.709/2018</p>

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm md:text-base text-white/60 leading-relaxed">
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">1. CONTROLADOR DE DADOS</h4>
                <p>Humano Saúde Corretora de Seguros LTDA, com sede na cidade do Rio de Janeiro/RJ.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">2. DADOS COLETADOS</h4>
                <p><strong>Dados de identificação:</strong> nome completo, CPF/CNPJ, e-mail, telefone.</p>
                <p><strong>Dados profissionais:</strong> registro SUSEP, experiência, especialidades.</p>
                <p><strong>Dados de navegação:</strong> endereço IP, user agent, logs de acesso.</p>
                <p><strong>Dados financeiros:</strong> informações bancárias para pagamento de comissões.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">3. FINALIDADE DO TRATAMENTO</h4>
                <p>Cadastro e gestão do relacionamento como corretor parceiro; cálculo e pagamento de comissões; comunicação operacional e envio de materiais; cumprimento de obrigações legais e regulatórias; melhoria contínua da plataforma.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">4. BASE LEGAL</h4>
                <p><strong>Consentimento</strong> (Art. 7º, I da LGPD); <strong>Execução de contrato</strong> (Art. 7º, V); <strong>Cumprimento de obrigação legal</strong> (Art. 7º, II); <strong>Legítimo interesse</strong> (Art. 7º, IX).</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">5. COMPARTILHAMENTO</h4>
                <p>Seus dados poderão ser compartilhados com: operadoras de saúde parceiras (processamento de propostas); prestadores de serviço (processamento de pagamentos); autoridades regulatórias (quando exigido por lei).</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">6. SEUS DIREITOS</h4>
                <p>Confirmar a existência de tratamento; acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar anonimização ou eliminação; revogar o consentimento; solicitar portabilidade.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">7. RETENÇÃO DE DADOS</h4>
                <p>Seus dados serão mantidos enquanto durar o vínculo como corretor e por mais 5 anos após o encerramento, para cumprimento de obrigações legais.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">8. SEGURANÇA</h4>
                <p>Empregamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia, controle de acesso e monitoramento.</p>
              </div>
              <div>
                <h4 className="text-white/80 font-semibold mb-1 text-xs sm:text-sm md:text-base">9. CONTATO DO ENCARREGADO (DPO)</h4>
                <p>Para exercer seus direitos ou esclarecer dúvidas: <span className="text-[#D4AF37]">privacidade@humanosaude.com</span></p>
              </div>
            </div>
          </div>

          {/* Scroll Hint */}
          {!scrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-[#0F1419] via-[#0F1419]/90 to-transparent pt-6 pb-2 text-center">
              <p className="text-xs sm:text-sm text-white/30 animate-pulse">↓ Role até o final para aceitar os termos ↓</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 border-t border-white/[0.08] shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl text-sm sm:text-base text-white/50 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onAccept}
              disabled={!scrolledToBottom}
              className={cn(
                'px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center gap-2',
                scrolledToBottom
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20'
                  : 'bg-white/5 text-white/20 cursor-not-allowed',
              )}
            >
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Li e Aceito os Termos
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Componente Principal ──────────────────────────────────
export default function CadastroCorretorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [docError, setDocError] = useState('');

  // Step 1 — Dados pessoais
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>('pf');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');

  // Step 2 — Dados profissionais
  const [registroSusep, setRegistroSusep] = useState('');
  const [experienciaAnos, setExperienciaAnos] = useState('');
  const [operadorasSelecionadas, setOperadorasSelecionadas] = useState<string[]>([]);
  const [especialidade, setEspecialidade] = useState('');

  // Step 3 — Motivações + Modalidade
  const [motivacoes, setMotivacoes] = useState<string[]>([]);
  const [modalidadeTrabalho, setModalidadeTrabalho] = useState<'presencial' | 'digital' | 'hibrido'>('digital');
  const [comoConheceu, setComoConheceu] = useState('');
  const [mensagem, setMensagem] = useState('');

  // Step 4 — Termos
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [showTermosPopup, setShowTermosPopup] = useState(false);

  // ─── Operadoras Toggle ───────────────────────────────────
  const toggleOperadora = (op: string) => {
    if (op === 'Todas') {
      if (operadorasSelecionadas.includes('Todas')) {
        setOperadorasSelecionadas([]);
      } else {
        setOperadorasSelecionadas([...OPERADORAS]);
      }
      return;
    }

    setOperadorasSelecionadas((prev) => {
      const next = prev.includes(op)
        ? prev.filter((o) => o !== op)
        : [...prev, op];

      const withoutTodas = next.filter((o) => o !== 'Todas');
      const allIndividual = OPERADORAS.filter((o) => o !== 'Todas');
      if (allIndividual.every((o) => withoutTodas.includes(o))) {
        return [...OPERADORAS];
      }
      return withoutTodas;
    });
  };

  // ─── Motivações Toggle ──────────────────────────────────
  const toggleMotivacao = (value: string) => {
    setMotivacoes((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value],
    );
  };

  // ─── Validação por Step ──────────────────────────────────
  const validateStep1 = (): string | null => {
    if (!nome.trim()) return 'Nome completo é obrigatório';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido';
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) return 'Telefone inválido';

    if (tipoPessoa === 'pf') {
      const cpfNums = cpf.replace(/\D/g, '');
      if (!cpfNums) return 'CPF é obrigatório';
      if (!validarCPF(cpfNums)) return 'CPF inválido. Verifique os números digitados.';
    } else {
      const cnpjNums = cnpj.replace(/\D/g, '');
      if (!cnpjNums) return 'CNPJ é obrigatório';
      if (!validarCNPJ(cnpjNums)) return 'CNPJ inválido. Verifique os números digitados.';
      if (!razaoSocial.trim()) return 'Razão Social é obrigatória para Pessoa Jurídica';
    }

    return null;
  };

  const validateStep4 = (): string | null => {
    if (!termosAceitos) return 'Você precisa aceitar os Termos de Uso e Política de Privacidade';
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    setError('');
    setDocError('');
    setStep((s) => s + 1);
  };

  // ─── Submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validateStep4();
    if (err) { setError(err); return; }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/corretor/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_pessoa: tipoPessoa,
          nome_completo: nome.trim(),
          email: email.trim().toLowerCase(),
          telefone: telefone.trim(),
          cpf: tipoPessoa === 'pf' ? cpf.replace(/\D/g, '') : null,
          cnpj: tipoPessoa === 'pj' ? cnpj.replace(/\D/g, '') : null,
          razao_social: tipoPessoa === 'pj' ? razaoSocial.trim() : null,
          nome_fantasia: tipoPessoa === 'pj' ? nomeFantasia.trim() || null : null,
          registro_susep: registroSusep.trim() || null,
          experiencia_anos: experienciaAnos ? Number(experienciaAnos) : 0,
          operadoras_experiencia: operadorasSelecionadas.filter((o) => o !== 'Todas'),
          especialidade: especialidade || null,
          motivacoes: motivacoes,
          modalidade_trabalho: modalidadeTrabalho,
          como_conheceu: comoConheceu || null,
          mensagem: mensagem.trim() || null,
          termo_aceito: true,
          termo_versao: '1.0',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erro ao enviar solicitação');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Documento validation live feedback ──────────────────
  const handleDocChange = (value: string) => {
    setDocError('');
    if (tipoPessoa === 'pf') {
      const formatted = formatCpf(value);
      setCpf(formatted);
      const nums = formatted.replace(/\D/g, '');
      if (nums.length === 11 && !validarCPF(nums)) {
        setDocError('CPF inválido');
      }
    } else {
      const formatted = formatCnpj(value);
      setCnpj(formatted);
      const nums = formatted.replace(/\D/g, '');
      if (nums.length === 14 && !validarCNPJ(nums)) {
        setDocError('CNPJ inválido');
      }
    }
  };

  const handleTipoPessoaChange = (tipo: 'pf' | 'pj') => {
    setTipoPessoa(tipo);
    setCpf('');
    setCnpj('');
    setRazaoSocial('');
    setNomeFantasia('');
    setDocError('');
  };

  // ─── Document valid check ────────────────────────────────
  const isDocValid = tipoPessoa === 'pf'
    ? cpf.replace(/\D/g, '').length === 11 && validarCPF(cpf.replace(/\D/g, ''))
    : cnpj.replace(/\D/g, '').length === 14 && validarCNPJ(cnpj.replace(/\D/g, ''));

  // ─── Tela de Sucesso ────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 sm:px-6 md:px-8">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-green-500/5 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative text-center max-w-md sm:max-w-lg md:max-w-xl w-full"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 sm:mb-6">
            <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-green-400" />
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
            Solicitação Enviada! 🎉
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-white/50 leading-relaxed mb-4 sm:mb-6">
            Sua solicitação de cadastro foi recebida e está sendo analisada pela equipe Humano Saúde.
            Você receberá uma notificação quando for aprovado.
          </p>

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 text-left">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
              <span className="text-sm sm:text-base md:text-lg text-white font-medium">Próximos passos:</span>
            </div>
            <ol className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base text-white/50 ml-6 sm:ml-7">
              <li>1. Nossa equipe analisa seus dados</li>
              <li>2. Aprovação em até 24h úteis</li>
              <li>3. Após aprovação, envio de documentos</li>
              <li>4. Cadastro de dados bancários</li>
              <li>5. Acesso completo ao painel do corretor</li>
            </ol>
          </div>

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] mt-0.5 shrink-0" />
              <p className="text-xs sm:text-sm md:text-base text-[#D4AF37]/80 text-left">
                Após aprovação, será necessário enviar um documento de identidade com foto (CNH ou RG),
                dados bancários e, caso PJ, o contrato social da empresa.
              </p>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs sm:text-sm md:text-base text-red-400/80 text-left">
                <strong>Atenção:</strong> Nossos e-mails podem cair na pasta <strong>Spam/Lixo Eletrônico</strong>. 
                Fique de olho e marque como &quot;Não é spam&quot; para receber os próximos comunicados normalmente.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/corretor/login')}
            className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm sm:text-base text-white/60 hover:text-white hover:border-white/20 transition-all"
          >
            Voltar ao Login
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Step Labels ─────────────────────────────────────────
  const stepLabels = ['Dados', 'Profissional', 'Motivação', 'Termos'];

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-12">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <div className="mx-auto mb-3 sm:mb-4 w-32 sm:w-40 md:w-48 lg:w-56 h-auto">
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={224}
              height={75}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">
            Cadastro de <span className="text-[#D4AF37]">Corretor Parceiro</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/40 mt-1 sm:mt-2">
            Preencha seus dados para solicitar acesso à plataforma
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-5 sm:mb-6 md:mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base font-bold transition-all',
                    step === s
                      ? 'bg-[#D4AF37] text-black'
                      : step > s
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-white/30',
                  )}
                >
                  {step > s ? '✓' : s}
                </div>
                <span className={cn(
                  'text-[10px] sm:text-xs md:text-sm mt-1 font-medium',
                  step === s ? 'text-[#D4AF37]' : step > s ? 'text-green-400/60' : 'text-white/20',
                )}>
                  {stepLabels[s - 1]}
                </span>
              </div>
              {s < TOTAL_STEPS && (
                <div className={cn(
                  'w-6 sm:w-8 md:w-12 lg:w-16 h-px mb-4 sm:mb-5',
                  step > s ? 'bg-green-500/30' : 'bg-white/10',
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {/* ──── Step 1: Dados Pessoais ──── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37]" />
                  Dados Pessoais
                </h3>

                {/* PF / PJ Toggle */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">Tipo de Cadastro *</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleTipoPessoaChange('pf')}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 sm:py-3.5 md:py-4 rounded-xl text-sm sm:text-base md:text-lg font-medium transition-all',
                        tipoPessoa === 'pf'
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/40'
                          : 'bg-white/5 text-white/50 border-2 border-transparent hover:border-white/10',
                      )}
                    >
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      Pessoa Física
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTipoPessoaChange('pj')}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 sm:py-3.5 md:py-4 rounded-xl text-sm sm:text-base md:text-lg font-medium transition-all',
                        tipoPessoa === 'pj'
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/40'
                          : 'bg-white/5 text-white/50 border-2 border-transparent hover:border-white/10',
                      )}
                    >
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      Pessoa Jurídica
                    </button>
                  </div>
                </div>

                {/* Nome */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">
                    {tipoPessoa === 'pf' ? 'Nome Completo *' : 'Nome do Responsável *'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder={tipoPessoa === 'pf' ? 'Seu nome completo' : 'Nome do responsável legal'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">E-mail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seunome@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Telefone + CPF/CNPJ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Telefone / WhatsApp *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                      <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        placeholder="(21) 99999-9999"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">
                      {tipoPessoa === 'pf' ? 'CPF *' : 'CNPJ *'}
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                      <input
                        type="text"
                        value={tipoPessoa === 'pf' ? cpf : cnpj}
                        onChange={(e) => handleDocChange(e.target.value)}
                        placeholder={tipoPessoa === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                        className={cn(
                          'w-full bg-white/5 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none transition-colors border',
                          docError
                            ? 'border-red-500/40 focus:border-red-500/60'
                            : 'border-white/10 focus:border-[#D4AF37]/40',
                        )}
                      />
                    </div>
                    {docError && (
                      <p className="text-xs sm:text-sm text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {docError}
                      </p>
                    )}
                    {!docError && isDocValid && (
                      <p className="text-xs sm:text-sm text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {tipoPessoa === 'pf' ? 'CPF válido' : 'CNPJ válido'}
                      </p>
                    )}
                  </div>
                </div>

                {/* PJ Extra Fields */}
                {tipoPessoa === 'pj' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div>
                      <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Razão Social *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                        <input
                          type="text"
                          value={razaoSocial}
                          onChange={(e) => setRazaoSocial(e.target.value)}
                          placeholder="Razão social da empresa"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Nome Fantasia (Opcional)</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                        <input
                          type="text"
                          value={nomeFantasia}
                          onChange={(e) => setNomeFantasia(e.target.value)}
                          placeholder="Nome fantasia"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ──── Step 2: Dados Profissionais ──── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37]" />
                  Dados Profissionais
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Registro SUSEP</label>
                    <div className="relative">
                      <Shield className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                      <input
                        type="text"
                        value={registroSusep}
                        onChange={(e) => setRegistroSusep(e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">Anos de Experiência</label>
                    <div className="relative">
                      <Clock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/30" />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={experienciaAnos}
                        onChange={(e) => setExperienciaAnos(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">Especialidade</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {ESPECIALIDADES.map((esp) => (
                      <button
                        key={esp.value}
                        type="button"
                        onClick={() => setEspecialidade(esp.value)}
                        className={cn(
                          'px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 rounded-xl text-xs sm:text-sm md:text-base font-medium transition-all text-left',
                          especialidade === esp.value
                            ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                            : 'bg-white/5 text-white/50 border border-transparent hover:border-white/10',
                        )}
                      >
                        {esp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">Operadoras que gostaria de trabalhar</label>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {OPERADORAS.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => toggleOperadora(op)}
                        className={cn(
                          'px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base transition-all',
                          op === 'Todas' && operadorasSelecionadas.includes('Todas')
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30 font-semibold'
                            : operadorasSelecionadas.includes(op)
                              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                              : 'bg-white/5 text-white/40 hover:text-white/60',
                          op === 'Todas' && 'font-semibold',
                        )}
                      >
                        {op === 'Todas' ? '✅ Todas' : op}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──── Step 3: Motivações + Modalidade ──── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37]" />
                  Por que deseja ser corretor parceiro?
                </h3>

                {/* Motivações (multi-select checkboxes) */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">
                    Selecione seus motivos <span className="text-white/30">(múltipla escolha)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {MOTIVACOES.map((mot) => {
                      const Icon = mot.icon;
                      const isSelected = motivacoes.includes(mot.value);
                      return (
                        <button
                          key={mot.value}
                          type="button"
                          onClick={() => toggleMotivacao(mot.value)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 sm:py-3.5 md:py-4 rounded-xl text-left transition-all',
                            isSelected
                              ? 'bg-[#D4AF37]/10 border-2 border-[#D4AF37]/40'
                              : 'bg-white/[0.03] border-2 border-transparent hover:border-white/10',
                          )}
                        >
                          <div className={cn(
                            'h-5 w-5 sm:h-6 sm:w-6 rounded-md flex items-center justify-center shrink-0 transition-all',
                            isSelected
                              ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50'
                              : 'bg-white/5 border border-white/15',
                          )}>
                            {isSelected && <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#D4AF37]" />}
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={cn(
                              'h-4 w-4 sm:h-5 sm:w-5 shrink-0',
                              isSelected ? 'text-[#D4AF37]' : 'text-white/30',
                            )} />
                            <span className={cn(
                              'text-xs sm:text-sm md:text-base font-medium leading-tight',
                              isSelected ? 'text-[#D4AF37]' : 'text-white/60',
                            )}>
                              {mot.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modalidade de Trabalho */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">
                    Modalidade de trabalho preferida *
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { value: 'presencial' as const, label: 'Presencial', icon: MapPin },
                      { value: 'digital' as const, label: 'Digital', icon: Monitor },
                      { value: 'hibrido' as const, label: 'Híbrido', icon: Users },
                    ].map((mod) => {
                      const ModIcon = mod.icon;
                      return (
                        <button
                          key={mod.value}
                          type="button"
                          onClick={() => setModalidadeTrabalho(mod.value)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 md:py-5 rounded-xl text-center transition-all',
                            modalidadeTrabalho === mod.value
                              ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-2 border-[#D4AF37]/40'
                              : 'bg-white/5 text-white/50 border-2 border-transparent hover:border-white/10',
                          )}
                        >
                          <ModIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                          <span className="text-xs sm:text-sm md:text-base font-medium">{mod.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Como nos conheceu */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-2 sm:mb-3 block font-medium">
                    Como nos conheceu?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COMO_CONHECEU.map((canal) => (
                      <button
                        key={canal.value}
                        type="button"
                        onClick={() => setComoConheceu(canal.value)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 sm:py-3 rounded-xl text-left transition-all',
                          comoConheceu === canal.value
                            ? 'bg-[#D4AF37]/15 border-2 border-[#D4AF37]/40'
                            : 'bg-white/[0.03] border-2 border-transparent hover:border-white/10',
                        )}
                      >
                        <span className="text-base shrink-0">{canal.icon}</span>
                        <span className={cn(
                          'text-xs sm:text-sm font-medium leading-tight',
                          comoConheceu === canal.value ? 'text-[#D4AF37]' : 'text-white/60',
                        )}>
                          {canal.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensagem adicional (opcional) */}
                <div>
                  <label className="text-xs sm:text-sm md:text-base text-white/50 mb-1 sm:mb-2 block font-medium">
                    Quer contar algo mais? <span className="text-white/30">(opcional)</span>
                  </label>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Conte mais sobre sua experiência, expectativas ou dúvidas..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 sm:py-3.5 md:py-4 text-base md:text-lg text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/40 transition-colors resize-none"
                  />
                </div>

                {/* Resumo rápido */}
                <div className="bg-white/[0.02] rounded-xl p-3 sm:p-4 md:p-5">
                  <p className="text-xs sm:text-sm md:text-base text-white/40 font-medium mb-2 sm:mb-3">Resumo da solicitação:</p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
                    <div>
                      <span className="text-white/30">Tipo:</span>
                      <p className="text-white/70">{tipoPessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                    </div>
                    <div>
                      <span className="text-white/30">Nome:</span>
                      <p className="text-white/70 truncate">{nome || '—'}</p>
                    </div>
                    <div>
                      <span className="text-white/30">E-mail:</span>
                      <p className="text-white/70 truncate">{email || '—'}</p>
                    </div>
                    <div>
                      <span className="text-white/30">{tipoPessoa === 'pf' ? 'CPF:' : 'CNPJ:'}</span>
                      <p className="text-white/70">{tipoPessoa === 'pf' ? (cpf || '—') : (cnpj || '—')}</p>
                    </div>
                    <div>
                      <span className="text-white/30">Modalidade:</span>
                      <p className="text-white/70 capitalize">{modalidadeTrabalho}</p>
                    </div>
                    <div>
                      <span className="text-white/30">Experiência:</span>
                      <p className="text-white/70">{experienciaAnos ? `${experienciaAnos} anos` : '—'}</p>
                    </div>
                  </div>
                  {operadorasSelecionadas.length > 0 && (
                    <div className="mt-2 sm:mt-3">
                      <span className="text-xs sm:text-sm md:text-base text-white/30">Operadoras:</span>
                      <p className="text-xs sm:text-sm md:text-base text-white/70">
                        {operadorasSelecionadas.includes('Todas')
                          ? 'Todas as operadoras'
                          : operadorasSelecionadas.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ──── Step 4: Termos de Uso e LGPD ──── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-5 md:space-y-6"
              >
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white flex items-center gap-2 mb-3 sm:mb-4 md:mb-5">
                  <ScrollText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37]" />
                  Termos de Uso e LGPD
                </h3>

                <div className="bg-white/[0.02] rounded-xl p-4 sm:p-5 md:p-6">
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/60 leading-relaxed mb-3 sm:mb-4">
                    Para completar seu cadastro, é obrigatório ler e aceitar nossos <strong className="text-white/80">Termos de Uso</strong> e
                    nossa <strong className="text-white/80">Política de Privacidade (LGPD)</strong>.
                  </p>

                  <p className="text-xs sm:text-sm md:text-base text-white/40 leading-relaxed mb-3 sm:mb-4">
                    Estes documentos descrevem suas responsabilidades como corretor parceiro,
                    como tratamos seus dados pessoais e seus direitos conforme a Lei nº 13.709/2018.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowTermosPopup(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 md:py-4 rounded-xl bg-white/5 border border-white/10 text-sm sm:text-base md:text-lg text-white/70 hover:text-white hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all"
                  >
                    <ScrollText className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
                    Ler Termos de Uso e Política de Privacidade
                  </button>
                </div>

                {/* Aceite Status */}
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 sm:py-4 md:py-5 rounded-xl border transition-all',
                    termosAceitos
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-white/[0.02] border-white/[0.06]',
                  )}
                >
                  <div
                    className={cn(
                      'h-5 w-5 sm:h-6 sm:w-6 rounded-md flex items-center justify-center shrink-0 transition-all',
                      termosAceitos
                        ? 'bg-green-500/20 border border-green-500/40'
                        : 'bg-white/5 border border-white/15',
                    )}
                  >
                    {termosAceitos && <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />}
                  </div>
                  <div>
                    <p className={cn(
                      'text-xs sm:text-sm md:text-base font-medium',
                      termosAceitos ? 'text-green-400' : 'text-white/50',
                    )}>
                      {termosAceitos
                        ? 'Termos aceitos ✓'
                        : 'Você ainda não aceitou os termos'}
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-white/30 mt-0.5">
                      {termosAceitos
                        ? 'Seu aceite será registrado com data, hora e IP'
                        : 'Clique acima para ler e aceitar'}
                    </p>
                  </div>
                </div>

                {/* Info legal */}
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm md:text-base text-[#D4AF37]/70 leading-relaxed">
                      Após aprovação, será necessário enviar documento de identidade com foto (CNH ou RG),
                      informar dados bancários e, para PJ, o contrato social da empresa.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs sm:text-sm md:text-base text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 sm:px-4 sm:py-3 mt-4"
            >
              {error}
            </motion.p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5 sm:mt-6 md:mt-8">
            <button
              onClick={() => {
                setError('');
                setDocError('');
                if (step === 1) router.push('/dashboard/corretor/login');
                else setStep((s) => s - 1);
              }}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-xl text-sm sm:text-base md:text-lg text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              {step === 1 ? 'Voltar ao Login' : 'Voltar'}
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black text-sm sm:text-base md:text-lg font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !termosAceitos}
                className={cn(
                  'px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-xl text-sm sm:text-base md:text-lg font-semibold transition-all flex items-center gap-2',
                  loading || !termosAceitos
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20',
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] sm:text-xs md:text-sm text-white/20 text-center mt-4 sm:mt-6">
          © {new Date().getFullYear()} Humano Saúde · Todos os direitos reservados
        </p>
      </motion.div>

      {/* Termos Popup */}
      <AnimatePresence>
        {showTermosPopup && (
          <TermosPopup
            isOpen={showTermosPopup}
            onAccept={() => {
              setTermosAceitos(true);
              setShowTermosPopup(false);
              setError('');
            }}
            onClose={() => setShowTermosPopup(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
