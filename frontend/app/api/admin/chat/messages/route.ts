import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-jwt';

async function getCurrentUser(request: NextRequest): Promise<{ email: string } | null> {
  const token = request.cookies.get('admin_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? { email: payload.email } : null;
}

/** Lista mensagens entre o usuário logado e outro (with=email). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const withEmail = request.nextUrl.searchParams.get('with');
  if (!withEmail?.trim()) {
    return NextResponse.json({ error: 'Parâmetro "with" (email) obrigatório' }, { status: 400 });
  }

  const me = user.email.toLowerCase();
  const other = withEmail.trim().toLowerCase();

  try {
    const supabase = createServiceClient();
    const [res1, res2] = await Promise.all([
      supabase
        .from('internal_chat_messages')
        .select('id, sender_email, receiver_email, message, created_at')
        .eq('sender_email', me)
        .eq('receiver_email', other)
        .order('created_at', { ascending: true }),
      supabase
        .from('internal_chat_messages')
        .select('id, sender_email, receiver_email, message, created_at')
        .eq('sender_email', other)
        .eq('receiver_email', me)
        .order('created_at', { ascending: true }),
    ]);
    if (res1.error) throw res1.error;
    if (res2.error) throw res2.error;
    const combined = [...(res1.data || []), ...(res2.data || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const list = combined.map((row) => ({
      id: row.id,
      sender_email: row.sender_email,
      receiver_email: row.receiver_email,
      message: row.message,
      created_at: row.created_at,
      minha: row.sender_email?.toLowerCase() === me,
    }));

    return NextResponse.json({ data: list });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** Envia uma mensagem para outro usuário. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let body: { to_email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const toEmail = typeof body?.to_email === 'string' ? body.to_email.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!toEmail || !message) {
    return NextResponse.json({ error: 'to_email e message são obrigatórios' }, { status: 400 });
  }

  const me = user.email.toLowerCase();
  const receiver = toEmail.toLowerCase();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('internal_chat_messages')
      .insert({
        sender_email: me,
        receiver_email: receiver,
        message,
      })
      .select('id, sender_email, receiver_email, message, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        id: data.id,
        sender_email: data.sender_email,
        receiver_email: data.receiver_email,
        message: data.message,
        created_at: data.created_at,
        minha: true,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
