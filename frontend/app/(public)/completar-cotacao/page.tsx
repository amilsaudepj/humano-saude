'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import HeaderV2 from '../components/HeaderV2';
import Footer from '../components/Footer';
import { BAIRROS_POR_ZONA, OPERADORAS, FAIXAS_ETARIAS } from '@/lib/constants/cotacao';
import { validarCNPJ } from '@/lib/validations';

/** Formata 14 dígitos como CNPJ: 00.000.000/0000-00 */
function formatCNPJDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const QTD_VIDAS_OPCOES = [
  { value: '2', label: '2 vidas' },
  { value: '3', label: '3 vidas' },
  { value: '4', label: '4 vidas' },
  { value: '5', label: '5 vidas' },
  { value: '6-10', label: '6 a 10 vidas' },
  { value: '11-20', label: '11 a 20 vidas' },
  { value: '21-29', label: '21 a 29 vidas' },
  { value: '30-49', label: '30 a 49 vidas' },
  { value: '50-99', label: '50 a 99 vidas' },
  { value: '100+', label: '100+ vidas' },
];

function CompletarCotacaoContent() {
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    empresa: '',
    qtdVidas: '',
    idades: ['', ''] as string[],
    bairro: '',
    possuiPlanoAtivo: '' as '' | 'sim' | 'nao',
    operadoraAtual: '',
  });
  const successRef = useRef<HTMLDivElement>(null);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  useEffect(() => {
    const nome = searchParams.get('nome') || '';
    const email = searchParams.get('email') || '';
    const telefone = searchParams.get('telefone') || '';
    setForm((p) => ({
      ...p,
      nome: decodeURIComponent(nome),
      email: decodeURIComponent(email),
      telefone: decodeURIComponent(telefone),
    }));
  }, [searchParams]);

  const qtdNum = form.qtdVidas ? (form.qtdVidas.includes('-') || form.qtdVidas === '100+' ? 0 : parseInt(form.qtdVidas, 10)) : 0;
  const usaBypass = qtdNum === 0 && !!form.qtdVidas;
  const idadesCount = Math.min(Math.max(qtdNum, 1), 5);

  const updateIdadesLength = useCallback(() => {
    if (usaBypass) return;
    setForm((p) => {
      const current = p.idades.length;
      if (idadesCount === current) return p;
      if (idadesCount > current) {
        return { ...p, idades: [...p.idades, ...Array(idadesCount - current).fill('')] };
      }
      return { ...p, idades: p.idades.slice(0, idadesCount) };
    });
  }, [idadesCount, usaBypass]);

  useEffect(() => {
    updateIdadesLength();
  }, [updateIdadesLength]);

  const setFormField = (field: string, value: string | string[]) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const setUmaIdade = (index: number, value: string) => {
    setForm((p) => {
      const next = [...p.idades];
      next[index] = value;
      return { ...p, idades: next };
    });
  };

  const bairroRef = useRef<HTMLSelectElement>(null);
  const operadoraRef = useRef<HTMLSelectElement>(null);
  const scrollSelectIntoView = (ref: React.RefObject<HTMLSelectElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const consultarCnpj = useCallback(async (cnpjInput: string) => {
    const cleanCnpj = cnpjInput.replace(/\D/g, '').slice(0, 14);
    if (cleanCnpj.length !== 14 || !validarCNPJ(cleanCnpj)) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`/api/cnpj?cnpj=${cleanCnpj}`);
      const data = await res.json();
      if (!res.ok) {
        setForm((p) => ({ ...p, empresa: '' }));
        return;
      }
      const nomeEmpresa = data.empresa || data.razao_social || data.nome_fantasia || '';
      setForm((p) => ({ ...p, empresa: nomeEmpresa }));
    } catch {
      setForm((p) => ({ ...p, empresa: '' }));
    } finally {
      setCnpjLoading(false);
    }
  }, []);

  const ORDER_OF_FIELDS = ['submit', 'cnpj', 'qtdVidas', 'idades', 'bairro', 'possuiPlanoAtivo', 'operadoraAtual'] as const;

  const validate = (): Record<string, string> | null => {
    const err: Record<string, string> = {};
    if (!form.nome.trim() || form.nome.trim().length < 2) err.submit = 'Acesse pelo link enviado no seu e-mail para preencher seus dados.';
    else if (!form.email.trim()) err.submit = 'Acesse pelo link enviado no seu e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) err.submit = 'Link inválido. Use o link do e-mail que enviamos.';
    const cnpjDigits = form.cnpj.replace(/\D/g, '');
    if (!cnpjDigits || cnpjDigits.length !== 14) err.cnpj = 'Informe o CNPJ da empresa (14 dígitos)';
    else if (!validarCNPJ(form.cnpj)) err.cnpj = 'CNPJ inválido';
    if (!form.qtdVidas) err.qtdVidas = 'Informe quantas vidas no plano';
    if (!usaBypass && form.idades.slice(0, idadesCount).some((i) => !i)) err.idades = 'Selecione a faixa etária de todos os beneficiários';
    if (!form.bairro) err.bairro = 'Selecione o bairro de atendimento';
    if (!form.possuiPlanoAtivo) err.possuiPlanoAtivo = 'Informe se possui plano ativo';
    if (form.possuiPlanoAtivo === 'sim' && !form.operadoraAtual) err.operadoraAtual = 'Selecione a operadora atual';
    setErrors(err);
    if (Object.keys(err).length === 0) return null;
    const first = ORDER_OF_FIELDS.find((k) => err[k]);
    if (first) {
      setTimeout(() => {
        const el = first === 'submit' ? document.getElementById('form-completar-cotacao') : document.getElementById(`field-${first}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el?.querySelector('input, select') as HTMLInputElement | HTMLSelectElement | null;
        if (input && first !== 'submit') input.focus();
      }, 100);
    }
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() !== null) return;
    setLoading(true);
    setErrors({});
    try {
      const idadesBeneficiarios = usaBypass ? [] : form.idades.slice(0, idadesCount).filter(Boolean);
      const cnpjDigits = form.cnpj.replace(/\D/g, '');
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || undefined,
        cnpj: cnpjDigits.length === 14 ? cnpjDigits : undefined,
        empresa: form.empresa.trim() || undefined,
        perfil: 'Empresarial',
        tipo_contratacao: 'PME',
        origem: 'email_form' as const,
        bairro: form.bairro === 'Outros' ? form.bairro : form.bairro,
        operadora_atual: form.possuiPlanoAtivo === 'sim' ? form.operadoraAtual : null,
        idades_beneficiarios: idadesBeneficiarios,
        usa_bypass: usaBypass,
        qtd_vidas_estimada: usaBypass ? form.qtdVidas : undefined,
      };
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ submit: data.error || data.details || 'Erro ao enviar. Tente novamente.' });
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setErrors({ submit: 'Erro de conexão. Tente novamente.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => clearTimeout(t);
  }, [success]);

  if (success) {
    return (
      <>
        <HeaderV2 minimal />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
          <div ref={successRef} className="max-w-lg w-full text-center bg-white rounded-3xl shadow-xl p-8 scroll-mt-32">
            <div className="w-16 h-16 rounded-full bg-[#B8941F]/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-[#B8941F]">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Dados recebidos!</h1>
            <p className="text-gray-600 mb-6">
              Nossa equipe gerará sua proposta personalizada em até 10 minutos e entrará em contato por e-mail ou WhatsApp.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#B8941F] text-white font-semibold rounded-xl hover:bg-[#A07E18] transition-colors"
            >
              Voltar ao site
            </Link>
          </div>
        </main>
        <Footer hideLinksRapidos />
      </>
    );
  }

  return (
    <>
      <HeaderV2 minimal />
      <main className="min-h-screen bg-gray-50 pt-32 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 px-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Complete seus dados para a <span className="text-[#B8941F]">cotação</span>
            </h1>
            <p className="text-gray-600">
              Preencha as informações abaixo.<br />
              Em até 10 minutos nossa equipe enviará sua proposta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-7 scroll-mt-32" id="form-completar-cotacao">
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            <div id="field-cnpj">
              <label className="block text-sm font-bold text-gray-900 mb-2">CNPJ da empresa <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formatCNPJDisplay(form.cnpj)}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 14);
                  setForm((p) => ({ ...p, cnpj: v, empresa: v.length !== 14 ? '' : p.empresa }));
                  if (v.length < 14) {
                    setErrors((prev) => (prev.cnpj ? { ...prev, cnpj: '' } : prev));
                  } else if (v.length === 14) {
                    if (validarCNPJ(v)) {
                      setErrors((prev) => (prev.cnpj ? { ...prev, cnpj: '' } : prev));
                      consultarCnpj(v);
                    } else {
                      setErrors((prev) => ({ ...prev, cnpj: 'CNPJ inválido' }));
                    }
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 14);
                  setForm((p) => ({ ...p, cnpj: pasted, empresa: pasted.length !== 14 ? '' : p.empresa }));
                  if (pasted.length < 14) {
                    setErrors((prev) => (prev.cnpj ? { ...prev, cnpj: '' } : prev));
                  } else if (pasted.length === 14) {
                    if (validarCNPJ(pasted)) {
                      setErrors((prev) => (prev.cnpj ? { ...prev, cnpj: '' } : prev));
                      consultarCnpj(pasted);
                    } else {
                      setErrors((prev) => ({ ...prev, cnpj: 'CNPJ inválido' }));
                    }
                  }
                }}
                onBlur={() => {
                  const d = form.cnpj.replace(/\D/g, '');
                  if (d.length === 14) {
                    if (validarCNPJ(form.cnpj)) consultarCnpj(d);
                    else setErrors((prev) => ({ ...prev, cnpj: 'CNPJ inválido' }));
                  }
                }}
                placeholder="00.000.000/0000-00"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] focus:border-transparent ${errors.cnpj ? 'border-red-400' : 'border-gray-300'}`}
              />
              {cnpjLoading && <p className="text-gray-500 text-xs mt-1">Buscando razão social...</p>}
              {form.empresa && !cnpjLoading && <p className="text-green-700 text-sm mt-1 font-medium">Empresa: {form.empresa}</p>}
              {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Nome da empresa</label>
              <input
                type="text"
                autoComplete="organization"
                value={form.empresa}
                onChange={(e) => setFormField('empresa', e.target.value)}
                placeholder="Preenchido automaticamente pelo CNPJ ou digite manualmente"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B8941F] focus:border-transparent"
              />
            </div>

            <div id="field-qtdVidas">
              <label className="block text-sm font-bold text-gray-900 mb-2">Quantas vidas no plano? (mín. 2) <span className="text-red-500">*</span></label>
              <select
                value={form.qtdVidas}
                onChange={(e) => setFormField('qtdVidas', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] ${errors.qtdVidas ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Selecione</option>
                {QTD_VIDAS_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.qtdVidas && <p className="text-red-500 text-xs mt-1">{errors.qtdVidas}</p>}
            </div>

            {!usaBypass && form.qtdVidas && qtdNum >= 1 && qtdNum <= 5 && (
              <div id="field-idades">
                <label className="block text-sm font-bold text-gray-900 mb-2">Quais as idades (faixa etária)? <span className="text-red-500">*</span></label>
                <div className="space-y-3">
                  {form.idades.slice(0, idadesCount).map((idade, i) => (
                    <div key={i}>
                      <span className="text-gray-500 text-sm mr-2">Beneficiário {i + 1}:</span>
                      <select
                        value={idade}
                        onChange={(e) => setUmaIdade(i, e.target.value)}
                        className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B8941F]"
                      >
                        <option value="">Selecione a faixa</option>
                        {FAIXAS_ETARIAS.map((f) => (
                          <option key={f} value={f}>{f} anos</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                {errors.idades && <p className="text-red-500 text-xs mt-1">{errors.idades}</p>}
              </div>
            )}

            <div className="scroll-mt-32" id="field-bairro">
              <label className="block text-sm font-bold text-gray-900 mb-2">Qual bairro de atendimento? <span className="text-red-500">*</span></label>
              <select
                ref={bairroRef}
                value={form.bairro}
                onChange={(e) => setFormField('bairro', e.target.value)}
                onFocus={() => scrollSelectIntoView(bairroRef)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] ${errors.bairro ? 'border-red-400' : 'border-gray-300'}`}
                aria-label="Bairro de atendimento por zona"
              >
                <option value="">Selecione o bairro</option>
                {BAIRROS_POR_ZONA.map((z) => (
                  <optgroup key={z.zona} label={z.zona}>
                    {z.bairros.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.bairro && <p className="text-red-500 text-xs mt-1">{errors.bairro}</p>}
            </div>

            <div id="field-possuiPlanoAtivo">
              <label className="block text-sm font-bold text-gray-900 mb-2">Possui plano de saúde ativo? <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="possuiPlanoAtivo"
                    checked={form.possuiPlanoAtivo === 'sim'}
                    onChange={() => setFormField('possuiPlanoAtivo', 'sim')}
                    className="text-[#B8941F] focus:ring-[#B8941F]"
                  />
                  <span>Sim</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="possuiPlanoAtivo"
                    checked={form.possuiPlanoAtivo === 'nao'}
                    onChange={() => { setFormField('possuiPlanoAtivo', 'nao'); setFormField('operadoraAtual', ''); }}
                    className="text-[#B8941F] focus:ring-[#B8941F]"
                  />
                  <span>Não</span>
                </label>
              </div>
              {errors.possuiPlanoAtivo && <p className="text-red-500 text-xs mt-1">{errors.possuiPlanoAtivo}</p>}
            </div>

            {form.possuiPlanoAtivo === 'sim' && (
              <div className="scroll-mt-32" id="field-operadoraAtual">
                <label className="block text-sm font-bold text-gray-900 mb-2">Qual operadora? <span className="text-red-500">*</span></label>
                <select
                  ref={operadoraRef}
                  value={form.operadoraAtual}
                  onChange={(e) => setFormField('operadoraAtual', e.target.value)}
                  onFocus={() => scrollSelectIntoView(operadoraRef)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] ${errors.operadoraAtual ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Selecione</option>
                  {OPERADORAS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {errors.operadoraAtual && <p className="text-red-500 text-xs mt-1">{errors.operadoraAtual}</p>}
              </div>
            )}

            <div className="pt-6 sm:pt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-[#B8941F] hover:bg-[#A07E18] text-white font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    Enviar e receber minha proposta
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6 sm:mt-8 px-2">
            Seus dados estão protegidos pela LGPD. Utilizamos apenas para gerar sua cotação.
          </p>
        </div>
      </main>
      <Footer hideLinksRapidos />
    </>
  );
}

export default function CompletarCotacaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    }>
      <CompletarCotacaoContent />
    </Suspense>
  );
}
