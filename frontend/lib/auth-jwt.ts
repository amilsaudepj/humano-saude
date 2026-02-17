import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// Payload tipado para tokens da plataforma
export interface HumanoTokenPayload extends JWTPayload {
  email: string;
  role: 'admin' | 'corretor' | 'cliente';
  corretor_id?: string;
  cliente_id?: string;
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
  role: 'admin' | 'corretor' | 'cliente';
  corretor_id?: string;
  cliente_id?: string;
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
