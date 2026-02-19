// ─── Middleware do Next.js ────────────────────────────────────
// Toda a lógica está centralizada em proxy.ts.
// Este arquivo apenas re-exporta para que o Next.js encontre
// a função 'middleware' e o 'config' no lugar correto.
export { middleware, config } from './proxy';
