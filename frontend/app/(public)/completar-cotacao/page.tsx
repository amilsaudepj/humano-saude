'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import HeaderV2 from '../components/HeaderV2';
import Footer from '../components/Footer';
import { BAIRROS_RJ, OPERADORAS, FAIXAS_ETARIAS } from '@/lib/constants/cotacao';
import { isValidBrazilianPhone } from '@/lib/validations';

const QTD_VIDAS_OPCOES = [
  { value: '1', label: '1 vida' },
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

function formatWhatsApp(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : '';
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function CompletarCotacaoContent() {
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    qtdVidas: '',
    idades: ['', ''] as string[],
    bairro: '',
    possuiPlanoAtivo: '' as '' | 'sim' | 'nao',
    operadoraAtual: '',
  });

  useEffect(() => {
    const nome = searchParams.get('nome') || '';
    const email = searchParams.get('email') || '';
    setForm((p) => ({ ...p, nome: decodeURIComponent(nome), email: decodeURIComponent(email) }));
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

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nome.trim() || form.nome.trim().length < 2) e.nome = 'Nome é obrigatório (mín. 2 caracteres)';
    if (!form.email.trim()) e.email = 'E-mail é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'E-mail inválido';
    if (!form.telefone.trim()) e.telefone = 'Telefone é obrigatório';
    else if (!isValidBrazilianPhone(form.telefone.trim())) e.telefone = 'Telefone inválido. Ex: (21) 98888-7777';
    if (!form.qtdVidas) e.qtdVidas = 'Informe quantas vidas no plano';
    if (!usaBypass && form.idades.slice(0, idadesCount).some((i) => !i)) e.idades = 'Selecione a faixa etária de todos os beneficiários';
    if (!form.bairro) e.bairro = 'Selecione o bairro de atendimento';
    if (!form.possuiPlanoAtivo) e.possuiPlanoAtivo = 'Informe se possui plano ativo';
    if (form.possuiPlanoAtivo === 'sim' && !form.operadoraAtual) e.operadoraAtual = 'Selecione a operadora atual';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const idadesBeneficiarios = usaBypass ? [] : form.idades.slice(0, idadesCount).filter(Boolean);
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
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

  if (success) {
    return (
      <>
        <HeaderV2 />
        <main className="min-h-screen bg-gray-50 py-16 px-4">
          <div className="max-w-lg mx-auto text-center bg-white rounded-3xl shadow-xl p-8">
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
        <Footer />
      </>
    );
  }

  return (
    <>
      <HeaderV2 />
      <main className="min-h-screen bg-gray-50 py-12 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Complete seus dados para a <span className="text-[#B8941F]">cotação</span>
            </h1>
            <p className="text-gray-600">Preencha as informações abaixo. Em até 10 minutos nossa equipe enviará sua proposta.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 space-y-6">
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Nome completo <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setFormField('nome', e.target.value)}
                placeholder="Seu nome"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] focus:border-transparent ${errors.nome ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">E-mail <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setFormField('email', e.target.value)}
                placeholder="seu@email.com"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] focus:border-transparent ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">WhatsApp <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => setFormField('telefone', formatWhatsApp(e.target.value))}
                placeholder="(21) 99999-9999"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] focus:border-transparent ${errors.telefone ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Quantas vidas no plano? <span className="text-red-500">*</span></label>
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
              <div>
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

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Qual bairro de atendimento? <span className="text-red-500">*</span></label>
              <select
                value={form.bairro}
                onChange={(e) => setFormField('bairro', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#B8941F] ${errors.bairro ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Selecione</option>
                {BAIRROS_RJ.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.bairro && <p className="text-red-500 text-xs mt-1">{errors.bairro}</p>}
            </div>

            <div>
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
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Qual operadora? <span className="text-red-500">*</span></label>
                <select
                  value={form.operadoraAtual}
                  onChange={(e) => setFormField('operadoraAtual', e.target.value)}
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#B8941F] hover:bg-[#A07E18] text-white font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar e receber minha proposta'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Seus dados estão protegidos pela LGPD. Utilizamos apenas para gerar sua cotação.
          </p>
        </div>
      </main>
      <Footer />
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
