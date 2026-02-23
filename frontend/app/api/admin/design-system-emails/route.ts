import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { jwtVerify } from 'jose';

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || '');

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    return (payload as { role?: string }).role === 'admin' || !!(payload as { role?: string }).role;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const ok = await requireAdmin(request);
  if (!ok) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('design_system_allowed_emails')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ok = await requireAdmin(request);
  if (!ok) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('design_system_allowed_emails')
      .insert({ email })
      .select('id, email, created_at')
      .single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'E-mail já está na lista' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ok = await requireAdmin(request);
  if (!ok) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const email = request.nextUrl.searchParams.get('email');
    const id = request.nextUrl.searchParams.get('id');
    const supabase = createServiceClient();
    if (id) {
      const { error } = await supabase.from('design_system_allowed_emails').delete().eq('id', id);
      if (error) throw error;
    } else if (email) {
      const { error } = await supabase.from('design_system_allowed_emails').delete().ilike('email', email);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Informe id ou email' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
