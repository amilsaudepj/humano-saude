'use client';

import { useState } from 'react';
import type { CalculadoraState, Beneficiario, PlanoResultado } from './Calculator.types';

export default function Calculator() {
  const [state, setState] = useState<CalculadoraState>({
    step: 1,
    intencao: '',
    perfilCnpj: '',
    tipoContrato: '',
    cnpj: '',
    empresa: '',
    acomodacao: '',
    beneficiarios: [{ id: 0, idade: '' }],
    usaBypass: false,
    qtdVidasEstimada: '',
    bairro: '',
    nome: '',
    email: '',
    telefone: '',
    resultados: [],
    isLoading: false,
  });

  const calcularPlanos = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const idades = state.beneficiarios.map((b) => b.idade).filter(Boolean);
      
      const response = await fetch('/api/calculadora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_contratacao: state.tipoContrato,
          acomodacao: state.acomodacao,
          idades,
          cnpj: state.cnpj || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setState((prev) => ({
          ...prev,
          resultados: data.resultados,
          step: 5,
          isLoading: false,
        }));
      } else {
        alert('Erro: ' + data.error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Erro ao calcular:', error);
      alert('Erro ao calcular planos');
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Renderização simplificada
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-black text-gray-900 text-center mb-12 font-cinzel leading-[1.1]">
          Calculadora <span className="bg-gold-400 bg-clip-text text-transparent">Inteligente</span>
        </h2>
        
        {state.isLoading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gold-400"></div>
            <p className="mt-4 text-gray-600">Consultando valores oficiais...</p>
          </div>
        )}

        {state.step === 5 && state.resultados.length > 0 && (
          <div className="space-y-6">
            {state.resultados.slice(0, 3).map((plano, i) => (
              <div key={plano.id} className="bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plano.nome}</h3>
                    <p className="text-gray-500">{plano.operadora}</p>
                  </div>
                  {i === 0 && (
                    <span className="bg-gold-400 text-white px-4 py-2 rounded-full text-sm font-bold">
                      🥇 Melhor Opção
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Abrangência</p>
                    <p className="font-semibold text-gray-900 text-sm">{plano.abrangencia}</p>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Coparticipação</p>
                    <p className="font-semibold text-gray-900 text-sm">{plano.coparticipacao}</p>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Reembolso</p>
                    <p className="font-semibold text-gray-900 text-sm">{plano.reembolso}</p>
                  </div>
                </div>

                <div className="bg-gold-400 text-white p-6 rounded-2xl text-center">
                  <p className="text-sm mb-2">Valor Estimado Mensal</p>
                  <p className="text-4xl font-black text-white">
                    R$ {plano.valorTotal.toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <a
                  href={`https://wa.me/5521988179407?text=Olá!%20Quero%20mais%20informações%20sobre%20o%20plano%20${encodeURIComponent(plano.nome)}%20no%20valor%20de%20R$%20${plano.valorTotal.toFixed(2)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-6 bg-[#25D366] text-white py-4 rounded-xl text-center font-bold hover:bg-[#20BA5A] transition-all"
                >
                  💬 Solicitar Proposta Oficial
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder para Steps (você pode expandir depois) */}
        {state.step < 5 && !state.isLoading && (
          <div className="text-center py-10">
            <p className="text-gray-600">Calculadora em desenvolvimento...</p>
            <button
              onClick={calcularPlanos}
              className="mt-4 bg-gold-400 text-white px-8 py-3 rounded-xl font-bold"
            >
              Testar Cálculo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
