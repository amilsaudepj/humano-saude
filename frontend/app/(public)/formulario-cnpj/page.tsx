'use client';

import { useState, useCallback } from 'react';
import { validarCNPJ } from '@/lib/validations';

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export default function FormularioCnpjPage() {
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultar = useCallback(async (cnpjInput: string) => {
    const cleanCnpj = cnpjInput.replace(/\D/g, '').slice(0, 14);
    if (cleanCnpj.length !== 14 || !validarCNPJ(cleanCnpj)) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/consulta-cnpj?cnpj=${cleanCnpj}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erro ao consultar');
        setRazaoSocial('');
        setNomeFantasia('');
        setMunicipio('');
        return;
      }
      setRazaoSocial(data.razao_social ?? '');
      setNomeFantasia(data.nome_fantasia ?? '');
      setMunicipio(data.municipio ?? '');
    } catch {
      setError('Erro de conexão');
      setRazaoSocial('');
      setNomeFantasia('');
      setMunicipio('');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyMaskAndConsult = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 14);
      setCnpj(formatCNPJ(digits));
      setError(null);
      if (digits.length === 14 && validarCNPJ(digits)) {
        consultar(digits);
      } else {
        setRazaoSocial('');
        setNomeFantasia('');
        setMunicipio('');
      }
    },
    [consultar]
  );

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyMaskAndConsult(e.target.value);
  };

  const handleCnpjPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 14);
    applyMaskAndConsult(pasted);
  };

  const handleCnpjBlur = () => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length === 14 && validarCNPJ(cnpj)) consultar(digits);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consulta CNPJ</h1>
        <p className="text-gray-600 text-sm mb-6">
          Digite ou cole 14 dígitos. Razão social, fantasia e cidade preenchem automaticamente.
        </p>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="cnpj" className="block text-sm font-semibold text-gray-700 mb-1">
              CNPJ *
            </label>
            <input
              id="cnpj"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={cnpj}
              onChange={handleCnpjChange}
              onPaste={handleCnpjPaste}
              onBlur={handleCnpjBlur}
              placeholder="00.000.000/0000-00"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#B8941F] focus:border-transparent"
            />
            {loading && <p className="text-sm text-amber-600 mt-1">Consultando...</p>}
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>

          <input type="hidden" name="razao_social" value={razaoSocial} readOnly />
          <input type="hidden" name="nome_fantasia" value={nomeFantasia} readOnly />
          <input type="hidden" name="municipio" value={municipio} readOnly />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Razão social</label>
            <input
              type="text"
              readOnly
              value={razaoSocial}
              aria-label="Razão social"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome fantasia</label>
            <input
              type="text"
              readOnly
              value={nomeFantasia}
              aria-label="Nome fantasia"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              readOnly
              value={municipio}
              aria-label="Município"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800"
            />
          </div>
        </form>

        <p className="mt-6 text-xs text-gray-500">
          Teste: 83.325.498/0001-90 → HUMANA SAUDE CORRETORA DE SEGUROS LTDA
        </p>
      </div>
    </div>
  );
}
