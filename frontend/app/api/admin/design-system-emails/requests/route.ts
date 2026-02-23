import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { jwtVerify } from 'jose';

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || '');

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET());
    return true;
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
      .from('design_system_access_requests')
      .select('id, email, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
