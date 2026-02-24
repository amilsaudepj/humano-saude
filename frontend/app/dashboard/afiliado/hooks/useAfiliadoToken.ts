'use client';

import { useState, useEffect } from 'react';
import { decodeTokenUnsafe } from '@/lib/auth-jwt';

interface AfiliadoPayload {
  afiliado_id?: string;
  corretor_id?: string;
  email: string;
  role: string;
  exp?: number;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

function decodeAfiliadoToken(token: string): AfiliadoPayload | null {
  const payload = decodeTokenUnsafe(token);
  if (!payload) return null;
  return {
    afiliado_id: payload.afiliado_id,
    corretor_id: payload.corretor_id,
    email: payload.email,
    role: payload.role,
    exp: payload.exp,
  };
}

export function useAfiliadoId(): string {
  const [afiliadoId, setAfiliadoId] = useState<string>('');

  useEffect(() => {
    const token = getCookie('afiliado_token');
    if (!token) return;
    const decoded = decodeAfiliadoToken(token);
    if (decoded?.afiliado_id) setAfiliadoId(decoded.afiliado_id);
  }, []);

  return afiliadoId;
}

export function getAfiliadoIdFromCookie(): string {
  const token = getCookie('afiliado_token');
  if (!token) return '';
  const decoded = decodeAfiliadoToken(token);
  return decoded?.afiliado_id || '';
}
