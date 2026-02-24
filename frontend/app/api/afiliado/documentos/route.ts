// Upload de documentos do afiliado (completar cadastro): identidade/CPF e comprovante de residência

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAfiliadoIdFromRequest } from '@/lib/auth-jwt';
import { logger } from '@/lib/logger';

const TIPOS = ['identidade', 'comprovante_residencia'] as const;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  try {
    const afiliadoId = await getAfiliadoIdFromRequest(request);
    if (!afiliadoId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const tipo = formData.get('tipo') as string | null;
    const file = formData.get('file') as File | null;

    if (!tipo || !TIPOS.includes(tipo as (typeof TIPOS)[number])) {
      return NextResponse.json(
        { error: 'tipo inválido. Use: identidade ou comprovante_residencia' },
        { status: 400 },
      );
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato não permitido. Use JPG, PNG, WebP ou PDF.' },
        { status: 400 },
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext) ? ext : 'jpg';
    const storagePath = `afiliados/${afiliadoId}/${tipo}_${Date.now()}.${safeExt}`;

    const supabase = createServiceClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error('[afiliado documentos] upload', uploadError, { afiliado_id: afiliadoId, tipo });
      return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(storagePath);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    logger.error('[afiliado documentos]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 },
    );
  }
}
