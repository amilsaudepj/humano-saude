import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const supabase = createServiceClient();

// GET — listar uploads do corretor
export async function GET(req: NextRequest) {
  try {
    const corretorId = req.nextUrl.searchParams.get('corretorId');
    const all = req.nextUrl.searchParams.get('all');

    let query = supabase
      .from('corretor_uploads')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (all === 'true') {
      // Admin: retorna todos os uploads
      query = query.limit(500);
    } else if (corretorId) {
      query = query.eq('corretor_id', corretorId);
    } else {
      return NextResponse.json({ error: 'corretorId obrigatório' }, { status: 400 });
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, uploads: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 },
    );
  }
}

// POST — upload de arquivo
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const corretorId = formData.get('corretorId') as string;
    const pasta = (formData.get('pasta') as string) || 'geral';

    if (!file || !corretorId) {
      return NextResponse.json({ error: 'Arquivo e corretorId obrigatórios' }, { status: 400 });
    }

    // Limitar tamanho: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo excede 10MB' }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `corretor-uploads/${corretorId}/${pasta}/${timestamp}_${safeName}`;

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);

    // Registrar no banco
    const { data, error } = await supabase
      .from('corretor_uploads')
      .insert({
        corretor_id: corretorId,
        nome: file.name,
        file_path: storagePath,
        file_url: urlData.publicUrl,
        tipo_arquivo: file.type,
        tamanho_bytes: file.size,
        pasta,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ upload: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 },
    );
  }
}

// DELETE — remover arquivo
export async function DELETE(req: NextRequest) {
  try {
    const { id, corretorId } = await req.json();
    if (!id || !corretorId) {
      return NextResponse.json({ error: 'id e corretorId obrigatórios' }, { status: 400 });
    }

    // Buscar arquivo
    const { data: upload, error: fetchError } = await supabase
      .from('corretor_uploads')
      .select('file_path')
      .eq('id', id)
      .eq('corretor_id', corretorId)
      .single();

    if (fetchError || !upload) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    // Soft delete no banco
    const { error: deleteError } = await supabase
      .from('corretor_uploads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('corretor_id', corretorId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Remover do storage
    await supabase.storage.from('media').remove([upload.file_path]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 },
    );
  }
}
