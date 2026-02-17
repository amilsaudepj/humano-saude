import crypto from 'crypto';
import type { HashedUserData, UserData } from './types';

export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function hashUserData(data: UserData): HashedUserData {
  return {
    email: data.email ? hashString(data.email) : undefined,
    phone: data.phone ? hashString(normalizePhone(data.phone)) : undefined,
    external_id: data.external_id ? hashString(data.external_id) : undefined,
    fn: data.fn ? hashString(data.fn) : undefined,
    ln: data.ln ? hashString(data.ln) : undefined,
    ct: data.ct ? hashString(data.ct) : undefined,
    st: data.st ? hashString(data.st) : undefined,
    country: data.country ? data.country.toUpperCase() : undefined,
    zip: data.zip ? hashString(data.zip) : undefined,
  };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 10 && digits.length <= 15;
}

export function validateLookalikeRatio(value: number): boolean {
  return Number.isFinite(value) && value >= 0.01 && value <= 0.1;
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function generateAudienceName(kind: 'custom' | 'lookalike' | 'saved', label?: string): string {
  const suffix = new Date().toISOString().slice(0, 10);
  const base = label?.trim() || 'Audience';
  if (kind === 'lookalike') return `LAL - ${base} - ${suffix}`;
  if (kind === 'custom') return `Custom - ${base} - ${suffix}`;
  return `Saved - ${base} - ${suffix}`;
}
