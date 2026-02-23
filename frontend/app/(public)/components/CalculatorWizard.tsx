'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { trackGTMCalculation, trackGTMLeadSubmission } from '@/app/components/GoogleTagManager';
import { trackCalculation, trackLeadSubmission } from '@/app/components/GoogleAnalytics';
import { trackLeadGeneration, trackQuoteStart } from '@/app/lib/metaPixel';
import { calculatorLeadSchema, getZodErrors } from '@/lib/validations';
import type { CalculadoraState, PlanoResultado } from './Calculator.types';

const TOTAL_STEPS = 6;
const faixas = ['0-18','19-23','24-28','29-33','34-38','39-43','44-48','49-53','54-58','59+'];

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = 0; i < len; i++) {
      sum += parseInt(digits[i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  if (calc(12) !== parseInt(digits[12])) return false;
  if (calc(13) !== parseInt(digits[13])) return false;
  return true;
}

export default function CalculatorWizard() {
  const [state, setState] = useState<CalculadoraState>({
    step: 1, intencao: '', perfilCnpj: '', tipoContrato: 'PME', cnpj: '', empresa: '',
    acomodacao: '', beneficiarios: [{ id: 1, idade: '' }, { id: 2, idade: '' }], usaBypass: false,
    qtdVidasEstimada: '', bairro: '', nome: '', email: '', telefone: '',
    resultados: [], isLoading: false,
  });
  const [cErr, setCErr] = useState<Record<string, string>>({});
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const consultarCnpj = useCallback(async (cnpjInput: string) => {
    const cleanCnpj = cnpjInput.replace(/\D/g, '').slice(0, 14);
    if (cleanCnpj.length !== 14 || !validarCNPJ(cleanCnpj)) return;
    setCnpjLoading(true);
    try {
      const res = await fetch(`/api/cnpj?cnpj=${cleanCnpj}`);
      const data = await res.json();
      if (res.ok) {
        const nomeEmpresa = data.empresa || data.razao_social || data.nome_fantasia || '';
        setState(p => ({ ...p, empresa: nomeEmpresa }));
      } else {
        setState(p => ({ ...p, empresa: '' }));
      }
    } catch {
      setState(p => ({ ...p, empresa: '' }));
    } finally {
      setCnpjLoading(false);
    }
  }, []);
  const addB = () => setState(p => ({ ...p, beneficiarios: [...p.beneficiarios, { id: Date.now(), idade: '' }] }));
  const rmB = (id: number) => { if (state.beneficiarios.length > 2) setState(p => ({ ...p, beneficiarios: p.beneficiarios.filter(b => b.id !== id) })); };
  const updB = (id: number, v: string) => setState(p => ({ ...p, beneficiarios: p.beneficiarios.map(b => b.id === id ? { ...b, idade: v } : b) }));
  const nxt = () => setState(p => ({ ...p, step: p.step + 1 }));
  const bck = () => setState(p => ({ ...p, step: p.step - 1 }));
  const sc = (a: boolean) => a ? 'border-[#B8941F] bg-[#B8941F]/5' : 'border-gray-200';

  // ─── Auto-save: salvar lead parcial se usuário abandonar a partir do step 3 ───
  const savedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const salvarParcial = useCallback(() => {
    const s = stateRef.current;
    // Só salva se tem CNPJ preenchido e ainda não salvou / não finalizou
    if (savedRef.current || !s.cnpj || s.cnpj.replace(/\D/g, '').length < 14 || s.step === TOTAL_STEPS) return;
    savedRef.current = true;
    const ids = s.usaBypass ? [] : s.beneficiarios.map(b => b.idade).filter(Boolean);
    const payload = {
      nome: s.nome || '', email: s.email || '', telefone: s.telefone || '',
      perfil: s.tipoContrato, tipo_contratacao: s.tipoContrato,
      cnpj: s.cnpj || null, empresa: s.empresa || undefined, acomodacao: s.acomodacao || '',
      idades_beneficiarios: ids, bairro: s.bairro || '',
      intencao: s.intencao, perfil_cnpj: s.perfilCnpj,
      usa_bypass: s.usaBypass, qtd_vidas_estimada: s.qtdVidasEstimada || undefined,
      origem: 'calculadora' as const, parcial: true,
    };
    // sendBeacon é mais confiável em beforeunload
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/leads', JSON.stringify(payload));
    } else {
      fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onBeforeUnload = () => salvarParcial();
    const onVisChange = () => { if (document.visibilityState === 'hidden') salvarParcial(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [salvarParcial]);

  const calcular = async () => {
    const v = calculatorLeadSchema.safeParse({ nome: state.nome, email: state.email, telefone: state.telefone, perfil: state.tipoContrato });
    if (!v.success) { setCErr(getZodErrors(v.error)); return; }
    setCErr({});
    setState(p => ({ ...p, isLoading: true }));
    trackQuoteStart({ tipoContratacao: state.tipoContrato, idades: state.usaBypass ? [] : state.beneficiarios.map(b => parseInt(b.idade) || 0) });
    const ids = state.usaBypass ? [] : state.beneficiarios.map(b => b.idade).filter(Boolean);
    try {
      const r = await fetch('/api/calculadora', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_contratacao: state.tipoContrato, acomodacao: state.acomodacao, idades: ids, cnpj: state.cnpj || undefined, qtd_vidas: state.usaBypass ? parseInt(state.qtdVidasEstimada) || 2 : undefined }) });
      const d = await r.json();
      if (d.success) {
        const adj = d.resultados.map((p: PlanoResultado) => ({ ...p, valorTotal: p.valorTotal * 1.25 }));
        setState(p => ({ ...p, resultados: adj, isLoading: false, step: TOTAL_STEPS }));
        trackGTMCalculation({ tipo: state.tipoContrato, acomodacao: state.acomodacao, totalPlanos: d.total, valorMaisBarato: adj[0]?.valorTotal });
        trackCalculation({ tipo: state.tipoContrato, acomodacao: state.acomodacao, totalPlanos: d.total });
      } else { alert('Erro ao calcular.'); setState(p => ({ ...p, isLoading: false })); }
    } catch (e) { console.error(e); setState(p => ({ ...p, isLoading: false })); }
  };

  const finalizar = async () => {
    savedRef.current = true; // Evitar auto-save duplicado
    const ids = state.usaBypass ? [] : state.beneficiarios.map(b => b.idade).filter(Boolean);
    try {
      await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: state.nome, email: state.email, telefone: state.telefone, perfil: state.tipoContrato, tipo_contratacao: state.tipoContrato, cnpj: state.cnpj || null, empresa: state.empresa || undefined, acomodacao: state.acomodacao, idades_beneficiarios: ids, bairro: state.bairro, intencao: state.intencao, perfil_cnpj: state.perfilCnpj, usa_bypass: state.usaBypass, qtd_vidas_estimada: state.qtdVidasEstimada, top_3_planos: state.resultados.slice(0, 3).map(p => p.nome), origem: 'calculadora' }) });
      trackLeadGeneration({ leadId: `calc-${Date.now()}`, nome: state.nome, operadora: state.resultados[0]?.operadora || 'N/A', valorProposto: state.resultados[0]?.valorTotal || 0, economiaEstimada: 0 });
      trackGTMLeadSubmission({ nome: state.nome, email: state.email, telefone: state.telefone, perfil: state.tipoContrato });
      trackLeadSubmission({ nome: state.nome, perfil: state.tipoContrato, source: 'calculator_wizard' });
      document.cookie = 'hs_ok=1; path=/; max-age=120; SameSite=Lax';
      window.location.href = '/obrigado';
    } catch (e) { console.error(e); }
  };

  return (
    <section id="calculadora" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-[2rem] xl:text-[2.25rem] font-bold text-black mb-4 leading-tight">Simule seu <span className="text-[#B8941F]">Plano de Saúde</span> com CNPJ</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Em menos de 2 minutos, descubra quanto sua empresa pode economizar</p>
        </div>

        {state.step < TOTAL_STEPS && (
          <div className="mb-8 sm:mb-12">
            <div className="flex justify-between mb-4">
              {[1,2,3,4,5].map(s => (
                <div key={s} className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full font-bold text-sm sm:text-base transition-all ${state.step > s ? 'bg-[#B8941F] text-white' : state.step === s ? 'bg-[#B8941F] text-white ring-4 ring-[#B8941F]/30' : 'bg-gray-200 text-gray-400'}`}>
                    {state.step > s ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : s}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-[#B8941F] h-2 rounded-full transition-all duration-500" style={{ width: `${(state.step / 5) * 100}%` }} /></div>
          </div>
        )}

        {state.step === 1 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 text-center leading-[1.1]">Qual é o seu objetivo hoje?</h2>
            <p className="text-gray-500 text-center mb-8">Selecione a opção que melhor descreve sua necessidade</p>
            <div className="grid md:grid-cols-2 gap-6">
              <button onClick={() => { setState(p => ({ ...p, intencao: 'reduzir' })); setTimeout(nxt, 300); }} className={`p-8 border-2 rounded-2xl hover:border-[#B8941F] hover:shadow-lg transition-all text-left ${sc(state.intencao === 'reduzir')}`}>
                <svg className="w-12 h-12 text-[#B8941F] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reduzir custo atual</h3>
                <p className="text-gray-500 text-sm">Já tenho plano e quero pagar menos mantendo a qualidade</p>
              </button>
              <button onClick={() => { setState(p => ({ ...p, intencao: 'contratar' })); setTimeout(nxt, 300); }} className={`p-8 border-2 rounded-2xl hover:border-[#B8941F] hover:shadow-lg transition-all text-left ${sc(state.intencao === 'contratar')}`}>
                <svg className="w-12 h-12 text-[#B8941F] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contratar o 1º plano</h3>
                <p className="text-gray-500 text-sm">Ainda não tenho plano e quero encontrar a melhor opção</p>
              </button>
            </div>
          </div>
        )}

        {state.step === 2 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 text-center leading-[1.1]">Qual é o perfil do seu CNPJ?</h2>
            <p className="text-gray-500 text-center mb-8">Isso nos ajuda a encontrar tabelas específicas para sua empresa</p>
            <div className="grid md:grid-cols-2 gap-6">
              <button onClick={() => { setState(p => ({ ...p, perfilCnpj: 'mei' })); setTimeout(nxt, 300); }} className={`p-8 border-2 rounded-2xl hover:border-[#B8941F] hover:shadow-lg transition-all text-left ${sc(state.perfilCnpj === 'mei')}`}>
                <svg className="w-12 h-12 text-[#B8941F] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sou MEI</h3>
                <p className="text-gray-500 text-sm">Microempreendedor Individual</p>
              </button>
              <button onClick={() => { setState(p => ({ ...p, perfilCnpj: 'pme' })); setTimeout(nxt, 300); }} className={`p-8 border-2 rounded-2xl hover:border-[#B8941F] hover:shadow-lg transition-all text-left ${sc(state.perfilCnpj === 'pme')}`}>
                <svg className="w-12 h-12 text-[#B8941F] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sou PME / Empresa</h3>
                <p className="text-gray-500 text-sm">ME, EPP ou demais empresas</p>
              </button>
            </div>
            <button onClick={bck} className="mt-8 w-full py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all">← Voltar</button>
          </div>
        )}

        {state.step === 3 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 text-center leading-[1.1]">Detalhes do Plano</h2>
            <p className="text-gray-500 text-center mb-8">Configure a acomodação e os beneficiários</p>
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-2">CNPJ da Empresa <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={state.cnpj}
                onChange={e => {
                  const formatted = formatCNPJ(e.target.value);
                  const digits = formatted.replace(/\D/g, '').slice(0, 14);
                  setState(p => ({ ...p, cnpj: formatted, empresa: digits.length !== 14 ? '' : p.empresa }));
                  setCErr(p => ({ ...p, cnpj: '' }));
                  if (digits.length === 14 && validarCNPJ(formatted)) consultarCnpj(digits);
                }}
                onBlur={() => {
                  if (state.cnpj && !validarCNPJ(state.cnpj)) setCErr(p => ({ ...p, cnpj: 'CNPJ inválido. Verifique os dígitos.' }));
                  else {
                    const d = state.cnpj.replace(/\D/g, '');
                    if (d.length === 14 && validarCNPJ(state.cnpj)) consultarCnpj(d);
                  }
                }}
                onPaste={e => {
                  const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 14);
                  if (pasted.length === 14) {
                    e.preventDefault();
                    const formatted = formatCNPJ(pasted);
                    setState(p => ({ ...p, cnpj: formatted }));
                    if (validarCNPJ(formatted)) consultarCnpj(pasted);
                  }
                }}
                placeholder="00.000.000/0001-00"
                className={`w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-[#B8941F] focus:border-transparent ${cErr.cnpj ? 'border-red-400' : 'border-gray-300'}`}
              />
              {cnpjLoading && <p className="text-gray-500 text-xs mt-1">Buscando razão social...</p>}
              {state.empresa && !cnpjLoading && <p className="text-green-700 text-sm mt-1 font-medium">Empresa: {state.empresa}</p>}
              {cErr.cnpj && <p className="text-red-500 text-xs mt-1">{cErr.cnpj}</p>}
            </div>
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-2">Nome da empresa</label>
              <input
                type="text"
                autoComplete="organization"
                value={state.empresa}
                onChange={e => setState(p => ({ ...p, empresa: e.target.value }))}
                placeholder="Preenchido automaticamente pelo CNPJ ou digite manualmente"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-[#B8941F] focus:border-transparent"
              />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-4">Tipo de Acomodação</label>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setState(p => ({ ...p, acomodacao: 'Enfermaria' }))} className={`p-5 border-2 rounded-xl hover:border-[#B8941F] transition-all ${sc(state.acomodacao === 'Enfermaria')}`}><h4 className="font-bold text-gray-900 text-lg mb-1">Enfermaria</h4><p className="text-sm text-gray-500">Quarto compartilhado</p></button>
                <button onClick={() => setState(p => ({ ...p, acomodacao: 'Apartamento' }))} className={`p-5 border-2 rounded-xl hover:border-[#B8941F] transition-all ${sc(state.acomodacao === 'Apartamento')}`}><h4 className="font-bold text-gray-900 text-lg mb-1">Apartamento</h4><p className="text-sm text-gray-500">Quarto individual</p></button>
              </div>
            </div>
            {!state.usaBypass ? (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">Faixa Etária dos Beneficiários <span className="text-red-400">*</span></label>
                <p className="text-xs text-gray-500 mb-4">Informe as idades para simulação mais precisa</p>
                <div className="space-y-3">
                  {state.beneficiarios.map((b, i) => (
                    <div key={b.id} className="flex gap-3 items-center">
                      <span className="text-gray-500 font-bold w-8 text-sm">{i + 1}.</span>
                      <select value={b.idade} onChange={e => updB(b.id, e.target.value)} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-[#B8941F]">
                        <option value="">Selecione a faixa etária</option>
                        {faixas.map(f => <option key={f} value={f}>{f} anos</option>)}
                      </select>
                      {state.beneficiarios.length > 2 && <button onClick={() => rmB(b.id)} className="px-3 py-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 font-bold text-sm">✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={addB} className="mt-4 px-5 py-2.5 border-2 border-[#B8941F] text-[#B8941F] rounded-xl hover:bg-[#B8941F] hover:text-white transition-all font-bold text-sm">+ Adicionar beneficiário</button>
                <button onClick={() => setState(p => ({ ...p, usaBypass: true }))} className="block mt-4 text-sm text-gray-400 hover:text-[#B8941F] underline underline-offset-2 transition-colors">Não tenho todas as idades agora →</button>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-4">Quantas vidas deseja incluir?</label>
                <select value={state.qtdVidasEstimada} onChange={e => setState(p => ({ ...p, qtdVidasEstimada: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-[#B8941F]">
                  <option value="">Selecione</option>
                  <option value="2">2 vidas</option><option value="3">3 vidas</option><option value="4">4 vidas</option><option value="5">5 vidas</option>
                  <option value="6-10">6 a 10 vidas</option><option value="11-20">11 a 20 vidas</option><option value="21-29">21 a 29 vidas</option>
                  <option value="30-49">30 a 49 vidas</option><option value="50-99">50 a 99 vidas</option><option value="100+">100+ vidas</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">A simulação usará faixas etárias médias. Nosso consultor ajustará com dados reais.</p>
                <button onClick={() => setState(p => ({ ...p, usaBypass: false }))} className="block mt-4 text-sm text-gray-400 hover:text-[#B8941F] underline underline-offset-2 transition-colors">← Prefiro informar as idades</button>
              </div>
            )}
            {(() => {
              const cnpjOk = validarCNPJ(state.cnpj);
              const acomOk = !!state.acomodacao;
              const idadesOk = state.usaBypass ? !!state.qtdVidasEstimada : (state.beneficiarios.length >= 2 && state.beneficiarios.every(b => !!b.idade));
              const msgs: string[] = [];
              if (!cnpjOk) msgs.push('Informe um CNPJ válido');
              if (!acomOk) msgs.push('Selecione o tipo de acomodação');
              if (!state.usaBypass && state.beneficiarios.length < 2) msgs.push('Adicione no mínimo 2 beneficiários');
              else if (!state.usaBypass && state.beneficiarios.some(b => !b.idade)) msgs.push('Selecione a faixa etária de todos os beneficiários');
              if (state.usaBypass && !state.qtdVidasEstimada) msgs.push('Selecione a quantidade de vidas');
              const disabled = !cnpjOk || !acomOk || !idadesOk;
              return (
                <>
                  {disabled && msgs.length > 0 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-700 font-medium flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        <span>{msgs.join(' · ')}</span>
                      </p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button onClick={bck} className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all">← Voltar</button>
                    <button onClick={nxt} disabled={disabled} className="flex-1 py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">Continuar →</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {state.step === 4 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 text-center leading-[1.1]">Onde sua empresa está localizada?</h2>
            <p className="text-gray-500 text-center mb-8">Isso garante rede credenciada próxima à sua equipe</p>
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-4">Localização</label>
              <input type="text" value={state.bairro} onChange={e => setState(p => ({ ...p, bairro: e.target.value }))} placeholder="Cidade / Bairro" className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B8941F] focus:border-transparent text-base" />
            </div>
            <div className="flex gap-4">
              <button onClick={bck} className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all">← Voltar</button>
              <button onClick={nxt} disabled={!state.bairro} className="flex-1 py-4 bg-black hover:bg-gray-900 text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">Continuar →</button>
            </div>
          </div>
        )}

        {state.step === 5 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 text-center leading-[1.1]">Para onde enviamos a cotação?</h2>
            <p className="text-gray-500 text-center mb-8">Falta pouco! Preencha seus dados para ver os resultados</p>
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Nome Completo</label>
                <input type="text" value={state.nome} onChange={e => { setState(p => ({ ...p, nome: e.target.value })); setCErr(p => ({ ...p, nome: '' })); }} placeholder="Digite seu nome" className={`w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-[#B8941F] ${cErr.nome ? 'border-red-400' : 'border-gray-300'}`} />
                {cErr.nome && <p className="text-red-500 text-xs mt-1">{cErr.nome}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">E-mail Corporativo</label>
                <input type="email" value={state.email} onChange={e => { setState(p => ({ ...p, email: e.target.value })); setCErr(p => ({ ...p, email: '' })); }} placeholder="contato@suaempresa.com.br" className={`w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-[#B8941F] ${cErr.email ? 'border-red-400' : 'border-gray-300'}`} />
                {cErr.email && <p className="text-red-500 text-xs mt-1">{cErr.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">WhatsApp</label>
                <input type="tel" value={state.telefone} onChange={e => { setState(p => ({ ...p, telefone: e.target.value })); setCErr(p => ({ ...p, telefone: '' })); }} placeholder="(21) 99999-9999" className={`w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-[#B8941F] ${cErr.telefone ? 'border-red-400' : 'border-gray-300'}`} />
                {cErr.telefone && <p className="text-red-500 text-xs mt-1">{cErr.telefone}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl mb-8">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <p className="text-xs text-gray-500 leading-relaxed">Seus dados estão protegidos conforme a <strong>LGPD</strong> (Lei Geral de Proteção de Dados). Utilizamos suas informações exclusivamente para gerar a cotação personalizada.</p>
            </div>
            <div className="flex gap-4">
              <button onClick={bck} className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-all">← Voltar</button>
              <button onClick={calcular} disabled={!state.nome || !state.email || !state.telefone || state.isLoading} className="flex-1 py-4 bg-[#B8941F] hover:bg-[#A07E18] text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {state.isLoading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Calculando...</span> : 'Ver resultados →'}
              </button>
            </div>
          </div>
        )}

        {state.step === TOTAL_STEPS && (
          <div className="space-y-6">
            <div className="bg-black text-white py-3 px-6 rounded-2xl text-center">
              <p className="text-sm font-bold flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-[#B8941F]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                Estas tabelas são válidas apenas para o mês atual
              </p>
            </div>
            <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4 leading-[1.1]">Encontramos {state.resultados.length} planos para sua empresa!</h2>
              {state.usaBypass && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-yellow-800"><strong>Simulação estimada:</strong> Como as idades não foram informadas, os valores foram calculados com faixas médias. Nosso consultor ajustará com os dados reais.</p>
                </div>
              )}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600"><strong>Valores Estimados:</strong> Sujeitos a alteração mediante análise detalhada do perfil da sua empresa.</p>
              </div>
            </div>
            {state.resultados.slice(0, 3).map((plano, idx) => (
              <div key={plano.id} className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all">
                {idx === 0 && <div className="inline-block px-4 py-2 bg-[#B8941F] text-white rounded-full text-xs font-bold mb-4 uppercase tracking-wide">★ Melhor opção</div>}
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plano.nome}</h3>
                <p className="text-gray-500 mb-6">{plano.operadora}</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl text-center"><p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Abrangência</p><p className="font-bold text-gray-900 text-sm">{plano.abrangencia}</p></div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center"><p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Coparticipação</p><p className="font-bold text-gray-900 text-sm">{plano.coparticipacao}</p></div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center"><p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Reembolso</p><p className="font-bold text-gray-900 text-sm">{plano.reembolso}</p></div>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl mb-6">
                  <p className="text-sm text-gray-500 mb-1">Valor estimado / mês</p>
                  <p className="text-3xl sm:text-4xl font-black text-black">R$ {plano.valorTotal.toFixed(2).replace('.', ',')}</p>
                  <p className="text-[10px] text-gray-400 mt-1">*Por vida — sujeito a alteração</p>
                </div>
                <a href={`https://wa.me/5521988179407?text=Olá!%20Tenho%20interesse%20no%20plano%20${encodeURIComponent(plano.nome)}%20-%20${plano.operadora}%20para%20minha%20empresa`} className="flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20BD5A] transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Falar com especialista</a>
              </div>
            ))}
            <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl text-center">
              <p className="text-gray-500 mb-4 text-sm">Prefere receber todos os detalhes por e-mail?</p>
              <button onClick={finalizar} className="px-8 py-4 bg-[#B8941F] hover:bg-[#A07E18] text-white rounded-xl font-bold transition-all">Receber cotação completa por e-mail</button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">Simulação exclusiva para empresas com CNPJ ativo (MEI, ME, EPP, etc).</p>
      </div>
    </section>
  );
}
