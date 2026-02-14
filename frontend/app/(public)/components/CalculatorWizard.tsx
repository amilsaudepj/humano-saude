'use client';

import { useState } from 'react';
import { trackGTMCalculation, trackGTMLeadSubmission } from '@/app/components/GoogleTagManager';
import { trackCalculation, trackLeadSubmission } from '@/app/components/GoogleAnalytics';
import { trackLeadGeneration, trackQuoteStart } from '@/app/lib/metaPixel';
import { calculatorLeadSchema, getZodErrors } from '@/lib/validations';
import type { CalculadoraState, PlanoResultado, Beneficiario } from './Calculator.types';

export default function CalculatorWizard() {
  const [state, setState] = useState<CalculadoraState>({
    step: 1,
    tipoContrato: '',
    cnpj: '',
    acomodacao: '',
    beneficiarios: [{ id: 1, idade: '' }],
    bairro: '',
    nome: '',
    email: '',
    telefone: '',
    resultados: [],
    isLoading: false,
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});

  const faixasEtarias = [
    '0-18', '19-23', '24-28', '29-33', '34-38',
    '39-43', '44-48', '49-53', '54-58', '59+'
  ];

  const bairrosRJ = [
    'Barra da Tijuca', 'Botafogo', 'Centro', 'Copacabana', 'Flamengo',
    'Ipanema', 'Jacarepaguá', 'Leblon', 'Tijuca', 'Vila Isabel',
    'Bangu', 'Campo Grande', 'Recreio', 'Méier', 'Madureira', 'Outro'
  ];

  const adicionarBeneficiario = () => {
    setState(prev => ({
      ...prev,
      beneficiarios: [...prev.beneficiarios, { id: Date.now(), idade: '' }]
    }));
  };

  const removerBeneficiario = (id: number) => {
    if (state.beneficiarios.length > 1) {
      setState(prev => ({
        ...prev,
        beneficiarios: prev.beneficiarios.filter(b => b.id !== id)
      }));
    }
  };

  const atualizarIdadeBeneficiario = (id: number, idade: string) => {
    setState(prev => ({
      ...prev,
      beneficiarios: prev.beneficiarios.map(b =>
        b.id === id ? { ...b, idade } : b
      )
    }));
  };

  const proximoPasso = () => {
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const voltarPasso = () => {
    setState(prev => ({ ...prev, step: prev.step - 1 }));
  };

  const calcularPlanos = async () => {
    // Validar dados de contato com Zod
    const validation = calculatorLeadSchema.safeParse({
      nome: state.nome,
      email: state.email,
      telefone: state.telefone,
      perfil: state.tipoContrato,
    });

    if (!validation.success) {
      setContactErrors(getZodErrors(validation.error));
      return;
    }

    setContactErrors({});
    setState(prev => ({ ...prev, isLoading: true }));

    // Meta Pixel: rastrear início da cotação
    trackQuoteStart({
      tipoContratacao: state.tipoContrato,
      idades: state.beneficiarios.map(b => parseInt(b.idade) || 0),
    });

    const idades = state.beneficiarios.map(b => b.idade).filter(Boolean);

    try {
      const response = await fetch('/api/calculadora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_contratacao: state.tipoContrato,
          acomodacao: state.acomodacao,
          idades,
          cnpj: state.tipoContrato === 'PME' ? state.cnpj : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Aumentar 25% em todos os valores calculados
        const resultadosAjustados = data.resultados.map((plano: PlanoResultado) => ({
          ...plano,
          valorTotal: plano.valorTotal * 1.25
        }));

        setState(prev => ({
          ...prev,
          resultados: resultadosAjustados,
          isLoading: false,
          step: 5,
        }));

        // Tracking
        const valorMaisBarato = resultadosAjustados[0]?.valorTotal;
        trackGTMCalculation({
          tipo: state.tipoContrato,
          acomodacao: state.acomodacao,
          totalPlanos: data.total,
          valorMaisBarato,
        });

        trackCalculation({
          tipo: state.tipoContrato,
          acomodacao: state.acomodacao,
          totalPlanos: data.total,
        });
      } else {
        alert('Erro ao calcular planos');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao calcular');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const finalizarCotacao = async () => {
    const idades = state.beneficiarios.map(b => b.idade).filter(Boolean);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: state.nome,
          email: state.email,
          telefone: state.telefone,
          perfil: state.tipoContrato,
          tipo_contratacao: state.tipoContrato,
          cnpj: state.cnpj || null,
          acomodacao: state.acomodacao,
          idades_beneficiarios: idades,
          bairro: state.bairro,
          top_3_planos: state.resultados.slice(0, 3).map(p => p.nome),
        }),
      });

      // ✅ Meta Pixel: rastrear lead gerado na calculadora
      trackLeadGeneration({
        leadId: `calc-${Date.now()}`,
        nome: state.nome,
        operadora: state.resultados[0]?.operadora || 'N/A',
        valorProposto: state.resultados[0]?.valorTotal || 0,
        economiaEstimada: 0,
      });

      // ✅ GTM: rastrear envio de lead
      trackGTMLeadSubmission({
        nome: state.nome,
        email: state.email,
        telefone: state.telefone,
        perfil: state.tipoContrato,
      });

      // ✅ GA: rastrear envio de lead
      trackLeadSubmission({
        nome: state.nome,
        perfil: state.tipoContrato,
        source: 'calculator_wizard',
      });

      window.location.href = '/obrigado';
    } catch (error) {
      console.error('Erro ao finalizar:', error);
    }
  };

  return (
    <section id="calculadora" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Título da Seção */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 font-cinzel leading-[1.1]">
            Calcule seu <span className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent">Plano de Saúde</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra as melhores opções e economize em seu plano de saúde
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8 sm:mb-12">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-full font-bold text-sm sm:text-lg ${
                  state.step >= step
                    ? 'bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(state.step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Tipo de Contratação */}
        {state.step === 1 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center font-cinzel leading-[1.1]">
              Qual tipo de contratação?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  setState(prev => ({ ...prev, tipoContrato: 'PF', cnpj: '' }));
                  setTimeout(proximoPasso, 300);
                }}
                className={`p-8 border-2 rounded-2xl hover:border-[#bf953f] hover:shadow-lg transition-all ${
                  state.tipoContrato === 'PF' ? 'border-[#bf953f] bg-[#bf953f]/5' : 'border-gray-200'
                }`}
              >
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-xl font-bold mb-2 leading-[1.1]">Pessoa Física</h3>
                <p className="text-gray-600 text-sm">Individual ou Familiar</p>
              </button>

              <button
                onClick={() => {
                  setState(prev => ({ ...prev, tipoContrato: 'PME' }));
                  setTimeout(proximoPasso, 300);
                }}
                className={`p-8 border-2 rounded-2xl hover:border-[#bf953f] hover:shadow-lg transition-all ${
                  state.tipoContrato === 'PME' ? 'border-[#bf953f] bg-[#bf953f]/5' : 'border-gray-200'
                }`}
              >
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-xl font-bold mb-2 leading-[1.1]">Empresarial (PME)</h3>
                <p className="text-gray-600 text-sm">A partir de 2 vidas</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Acomodação + Beneficiários */}
        {state.step === 2 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center font-cinzel leading-[1.1]">
              Acomodação e Beneficiários
            </h2>

            {/* CNPJ (se PME) */}
            {state.tipoContrato === 'PME' && (
              <div className="mb-8">
                <label className="block text-sm font-bold mb-2">CNPJ da Empresa</label>
                <input
                  type="text"
                  value={state.cnpj}
                  onChange={(e) => setState(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-[#bf953f] focus:border-transparent"
                />
              </div>
            )}

            {/* Acomodação */}
            <div className="mb-8">
              <label className="block text-sm font-bold mb-4">Tipo de Acomodação</label>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, acomodacao: 'Enfermaria' }))}
                  className={`p-6 border-2 rounded-xl hover:border-[#bf953f] transition-all ${
                    state.acomodacao === 'Enfermaria' ? 'border-[#bf953f] bg-[#bf953f]/5' : 'border-gray-200'
                  }`}
                >
                  <h4 className="font-bold text-lg mb-1">Enfermaria</h4>
                  <p className="text-sm text-gray-600">Quarto compartilhado</p>
                </button>

                <button
                  onClick={() => setState(prev => ({ ...prev, acomodacao: 'Apartamento' }))}
                  className={`p-6 border-2 rounded-xl hover:border-[#bf953f] transition-all ${
                    state.acomodacao === 'Apartamento' ? 'border-[#bf953f] bg-[#bf953f]/5' : 'border-gray-200'
                  }`}
                >
                  <h4 className="font-bold text-lg mb-1">Apartamento</h4>
                  <p className="text-sm text-gray-600">Quarto individual</p>
                </button>
              </div>
            </div>

            {/* Beneficiários */}
            <div className="mb-8">
              <label className="block text-sm font-bold mb-4">Faixa Etária dos Beneficiários</label>
              <div className="space-y-3">
                {state.beneficiarios.map((beneficiario, index) => (
                  <div key={beneficiario.id} className="flex gap-3 items-center">
                    <span className="text-gray-600 font-bold w-8">{index + 1}.</span>
                    <select
                      value={beneficiario.idade}
                      onChange={(e) => atualizarIdadeBeneficiario(beneficiario.id, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-[#bf953f]"
                    >
                      <option value="">Selecione a idade</option>
                      {faixasEtarias.map(faixa => (
                        <option key={faixa} value={faixa}>{faixa} anos</option>
                      ))}
                    </select>
                    {state.beneficiarios.length > 1 && (
                      <button
                        onClick={() => removerBeneficiario(beneficiario.id)}
                        className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={adicionarBeneficiario}
                className="mt-4 px-6 py-3 border-2 border-[#bf953f] text-[#bf953f] rounded-xl hover:bg-[#bf953f] hover:text-white transition-all font-bold"
              >
                + Adicionar Beneficiário
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={voltarPasso}
                className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50"
              >
                ← Voltar
              </button>
              <button
                onClick={proximoPasso}
                disabled={!state.acomodacao || state.beneficiarios.some(b => !b.idade)}
                className="flex-1 py-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Localização */}
        {state.step === 3 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center font-cinzel">
              Onde você mora?
            </h2>
            <div className="mb-8">
              <label className="block text-sm font-bold mb-4">Bairro (Rio de Janeiro)</label>
              <select
                value={state.bairro}
                onChange={(e) => setState(prev => ({ ...prev, bairro: e.target.value }))}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#bf953f] text-base"
              >
                <option value="">Selecione seu bairro</option>
                {bairrosRJ.map(bairro => (
                  <option key={bairro} value={bairro}>{bairro}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                📍 Isso nos ajuda a encontrar planos com rede credenciada próxima
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={voltarPasso}
                className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50"
              >
                ← Voltar
              </button>
              <button
                onClick={proximoPasso}
                disabled={!state.bairro}
                className="flex-1 py-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Dados de Contato */}
        {state.step === 4 && (
          <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center font-cinzel">
              Para onde enviamos a cotação?
            </h2>
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-bold mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={state.nome}
                  onChange={(e) => { setState(prev => ({ ...prev, nome: e.target.value })); setContactErrors(prev => ({ ...prev, nome: '' })); }}
                  placeholder="Digite seu nome"
                  className={`w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-[#bf953f] ${contactErrors.nome ? 'border-red-400' : 'border-gray-300'}`}
                />
                {contactErrors.nome && <p className="text-red-500 text-xs mt-1">{contactErrors.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">E-mail</label>
                <input
                  type="email"
                  value={state.email}
                  onChange={(e) => { setState(prev => ({ ...prev, email: e.target.value })); setContactErrors(prev => ({ ...prev, email: '' })); }}
                  placeholder="seu@email.com"
                  className={`w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-[#bf953f] ${contactErrors.email ? 'border-red-400' : 'border-gray-300'}`}
                />
                {contactErrors.email && <p className="text-red-500 text-xs mt-1">{contactErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={state.telefone}
                  onChange={(e) => { setState(prev => ({ ...prev, telefone: e.target.value })); setContactErrors(prev => ({ ...prev, telefone: '' })); }}
                  placeholder="(21) 99999-9999"
                  className={`w-full px-4 py-3 border rounded-xl text-base focus:ring-2 focus:ring-[#bf953f] ${contactErrors.telefone ? 'border-red-400' : 'border-gray-300'}`}
                />
                {contactErrors.telefone && <p className="text-red-500 text-xs mt-1">{contactErrors.telefone}</p>}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={voltarPasso}
                className="flex-1 py-4 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-50"
              >
                ← Voltar
              </button>
              <button
                onClick={calcularPlanos}
                disabled={!state.nome || !state.email || !state.telefone || state.isLoading}
                className="flex-1 py-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50"
              >
                {state.isLoading ? 'Calculando...' : 'Ver Resultados →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Resultados */}
        {state.step === 5 && (
          <div className="space-y-6">
            <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-cinzel">
                🎉 Encontramos {state.resultados.length} Planos!
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Valores Estimados:</strong> Os valores apresentados são estimativas baseadas nas informações fornecidas e estão sujeitos a alteração mediante análise detalhada.
                </p>
              </div>
              <p className="text-gray-600">
                Aqui estão as melhores opções para você. Todos mantêm hospitais e laboratórios de qualidade.
              </p>
            </div>

            {state.resultados.slice(0, 3).map((plano, index) => (
              <div key={plano.id} className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all">
                {index === 0 && (
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white rounded-full text-xs font-bold mb-4">
                    🥇 MELHOR OPÇÃO
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plano.nome}</h3>
                <p className="text-gray-600 mb-6">{plano.operadora}</p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Abrangência</p>
                    <p className="font-bold">{plano.abrangencia}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Coparticipação</p>
                    <p className="font-bold">{plano.coparticipacao}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Reembolso</p>
                    <p className="font-bold">{plano.reembolso}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#bf953f]/10 to-[#aa771c]/10 rounded-2xl mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valor Estimado Mensal</p>
                    <p className="text-4xl font-black text-slate-900">
                      R$ {plano.valorTotal.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">*Valores estimados - sujeitos a alteração</p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/5521988179407?text=Olá!%20Quero%20contratar%20o%20plano%20${encodeURIComponent(plano.nome)}%20-%20${plano.operadora}`}
                  className="block text-center py-4 bg-[#25D366] text-white rounded-xl font-bold hover:scale-105 transition-transform"
                >
                  💬 Contratar via WhatsApp
                </a>
              </div>
            ))}

            <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-3xl shadow-xl text-center">
              <button
                onClick={finalizarCotacao}
                className="px-6 sm:px-8 py-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white rounded-xl font-bold hover:shadow-lg text-sm sm:text-base"
              >
                ✉️ Receber Cotação Completa por E-mail
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
