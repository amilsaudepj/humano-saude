import { NextRequest, NextResponse } from 'next/server';
import { getUsuarios } from '@/app/actions/usuarios';
import { createServiceClient } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-jwt';

async function getCurrentUser(request: NextRequest): Promise<{ email: string; role: string } | null> {
  const token = request.cookies.get('admin_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? { email: payload.email, role: payload.role } : null;
}

/** Lista usuários para o chat: ADMIN vê todos; CORRETOR vê apenas admin(s) + contatos permitidos. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await getUsuarios();
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: (result as { error?: string }).error || 'Erro ao listar usuários' },
        { status: 500 }
      );
    }

    const me = user.email.toLowerCase();
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      const list = result.data
        .filter((u) => u.email?.toLowerCase() !== me)
        .map((u) => ({
          id: u.id,
          email: u.email,
          nome: u.user_metadata?.nome || u.corretor?.nome || u.email?.split('@')[0] || 'Sem nome',
          role: u.corretor?.role || 'usuário',
        }));
      return NextResponse.json({ data: list });
    }

    // Corretor: só vê admins + emails em internal_chat_allowed
    const adminEmails = new Set(
      result.data
        .filter((u) => u.corretor?.role === 'administrador')
        .map((u) => u.email?.toLowerCase())
        .filter(Boolean)
    );

    const supabase = createServiceClient();
    const { data: allowedRows } = await supabase
      .from('internal_chat_allowed')
      .select('allowed_email')
      .eq('corretor_email', me);

    const allowedEmails = new Set<string>([...adminEmails]);
    (allowedRows || []).forEach((r) => r.allowed_email && allowedEmails.add(r.allowed_email.toLowerCase()));

    const list = result.data
      .filter((u) => u.email?.toLowerCase() !== me && allowedEmails.has(u.email?.toLowerCase() ?? ''))
      .map((u) => ({
        id: u.id,
        email: u.email,
        nome: u.user_metadata?.nome || u.corretor?.nome || u.email?.split('@')[0] || 'Sem nome',
        role: u.corretor?.role || 'usuário',
      }));

    return NextResponse.json({ data: list });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
