import crypto from 'crypto';

const SECRET = process.env.LINKS_APPROVE_SECRET || process.env.JWT_SECRET || 'links-approve-fallback';
const TOKEN_EXPIRY_SEC = 7 * 24 * 60 * 60; // 7 dias

export function signLinksApproveToken(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SEC;
  const payload = JSON.stringify({ email: email.toLowerCase().trim(), exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payloadB64 + '.' + sig;
}

export function verifyLinksApproveToken(token: string): { email: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (expectedSig !== sig) return null;
  let data: { email: string; exp: number };
  try {
    data = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!data.email || typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return { email: data.email };
}
