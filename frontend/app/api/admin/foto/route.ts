import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ─── POST: Upload de foto do admin ─────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('foto') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.' },
        { status: 400 },
      );
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `admin/foto_${Date.now()}.${ext}`;

    // Upload para Supabase Storage (bucket "documentos" - mesmo do corretor)
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error('[admin foto upload]', uploadError);
      return NextResponse.json({
        error: `Erro ao fazer upload: ${uploadError.message}`
      }, { status: 500 });
    }

    // Gerar URL pública
    const { data: publicUrlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName);

    const fotoUrl = publicUrlData.publicUrl;

    // Atualizar foto_url no admin_profile (integration_settings)
    const { data: existing } = await supabase
      .from('integration_settings')
      .select('config')
      .eq('integration_name', 'admin_profile')
      .single();

    const currentConfig = (existing?.config as Record<string, unknown>) || {};
    const updatedConfig = { ...currentConfig, foto_url: fotoUrl };

    const { error: updateError } = await supabase
      .from('integration_settings')
      .upsert(
        {
          integration_name: 'admin_profile',
          encrypted_credentials: {},
          config: updatedConfig,
          is_active: true,
        },
        { onConflict: 'integration_name' },
      );

    if (updateError) {
      logger.error('[admin foto update]', updateError);
      return NextResponse.json({ error: 'Erro ao salvar URL da foto' }, { status: 500 });
    }

    return NextResponse.json({ success: true, foto_url: fotoUrl });
  } catch (err) {
    logger.error('[admin foto POST]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ─── DELETE: Remover foto do admin ──────────────────────────
export async function DELETE() {
  try {
    const supabase = createServiceClient();

    // Ler config atual
    const { data: existing } = await supabase
      .from('integration_settings')
      .select('config')
      .eq('integration_name', 'admin_profile')
      .single();

    const currentConfig = (existing?.config as Record<string, unknown>) || {};
    const updatedConfig = { ...currentConfig, foto_url: null };

    const { error } = await supabase
      .from('integration_settings')
      .upsert(
        {
          integration_name: 'admin_profile',
          encrypted_credentials: {},
          config: updatedConfig,
          is_active: true,
        },
        { onConflict: 'integration_name' },
      );

    if (error) {
      logger.error('[admin foto delete]', error);
      return NextResponse.json({ error: 'Erro ao remover foto' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[admin foto DELETE]', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
