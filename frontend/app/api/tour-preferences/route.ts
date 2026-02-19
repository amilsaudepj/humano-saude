import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth-jwt';

const supabase = createServiceClient();

// GET — load tour preferences
export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get('role') as 'admin' | 'corretor' | null;
    const version = req.nextUrl.searchParams.get('version') || 'v3';

    if (!role) {
      return NextResponse.json({ error: 'role obrigatório' }, { status: 400 });
    }

    if (role === 'corretor') {
      const cookieStore = await cookies();
      const token = cookieStore.get('corretor_token')?.value;
      if (!token) return NextResponse.json({ hide: false, completed: false });

      const payload = await verifyToken(token);
      if (!payload?.corretor_id) return NextResponse.json({ hide: false, completed: false });

      const { data } = await supabase
        .from('corretores')
        .select('metadata')
        .eq('id', payload.corretor_id)
        .single();

      const metadata = (data?.metadata as Record<string, unknown>) || {};
      const hideKey = `tour_${role}_${version}_hidden`;
      const completedKey = `tour_${role}_${version}_completed`;

      return NextResponse.json({
        hide: metadata[hideKey] === true,
        completed: metadata[completedKey] === true,
      });
    }

    if (role === 'admin') {
      const cookieStore = await cookies();
      const adminToken = cookieStore.get('admin_token')?.value;
      if (!adminToken) return NextResponse.json({ hide: false, completed: false });

      const payload = await verifyToken(adminToken);
      if (!payload) return NextResponse.json({ hide: false, completed: false });

      const { data } = await supabase
        .from('integration_settings')
        .select('config')
        .eq('integration_name', 'admin_profile')
        .single();

      const config = (data?.config as Record<string, unknown>) || {};
      const hideKey = `tour_${role}_${version}_hidden`;
      const completedKey = `tour_${role}_${version}_completed`;

      return NextResponse.json({
        hide: config[hideKey] === true,
        completed: config[completedKey] === true,
      });
    }

    return NextResponse.json({ hide: false, completed: false });
  } catch {
    return NextResponse.json({ hide: false, completed: false });
  }
}

// POST — save tour preferences
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, version = 'v3', hide, completed } = body as {
      role: 'admin' | 'corretor';
      version?: string;
      hide?: boolean;
      completed?: boolean;
    };

    if (!role) {
      return NextResponse.json({ error: 'role obrigatório' }, { status: 400 });
    }

    const hideKey = `tour_${role}_${version}_hidden`;
    const completedKey = `tour_${role}_${version}_completed`;

    if (role === 'corretor') {
      const cookieStore = await cookies();
      const token = cookieStore.get('corretor_token')?.value;
      if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

      const payload = await verifyToken(token);
      if (!payload?.corretor_id) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

      // Read current metadata
      const { data: current } = await supabase
        .from('corretores')
        .select('metadata')
        .eq('id', payload.corretor_id)
        .single();

      const metadata = (current?.metadata as Record<string, unknown>) || {};

      if (hide !== undefined) metadata[hideKey] = hide;
      if (completed !== undefined) metadata[completedKey] = completed;

      const { error } = await supabase
        .from('corretores')
        .update({ metadata })
        .eq('id', payload.corretor_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (role === 'admin') {
      const cookieStore = await cookies();
      const adminToken = cookieStore.get('admin_token')?.value;
      if (!adminToken) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

      const payload = await verifyToken(adminToken);
      if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

      // Read current config
      const { data: current } = await supabase
        .from('integration_settings')
        .select('config')
        .eq('integration_name', 'admin_profile')
        .single();

      if (current) {
        const config = (current.config as Record<string, unknown>) || {};
        if (hide !== undefined) config[hideKey] = hide;
        if (completed !== undefined) config[completedKey] = completed;

        const { error } = await supabase
          .from('integration_settings')
          .update({ config })
          .eq('integration_name', 'admin_profile');

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        // Create admin_profile row
        const config: Record<string, unknown> = {};
        if (hide !== undefined) config[hideKey] = hide;
        if (completed !== undefined) config[completedKey] = completed;

        const { error } = await supabase
          .from('integration_settings')
          .insert({
            integration_name: 'admin_profile',
            config,
            is_active: true,
          });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Role inválido' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 },
    );
  }
}
