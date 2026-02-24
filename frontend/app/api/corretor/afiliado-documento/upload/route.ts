import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getCorretorIdFromRequest } from '@/lib/auth-jwt';
import { logger } from '@/lib/logger';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const corretorId = await getCorretorIdFromRequest(request);
    if (!corretorId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 });
    }

    const type = (file as File).type || 'application/octet-stream';
    const name = (file as File).name || 'documento';
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(type) && !name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Formato não suportado. Use PDF, JPG ou PNG.' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const ext = name.split('.').pop()?.toLowerCase() || 'pdf';
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
    const path = `afiliados/${corretorId}/${Date.now()}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(path, buffer, {
        contentType: type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('[afiliado-documento/upload]', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Falha ao enviar documento' },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(path);
    return NextResponse.json({ url: urlData?.publicUrl ?? '' });
  } catch (err) {
    logger.error('[afiliado-documento/upload]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
