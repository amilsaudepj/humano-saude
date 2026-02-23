'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import DesignSystemContent from './DesignSystemContent';

const MESSAGES: Record<string, string> = {
  aprovado: 'Acesso aprovado! Use o botão Acessar com seu e-mail.',
  'link-invalido': 'Link inválido.',
  'link-expirado': 'Link expirado. Peça uma nova solicitação ou aprovação no painel.',
  'ja-processado': 'Esta solicitação já foi processada.',
  erro: 'Ocorreu um erro. Tente novamente.',
};

export default function DesignSystemGate() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const aprovado = params.get('aprovado');
      const erro = params.get('erro');
      if (aprovado === '1') {
        setFlashMessage({ type: 'success', text: MESSAGES.aprovado });
        window.history.replaceState({}, '', '/design-system');
      } else if (erro && MESSAGES[erro]) {
        setFlashMessage({ type: 'error', text: MESSAGES[erro] });
        window.history.replaceState({}, '', '/design-system');
      }
    }
  }, []);

  useEffect(() => {
    fetch('/api/design-system/verify', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setAllowed(data.ok === true);
      })
      .catch(() => setAllowed(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/design-system/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.allowed && data.token) {
        document.cookie = `ds_token=${data.token}; path=/design-system; max-age=86400; SameSite=Lax`;
        setAllowed(true);
      } else {
        setError(data.error || 'E-mail não autorizado. Solicite acesso ao administrador.');
      }
    } catch {
      setError('Erro ao verificar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRequestMessage('');
    try {
      const res = await fetch('/api/design-system/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setRequestSent(true);
        setRequestMessage(data.message || 'Solicitação enviada. Você receberá retorno quando for aprovado.');
      } else {
        setError(data.error || 'Erro ao enviar solicitação.');
      }
    } catch {
      setError('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-gray-50 font-montserrat flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (allowed) {
    return (
      <div className="min-h-screen bg-gray-50 font-montserrat">
        <DesignSystemContent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logos/logo-humano-saude-dourado.png"
            alt="Humano Saúde"
            width={180}
            height={60}
            className="h-14 w-auto object-contain"
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-black mb-2 text-center">
            Design System · Identidade Visual
          </h1>
          <p className="text-gray-600 text-sm text-center mb-6">
            Digite seu e-mail para acessar. Apenas e-mails aprovados pelo admin têm acesso.
          </p>
          {flashMessage && (
            <div
              className={`mb-4 py-3 px-4 rounded-xl text-sm text-center ${
                flashMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
              }`}
            >
              {flashMessage.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#B8941F] focus:outline-none transition-colors"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {requestMessage && (
              <p className="text-sm text-green-600 bg-green-50 py-2 px-3 rounded-lg">{requestMessage}</p>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#B8941F] text-white font-bold hover:bg-[#9a7b19] transition-colors disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Acessar'}
              </button>
              <button
                type="button"
                onClick={handleRequestAccess}
                disabled={loading}
                className="w-full py-3 rounded-xl border-2 border-[#B8941F] text-[#B8941F] font-bold hover:bg-[#B8941F]/10 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Solicitar acesso'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-gray-500 text-xs mt-6">
          Não tem acesso? Clique em <strong>Solicitar acesso</strong> para enviar um pedido; o admin aprovará por e-mail ou no painel.
        </p>
      </div>
    </div>
  );
}
