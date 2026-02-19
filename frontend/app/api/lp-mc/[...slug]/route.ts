import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

// ─── Tema Mattos Connect ────────────────────────────────────
// Paleta: Azul Primário #003366 | Branco #FFFFFF | Cinza Escuro #333333
//         Cinza Claro #F5F5F5 | Azul Acento #0066CC
// Estratégia: força fundo branco + substitui todas as ocorrências dark/black
// O site foi exportado com tema escuro; este CSS faz o override completo.
const MC_THEME_CSS = `
<style id="mc-theme">
  /* ── Reset: força modo claro mesmo que o site use dark: ── */
  :root { color-scheme: light; }

  /* ── Fundo geral ── */
  html, body,
  .bg-background,
  .min-h-dvh { background-color: #ffffff !important; color: #333333 !important; }

  /* ── Header ── */
  header {
    background-color: rgba(255,255,255,0.95) !important;
    border-bottom-color: #e5e7eb !important;
    backdrop-filter: blur(8px);
  }

  /* ── Logo: remove o invert (era para fundo escuro) ── */
  header img[alt="Mattos Connect"],
  footer img[alt="Mattos Connect"] {
    filter: none !important;
  }

  /* ── Nav links ── */
  nav a {
    color: #333333 !important;
  }
  nav a:hover { color: #003366 !important; }

  /* ── Botão CTA principal ── */
  a[href="/contato"].rounded-full,
  button.rounded-full {
    background-color: #003366 !important;
    color: #ffffff !important;
    border: none !important;
  }
  a[href="/contato"].rounded-full:hover,
  button.rounded-full:hover {
    background-color: #0066CC !important;
  }

  /* ── Botão secundário (outline) ── */
  a.border.rounded-full {
    background-color: #ffffff !important;
    color: #003366 !important;
    border-color: #003366 !important;
  }
  a.border.rounded-full:hover {
    background-color: #F5F5F5 !important;
  }

  /* ── Seções com fundo preto/escuro → fundo claro ── */
  .bg-black,
  [class*="bg-black"],
  [class*="bg-zinc-950"],
  [class*="bg-zinc-900"] {
    background-color: #003366 !important;
    color: #ffffff !important;
  }

  /* ── Ticker/Banner marquee ── */
  .bg-black.text-white {
    background-color: #003366 !important;
  }

  /* ── Cards escuros → cinza claro ── */
  [class*="bg-zinc-900\\/60"],
  [class*="bg-white\\/5"],
  [class*="bg-black\\/40"],
  [class*="bg-black\\/35"],
  [class*="bg-black\\/30"] {
    background-color: #F5F5F5 !important;
    color: #333333 !important;
    border-color: #e5e7eb !important;
  }

  /* ── Textos em branco sobre fundo claro → texto escuro ── */
  .text-white { color: #333333 !important; }
  .text-white\/70 { color: #555555 !important; }
  .text-white\/60 { color: #666666 !important; }
  .text-white\/50 { color: #777777 !important; }
  .text-white\/45 { color: #888888 !important; }
  .text-white\/40 { color: #999999 !important; }
  .text-white\/80 { color: #333333 !important; }

  /* ── Destaque verde (emerald) → azul acento Mattos ── */
  .text-emerald-400, .text-emerald-300, .text-emerald-600 {
    color: #0066CC !important;
  }
  .bg-emerald-400\/10, .bg-emerald-500\/20 {
    background-color: rgba(0,102,204,0.1) !important;
  }
  .border-emerald-400\/20, .border-emerald-400\/25 {
    border-color: rgba(0,102,204,0.3) !important;
  }

  /* ── Gradientes de fundo hero ── */
  .bg-black.text-white section,
  section.relative {
    background-color: transparent !important;
  }

  /* ── Números grandes (stats) ── */
  .text-emerald-300, .text-emerald-400 { color: #003366 !important; }

  /* ── Bordas escuras → borda suave ── */
  [class*="border-white\\/10"],
  [class*="border-white\\/15"] {
    border-color: #e5e7eb !important;
  }

  /* ── Footer ── */
  footer {
    background-color: #F5F5F5 !important;
    border-top-color: #e5e7eb !important;
    color: #333333 !important;
  }
  footer a { color: #003366 !important; }
  footer a:hover { color: #0066CC !important; }
  footer p, footer div { color: #555555 !important; }

  /* ── Loading overlays: oculta ambos (z-[100] barra topo + z-[120] tela inicial) ── */
  /* O JS vai removê-los mas o CSS garante que não aparecem mesmo antes */
  [aria-label="Carregando"],
  div[aria-hidden="true"].pointer-events-none.fixed,
  .pointer-events-none.fixed.left-0.right-0.top-0,
  div[class*="z-\\[120\\]"],
  div[class*="z-\\[100\\]"].pointer-events-none.fixed { display: none !important; }

  /* ── Inputs e formulários ── */
  input, textarea {
    background-color: #ffffff !important;
    color: #333333 !important;
    border-color: #e5e7eb !important;
  }
  input::placeholder, textarea::placeholder { color: #aaaaaa !important; }
</style>
`;

// ─── Mapa de extensões → Content-Type ──────────────────────
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.txt':  'text/plain',
};

function getMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] ?? 'application/octet-stream';
}

// ─── Resolve qual arquivo HTML serve para cada rota ────────
// /                 → _mc/index.html
// /contato          → _mc/contato.html
// /metodo           → _mc/metodo.html
// /diagnostico      → _mc/diagnostico.html
// /sobre            → _mc/sobre.html
// /conteudos        → _mc/conteudos.html
// /_next/...        → _mc/_next/... (assets estáticos)
// /LOGO_...avif     → _mc/LOGO_...avif (imagens de raiz)
// 404               → _mc/404.html
function resolveFile(slugParts: string[]): string {
  const mcDir = path.join(process.cwd(), 'public', '_mc');
  const joined = slugParts.join('/');

  // Arquivo com extensão conhecida → serve diretamente
  const ext = path.extname(joined);
  if (ext && ext !== '.html') {
    return path.join(mcDir, joined);
  }

  // Sem extensão → tenta como página HTML
  const htmlPath = path.join(mcDir, joined + '.html');
  return htmlPath;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const mcDir = path.join(process.cwd(), 'public', '_mc');

  try {
    let filePath = resolveFile(slug);

    // Normaliza path para evitar directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(mcDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    let fileContent: Buffer;
    try {
      fileContent = await readFile(normalizedPath);
    } catch {
      // Tenta fallback: se slug aponta para diretório, tenta index.html dentro
      try {
        fileContent = await readFile(path.join(normalizedPath.replace(/\.html$/, ''), 'index.html'));
        filePath = path.join(normalizedPath.replace(/\.html$/, ''), 'index.html');
      } catch {
        // 404
        const notFound = await readFile(path.join(mcDir, '404.html')).catch(() => Buffer.from('Not found'));
        let notFoundHtml = notFound.toString('utf-8');
        notFoundHtml = notFoundHtml.replace(/\/_next\/image\?url=%2F([^&"'\s]+)(?:&[^"'\s]*)*/g, '/api/lp-mc/$1');
        notFoundHtml = notFoundHtml.replace(/\/_next\//g, '/api/lp-mc/_next/');
        return new NextResponse(new TextEncoder().encode(notFoundHtml), {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    const mime = getMime(filePath);
    const headers: Record<string, string> = { 'Content-Type': mime };

    // ── Injeta CSS de tema Mattos Connect em páginas HTML ──
    let finalContent: Buffer | string = fileContent;
    if (mime.includes('html')) {
      let html = fileContent.toString('utf-8');

      // 1. Reescreve /_next/image?url=%2FFILENAME.ext&w=N&q=N → /api/lp-mc/FILENAME.ext
      //    (O Next.js Image Optimizer buscaria a imagem em public/ raiz, mas ela está em
      //     public/_mc/ → servimos o arquivo estático diretamente pelo nosso API route)
      html = html.replace(/\/_next\/image\?url=%2F([^&"'\s]+)(?:&[^"'\s]*)*/g, '/api/lp-mc/$1');

      // 2. Reescreve todos os demais /_next/ → /api/lp-mc/_next/
      //    (JS chunks, CSS, fontes, build manifests — tudo no nosso API route, não no build principal)
      html = html.replace(/\/_next\//g, '/api/lp-mc/_next/');

      // 3. Remove scripts de hidratação Next.js (__next_f) — causam o App Router tentar
      //    inicializar no domínio mattosconnect e mostrar "404 | This page could not be found"
      html = html.replace(/<script[^>]*>\s*\(self\.__next_f[\s\S]*?<\/script>/g, '');
      html = html.replace(/<script[^>]*id="_R_"[^>]*><\/script>/g, '');

      // 4. Injeta script que oculta os overlays de loading antes de qualquer render
      //    (o site tem dois: z-[100] barra de progresso e z-[120] tela de loading)
      //    e também desativa o invert do logo (que era para fundo escuro)
      const MC_LOADING_KILL = `<script>
        (function(){
          function hideLoading(){
            // Remove loading overlays pelo aria-label e por classes z-index altas
            document.querySelectorAll('[aria-label="Carregando"]').forEach(function(el){ el.remove(); });
            document.querySelectorAll('[aria-hidden="true"].pointer-events-none.fixed').forEach(function(el){ el.remove(); });
            // Remove a barra de progresso fixa no topo
            var prog = document.querySelector('.pointer-events-none.fixed.left-0.right-0.top-0');
            if(prog) prog.remove();
          }
          if(document.readyState === 'loading'){
            document.addEventListener('DOMContentLoaded', hideLoading);
          } else {
            hideLoading();
          }
        })();
      </script>`;

      // 5. Injeta o <style> + kill-script logo antes do </head>
      finalContent = html.replace('</head>', `${MC_THEME_CSS}${MC_LOADING_KILL}</head>`);
    }

    // Cache agressivo para assets estáticos (CSS/JS/fontes/imagens)
    if (slug[0] === '_next' || mime.startsWith('image/') || mime.startsWith('font/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else if (mime.includes('html')) {
      headers['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=600';
    }

    const body = typeof finalContent === 'string'
      ? new TextEncoder().encode(finalContent)
      : new Uint8Array(finalContent);

    return new NextResponse(body, { status: 200, headers });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
