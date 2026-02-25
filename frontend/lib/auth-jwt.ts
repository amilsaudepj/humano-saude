import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Payload tipado para tokens da plataforma
export interface HumanoTokenPayload extends JWTPayload {
  email: string;
  role: 'admin' | 'corretor' | 'cliente' | 'afiliado';
  corretor_id?: string;
  cliente_id?: string;
  afiliado_id?: string;
}

// Secret derivada da env var — mínimo 32 chars recomendado
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      '⚠️ JWT_SECRET não configurada ou menor que 32 caracteres. ' +
      'Gere com: openssl rand -base64 64',
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Assina um JWT com HS256, expiração de 24h.
 * Usado no login admin e login corretor.
 */
export async function signToken(payload: {
  email: string;
  role: 'admin' | 'corretor' | 'cliente' | 'afiliado';
  corretor_id?: string;
  cliente_id?: string;
  afiliado_id?: string;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

/**
 * Verifica e decodifica um JWT.
 * Retorna null se expirado, inválido ou assinatura incorreta.
 */
export async function verifyToken(
  token: string,
): Promise<HumanoTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as HumanoTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai o payload de um JWT SEM verificar assinatura.
 * Útil APENAS no client-side (browser) onde não temos acesso ao secret.
 * A verificação real acontece no middleware (server-side).
 */
export function decodeTokenUnsafe(token: string): {
  email: string;
  role: string;
  corretor_id?: string;
  cliente_id?: string;
  afiliado_id?: string;
  exp?: number;
} | null {
  try {
    // JWT é header.payload.signature — decodificar parte 2
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      typeof atob === 'function'
        ? atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
        : Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );
    return payload;
  } catch {
    return null;
  }
}

// ─── Helpers para API Routes (server-side) ──────────────────

/**
 * Extrai corretor_id de um token JWT.
 * Verifica assinatura JWT. Para uso em API Route handlers (server-side).
 */
export async function getCorretorIdFromToken(token: string): Promise<string | null> {
  const jwt = await verifyToken(token);
  if (jwt?.corretor_id) return jwt.corretor_id;
  return null;
}

/**
 * Extrai corretor_id do cookie de um NextRequest.
 * Convenience wrapper para API routes.
 */
export async function getCorretorIdFromRequest(
  request: { cookies: { get(name: string): { value: string } | undefined } },
): Promise<string | null> {
  const token = request.cookies.get('corretor_token')?.value;
  if (!token) return null;
  return getCorretorIdFromToken(token);
}

/**
 * Extrai afiliado_id do token JWT (cookie afiliado_token).
 */
export async function getAfiliadoIdFromToken(token: string): Promise<string | null> {
  const jwt = await verifyToken(token);
  if (jwt?.afiliado_id) return jwt.afiliado_id;
  return null;
}

/**
 * Extrai afiliado_id do cookie de um NextRequest (afiliado_token).
 */
export async function getAfiliadoIdFromRequest(
  request: { cookies: { get(name: string): { value: string } | undefined } },
): Promise<string | null> {
  const token = request.cookies.get('afiliado_token')?.value;
  if (!token) return null;
  return getAfiliadoIdFromToken(token);
}

// ─── Token para confirmação de e-mail (corretor) ─────────────────

export interface ConfirmEmailPayload extends JWTPayload {
  corretor_id: string;
  purpose: 'confirm_email';
}

/** Gera JWT de confirmação de e-mail (válido 24h). */
export async function signConfirmEmailToken(corretorId: string): Promise<string> {
  return new SignJWT({ corretor_id: corretorId, purpose: 'confirm_email' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

/** Verifica JWT de confirmação de e-mail; retorna payload ou null. */
export async function verifyConfirmEmailToken(token: string): Promise<ConfirmEmailPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if ((payload as ConfirmEmailPayload).purpose !== 'confirm_email') return null;
    return payload as ConfirmEmailPayload;
  } catch {
    return null;
  }
}

// ─── Token de acesso à página /links (link no e-mail do admin) ─────────────────

export interface LinksAccessPayload extends JWTPayload {
  email: string;
  purpose: 'links_access';
}

/** Gera JWT de acesso à página /links (válido 90 dias). */
export async function signLinksAccessToken(email: string): Promise<string> {
  return new SignJWT({ email: email.toLowerCase().trim(), purpose: 'links_access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(getSecret());
}

/** Verifica JWT de acesso à página /links; retorna payload ou null. */
export async function verifyLinksAccessToken(token: string): Promise<LinksAccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if ((payload as LinksAccessPayload).purpose !== 'links_access') return null;
    return payload as LinksAccessPayload;
  } catch {
    return null;
  }
}
