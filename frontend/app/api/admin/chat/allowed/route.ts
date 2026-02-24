import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-jwt';
import { getUsuarios } from '@/app/actions/usuarios';

async function requireAdmin(request: NextRequest): Promise<{ email: string } | null> {
  const token = request.cookies.get('admin_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.role === 'admin' ? { email: payload.email } : null;
}

/** Lista permissões de chat: por corretor ou todas. Só admin. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Apenas administradores podem acessar' }, { status: 403 });
  }

  const corretorEmail = request.nextUrl.searchParams.get('corretor_email')?.trim()?.toLowerCase();

  try {
    const supabase = createServiceClient();
    let query = supabase
      .from('internal_chat_allowed')
      .select('id, corretor_email, allowed_email, created_at')
      .order('corretor_email')
      .order('allowed_email');
    if (corretorEmail) {
      query = query.eq('corretor_email', corretorEmail);
    }
    const { data, error } = await query;
    if (error) throw error;

    const result = await getUsuarios();
    const users = result.success && result.data ? result.data : [];
    const byEmail = new Map(users.map((u) => [u.email?.toLowerCase(), { id: u.id, email: u.email, nome: u.user_metadata?.nome || u.corretor?.nome || u.email?.split('@')[0] || 'Sem nome', role: u.corretor?.role }]));

    const list = (data || []).map((row) => ({
      id: row.id,
      corretor_email: row.corretor_email,
      allowed_email: row.allowed_email,
      allowed_nome: byEmail.get(row.allowed_email?.toLowerCase())?.nome ?? row.allowed_email,
      created_at: row.created_at,
    }));

    return NextResponse.json({ data: list });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** Adiciona permissão: corretor X pode conversar com Y. Só admin. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Apenas administradores podem acessar' }, { status: 403 });
  }

  let body: { corretor_email?: string; allowed_email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }
  const corretorEmail = typeof body?.corretor_email === 'string' ? body.corretor_email.trim().toLowerCase() : '';
  const allowedEmail = typeof body?.allowed_email === 'string' ? body.allowed_email.trim().toLowerCase() : '';
  if (!corretorEmail || !allowedEmail) {
    return NextResponse.json({ error: 'corretor_email e allowed_email são obrigatórios' }, { status: 400 });
  }
  if (corretorEmail === allowedEmail) {
    return NextResponse.json({ error: 'Corretor e permitido não podem ser iguais' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('internal_chat_allowed')
      .insert({ corretor_email: corretorEmail, allowed_email: allowedEmail })
      .select('id, corretor_email, allowed_email, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Esta permissão já existe' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** Remove permissão. Só admin. Body: { corretor_email, allowed_email } ou ?id=uuid */
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Apenas administradores podem acessar' }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (id) {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase.from('internal_chat_allowed').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  let body: { corretor_email?: string; allowed_email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido ou use ?id=uuid' }, { status: 400 });
  }
  const corretorEmail = typeof body?.corretor_email === 'string' ? body.corretor_email.trim().toLowerCase() : '';
  const allowedEmail = typeof body?.allowed_email === 'string' ? body.allowed_email.trim().toLowerCase() : '';
  if (!corretorEmail || !allowedEmail) {
    return NextResponse.json({ error: 'corretor_email e allowed_email são obrigatórios' }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('internal_chat_allowed')
      .delete()
      .eq('corretor_email', corretorEmail)
      .eq('allowed_email', allowedEmail);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
