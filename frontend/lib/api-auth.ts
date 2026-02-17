import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-jwt';

export function getBearerToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

export function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || '';
  if (!cronSecret) return false;
  const bearer = getBearerToken(request);
  return bearer === cronSecret;
}

export async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  const bearer = getBearerToken(request);
  const cookieToken = request.cookies.get('admin_token')?.value || '';
  const token = bearer || cookieToken;
  if (!token) return false;

  const payload = await verifyToken(token);
  return payload?.role === 'admin';
}
