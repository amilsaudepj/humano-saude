/**
 * REFERÊNCIA: next.config que elimina CSP/WebSocket/502 em DEV
 * Use este bloco em next.config.js/ts para dev sem bloqueios.
 *
 * No projeto atual isso já está em next.config.ts:
 * - Em development: NÃO envia Content-Security-Policy (CSP = null)
 * - images.unoptimized: true
 * - API consulta-cnpj com timeout + retry para evitar 502
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Em dev: NÃO enviar CSP = zero bloqueio WebSocket HMR / scripts / assets
          ...(isDev ? [] : [{
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:;",
          }]),
        ],
      },
    ];
  },
};

module.exports = nextConfig;
