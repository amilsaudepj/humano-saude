'use client';

/** Captura erros na raiz (layout, etc.) e evita tela branca "Internal Server Error" */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Algo deu errado</h1>
          <p style={{ marginBottom: 24, opacity: 0.9 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          {isDev && error?.message && (
            <pre style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 8, fontSize: 12, textAlign: 'left', overflow: 'auto', marginBottom: 24 }}>
              {error.message}
            </pre>
          )}
          <button
            onClick={() => reset()}
            style={{ padding: '12px 24px', background: '#B8941F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
