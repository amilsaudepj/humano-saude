'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { resolverRefParaCorretor, cadastrarAfiliadoPorRef } from '@/app/actions/corretor-afiliados';
import { salvarLeadIndicacao } from '@/app/actions/leads-indicacao';
import { saveLeadIndicacaoAdmin, saveLeadSejaAfiliadoAdmin } from '@/app/actions/leads';
import { UserPlus, CheckCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

type Step = 'cadastro' | 'indicar';

/** Formata telefone enquanto digita: (21) 99999-9999 */
function formatPhone(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return nums ? `(${nums}` : '';
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

/** Formata CPF enquanto digita: 000.000.000-00 */
function formatCpf(value: string): string {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

/** Fluxo 2 etapas: Step 1 = cadastro do afiliado (nome, email, telefone, CPF); Step 2 = formulário da indicação. */
function IndicarContent() {
  const searchParams = useSearchParams();
  const refParam = (searchParams.get('ref') || '').trim();

  const [step, setStep] = useState<Step>('cadastro');
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [resolvido, setResolvido] = useState<{
    corretor_id: string;
    afiliado_id?: string;
    nome_corretor?: string;
    nome_afiliado?: string;
  } | null>(null);
  const [semVinculo, setSemVinculo] = useState(false);
  const [refAtual, setRefAtual] = useState(refParam);
  const [erro, setErro] = useState<string>('');
  const [afiliadoCadastradoNestaSessao, setAfiliadoCadastradoNestaSessao] = useState(false);
  /** Afiliado criado no step 1 (sem vínculo) para vincular a indicação no painel */
  const [afiliadoIdSemVinculo, setAfiliadoIdSemVinculo] = useState<string | null>(null);

  const [nomeAfiliado, setNomeAfiliado] = useState('');
  const [emailAfiliado, setEmailAfiliado] = useState('');
  const [telefoneAfiliado, setTelefoneAfiliado] = useState('');
  const [cpfAfiliado, setCpfAfiliado] = useState('');
  const [enviandoCadastro, setEnviandoCadastro] = useState(false);

  /** Gera senha aleatória (12 caracteres). O afiliado pode alterar no painel. */
  const gerarSenhaAleatoria = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 12; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  };

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedRef = useRef(false);

  useEffect(() => {
    if (refParam === '') {
      setSemVinculo(true);
      setStatus('form');
      return;
    }

    skippedRef.current = false;
    let cancelled = false;

    timeoutRef.current = setTimeout(() => {
      if (cancelled || skippedRef.current) return;
      setErro('Tempo esgotado. Verifique o link ou tente novamente.');
      setStatus('error');
    }, 6000);

    resolverRefParaCorretor(refParam).then((result) => {
      if (cancelled || skippedRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      if (result.success && result.corretor_id) {
        setResolvido({
          corretor_id: result.corretor_id,
          afiliado_id: result.afiliado_id,
          nome_corretor: result.nome_corretor ?? undefined,
          nome_afiliado: result.nome_afiliado ?? undefined,
        });
        setRefAtual(refParam);
        setStatus('form');
        // Afiliado já cadastrado (ref = token do afiliado): ir direto para o formulário de indicação, sem etapa de cadastro
        if (result.afiliado_id) setStep('indicar');
      } else {
        setErro(result.error || 'Link inválido ou expirado.');
        setStatus('error');
      }
    }).catch(() => {
      if (cancelled || skippedRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setErro('Erro ao validar o link. Tente novamente.');
      setStatus('error');
    });

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [refParam]);

  const handleSubmitCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    const tel = telefoneAfiliado.replace(/\D/g, '');
    if (tel.length < 10) {
      setErro('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }
    if (!nomeAfiliado.trim() || !emailAfiliado.trim()) {
      setErro('Nome e e-mail são obrigatórios.');
      return;
    }
    const cpfNumeros = cpfAfiliado.replace(/\D/g, '');
    if (cpfNumeros.length !== 11) {
      setErro('Informe um CPF válido com 11 dígitos.');
      return;
    }

    setEnviandoCadastro(true);
    setErro('');

    if (semVinculo) {
      const result = await saveLeadSejaAfiliadoAdmin({
        nome: nomeAfiliado.trim(),
        email: emailAfiliado.trim(),
        telefone: telefoneAfiliado.trim(),
        cpf: cpfAfiliado.replace(/\D/g, ''),
      });
      setEnviandoCadastro(false);
      if (result.success) {
        if (result.afiliado_id) setAfiliadoIdSemVinculo(result.afiliado_id);
        setStep('indicar');
      } else {
        setErro(result.message || result.error || 'Não foi possível enviar. Tente de novo.');
      }
      return;
    }

    if (!resolvido?.corretor_id) {
      setEnviandoCadastro(false);
      return;
    }

    const result = await cadastrarAfiliadoPorRef(refAtual, {
      nome: nomeAfiliado.trim(),
      email: emailAfiliado.trim(),
      telefone: telefoneAfiliado.trim(),
      cpf: cpfAfiliado.replace(/\D/g, ''),
      senha: gerarSenhaAleatoria(),
    });

    setEnviandoCadastro(false);
    if (result.success && result.token) {
      setRefAtual(result.token);
      setResolvido((r) => (r ? { ...r, afiliado_id: result.afiliado_id } : null));
      setAfiliadoCadastradoNestaSessao(true);
      setStep('indicar');
    } else {
      setErro(result.error || 'Não foi possível cadastrar. Tente de novo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tel = telefone.replace(/\D/g, '');
    if (tel.length < 10) {
      setErro('Informe um telefone/WhatsApp válido com DDD.');
      return;
    }
    if (!nome.trim()) {
      setErro('Informe o nome da pessoa que você está indicando.');
      return;
    }

    setEnviando(true);
    setErro('');

    if (semVinculo) {
      const result = await saveLeadIndicacaoAdmin({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || undefined,
        mensagem: mensagem.trim() || undefined,
        afiliado_id: afiliadoIdSemVinculo ?? undefined,
      });
      setEnviando(false);
      if (result.success) {
        setStatus('success');
      } else {
        setErro(result.message || result.error || 'Não foi possível enviar. Tente de novo.');
      }
      return;
    }

    const resolved = await resolverRefParaCorretor(refAtual);
    if (!resolved.success || !resolved.corretor_id) {
      setEnviando(false);
      setErro('Link inválido. Atualize a página.');
      return;
    }

    const result = await salvarLeadIndicacao({
      corretor_id: resolved.corretor_id,
      afiliado_id: resolved.afiliado_id,
      origem: 'form_indicar_afiliado',
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      metadata: mensagem.trim() ? { mensagem_indicador: mensagem.trim() } : undefined,
    });

    setEnviando(false);
    if (result.success) {
      setStatus('success');
    } else {
      setErro(result.error || 'Não foi possível enviar. Tente de novo.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 gap-6">
        <div className="flex flex-col items-center gap-4 text-white/80">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
          <p>Validando link...</p>
        </div>
        <button
          type="button"
          className="text-[#D4AF37] hover:underline text-sm"
          onClick={() => {
            skippedRef.current = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            setSemVinculo(true);
            setStatus('form');
          }}
        >
          Continuar sem vínculo com corretor
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 mb-6">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white mb-2">Link inválido</h1>
            <p className="text-white/70">{erro}</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-[#D4AF37] font-semibold hover:underline">
            Ir para o início <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    const hrefNovaIndicacao = refAtual ? `/indicar?ref=${encodeURIComponent(refAtual)}` : '/indicar';
    const isRefAfiliado = Boolean(resolvido?.afiliado_id);
    const isRefCorretor = Boolean(resolvido?.corretor_id) && !resolvido?.afiliado_id;
    const dashboardAfiliado = '/dashboard/afiliado';
    const dashboardCorretor = '/dashboard/corretor';

    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-8">
            <CheckCircle className="h-16 w-16 text-[#D4AF37] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {afiliadoCadastradoNestaSessao ? 'Cadastro e indicação concluídos!' : semVinculo ? 'Cadastro e indicação recebidos!' : 'Indicação enviada!'}
            </h1>
            <p className="text-white/80 mb-4">
              {afiliadoCadastradoNestaSessao ? (
                <>
                  Sua conta de afiliado foi criada. Você receberá um e-mail com o link para acessar o painel e acompanhar suas indicações. Use &quot;Esqueci minha senha&quot; na tela de login (com seu e-mail) para definir sua senha na primeira vez.
                  <br /><br />
                  A indicação também foi enviada. O corretor entrará em contato com a pessoa indicada.
                </>
              ) : semVinculo ? (
                <>
                  Sua conta de afiliado foi criada. Você receberá um e-mail com o link e os dados para acessar o painel (e-mail e senha temporária). A indicação também foi recebida e a pessoa indicada será contactada pela nossa equipe.
                </>
              ) : (
                'O corretor recebeu os dados e entrará em contato com a pessoa indicada em breve.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={hrefNovaIndicacao} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] transition-colors">
                <UserPlus className="h-4 w-4" />
                Cadastrar nova indicação
              </Link>
              {(afiliadoCadastradoNestaSessao || semVinculo) && (
                <Link href="/dashboard/afiliado/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20">
                  Acessar painel do afiliado
                </Link>
              )}
              {!afiliadoCadastradoNestaSessao && !semVinculo && isRefAfiliado && (
                <Link href={dashboardAfiliado} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20">
                  Voltar ao painel do afiliado <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {!afiliadoCadastradoNestaSessao && !semVinculo && isRefCorretor && (
                <Link href={dashboardCorretor} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20">
                  Voltar ao painel do corretor <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {!afiliadoCadastradoNestaSessao && semVinculo && !resolvido && (
                <Link href="/seja-afiliado" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20">
                  Voltar ao início <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 py-4">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logos/LOGO 1 SEM FUNDO.png" alt="Humano Saúde" width={140} height={47} className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        {step === 'cadastro' ? (
          <>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Primeiro: seus dados</h1>
                <p className="text-white/70 text-sm">
                  {semVinculo
                    ? 'Cadastre-se como afiliado. Depois você poderá indicar alguém.'
                    : 'Cadastre-se para indicar e receber seu link. Depois preencha os dados de quem você quer indicar.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitCadastro} className="space-y-5">
              {erro && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{erro}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Seu nome *</label>
                <input
                  type="text"
                  value={nomeAfiliado}
                  onChange={(e) => setNomeAfiliado(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Seu e-mail *</label>
                <input
                  type="email"
                  value={emailAfiliado}
                  onChange={(e) => setEmailAfiliado(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Seu telefone / WhatsApp *</label>
                <input
                  type="tel"
                  value={telefoneAfiliado}
                  onChange={(e) => setTelefoneAfiliado(formatPhone(e.target.value))}
                  placeholder="(21) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">CPF *</label>
                <input
                  type="text"
                  value={cpfAfiliado}
                  onChange={(e) => setCpfAfiliado(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition"
                  required
                />
              </div>

              {!semVinculo && (
                <p className="text-xs text-white/50">
                  Uma senha de acesso será gerada automaticamente. Você pode alterá-la no painel quando quiser.
                </p>
              )}

              <button
                type="submit"
                disabled={enviandoCadastro}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviandoCadastro ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Continuar e indicar alguém <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Quero apenas indicar</h1>
                <p className="text-white/70 text-sm">
                  {semVinculo
                    ? 'Indique alguém para a Humano Saúde. Nossa equipe entrará em contato com a pessoa indicada.'
                    : resolvido?.nome_afiliado
                      ? `Indique alguém para ${resolvido.nome_corretor || 'o corretor'} (por ${resolvido.nome_afiliado})`
                      : resolvido?.nome_corretor
                        ? `Indique alguém para ${resolvido.nome_corretor}`
                        : 'Preencha os dados da pessoa que você quer indicar. O corretor entrará em contato.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {erro && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{erro}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Nome da pessoa indicada *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  placeholder="(21) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">E-mail (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">Mensagem (opcional)</label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Alguma informação útil sobre a pessoa indicada..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar indicação <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
              Ao enviar, você concorda que o corretor entre em contato com a pessoa indicada para oferta de planos de saúde.
            </p>

            {!resolvido?.afiliado_id && (
              <button
                type="button"
                onClick={() => setStep('cadastro')}
                className="mt-4 w-full py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Voltar e alterar meus dados
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function IndicarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <IndicarContent />
    </Suspense>
  );
}
