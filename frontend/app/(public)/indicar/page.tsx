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
      setStep('indicar'); // Sem ref = só indicar, sem etapa de cadastro (quem quer indicar sem receber nada)
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
              {afiliadoCadastradoNestaSessao ? 'Cadastro e indicação concluídos!' : semVinculo ? 'Indicação recebida!' : 'Indicação enviada!'}
            </h1>
            <p className="text-white/80 mb-4">
              {afiliadoCadastradoNestaSessao ? (
                <>
                  Sua conta de afiliado foi criada. Você receberá um e-mail com o link para acessar o painel e acompanhar suas indicações. Use &quot;Esqueci minha senha&quot; na tela de login (com seu e-mail) para definir sua senha na primeira vez.
                  <br /><br />
                  A indicação também foi enviada. O corretor entrará em contato com a pessoa indicada.
                </>
              ) : semVinculo ? (
                'A pessoa indicada será contactada pela nossa equipe. Obrigado por indicar!'
              ) : (
                'O corretor recebeu os dados e entrará em contato com a pessoa indicada em breve.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={hrefNovaIndicacao} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#F6E05E] transition-colors">
                <UserPlus className="h-4 w-4" />
                {semVinculo ? 'Indicar outra pessoa' : 'Cadastrar nova indicação'}
              </Link>
              {afiliadoCadastradoNestaSessao && (
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
              {!afiliadoCadastradoNestaSessao && semVinculo && (
                <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20">
                  Voltar ao site <ArrowRight className="h-4 w-4" />
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
            <Image src="/images/logos/LOGO 1 SEM FUNDO.png" alt="Humano Saúde" width={220} height={74} className="h-14 w-auto" />
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
                <h1 className="text-2xl font-bold text-white">Indique alguém que você conhece</h1>
                <p className="text-white/70 text-sm">
                  {semVinculo
                    ? 'Quer ajudar alguém a economizar no plano de saúde? Indique aqui. Nossa equipe entra em contato com a pessoa para oferecer as melhores opções.'
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

            {!semVinculo && !resolvido?.afiliado_id && (
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

      {/* Rodapé para credibilidade */}
      <footer className="border-t border-white/10 py-6 px-4 mt-12">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex items-center justify-center gap-6 mb-3">
            <a
              href="https://instagram.com/humanosauderj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#D4AF37] transition-colors"
              aria-label="Instagram Humano Saúde"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://wa.me/5521988179407?text=Olá!%20Gostaria%20de%20informações%20sobre%20a%20Humano%20Saúde."
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#D4AF37] transition-colors"
              aria-label="WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
          <p className="text-xs text-white/40">
            CNPJ 50.216.907/0001-60 · SUSEP nº 251174847
          </p>
        </div>
      </footer>
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
