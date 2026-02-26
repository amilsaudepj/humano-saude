# Referências – Página Pessoa Física

A página segue a **estrutura do site empresas** (home): mesmo fluxo de seções, **header e footer pretos** (igual empresas), copy adaptado para pessoa física. O design e os recursos visuais vêm dos **três sites de referência** (Alice, Reflect, Family), com identidade Humano Saúde (dourado #B8941F, fundo branco no conteúdo, Montserrat).

---

## Alice

- **Hero**: estrutura 2 colunas / centralizada, container para imagem (mapa rede credenciada).
- **SectionRede**: layout 2 colunas (texto + CTA outline + imagem), padrão “s-2col” da Alice.
- **SectionOperadorasCarousel**: duas linhas de cards com **parallax no scroll** (inspirado nos “especialistas” da Alice).
- **SectionVideoChecklist**: coluna vídeo/poster + coluna checklist com bullets (vídeo + c-checklist).
- **SectionCompare**: grid de itens (operadoras) com hover, inspirado em chart/grid da Alice.
- **Conteúdo e assets**: copy e imagens em `content/`, assets em `/public/brand/alice/` (mapa, hospitais, vídeo, etc.).
- **BenefitsScroll / PlanCards** (quando usados): grid de benefícios e cards com ícones, baseados em aliceContent.

---

## Reflect

- **Hero**: bloco centralizado, badge em “pill” com glassmorphism, ambient glow no topo.
- **Container do hero**: borda dupla (inset + padding) no bloco da imagem (Reflect feature container).
- **HeaderPF**: nav em pill com blur, fundo semitransparente, estilo header Reflect.
- **Blur e bordas**: uso de `backdrop-filter`, bordas sutis e gradientes radiais no fundo.
- **SectionCompare**: cards com blur e borda no hover (feature grid).
- **PlanCards**: gridlines verticais/horizontal (estilo Reflect).

---

## Softlite (softlite.io)

- **Hero**: subheading em pill (`.subheading`: fundo #eae9e6, padding 8px 20px, border-radius 100px, font-size 16px) acima do título; frase de destaque no título com `.highlight` (fundo #DFC0FF, padding 3px 8px, border-radius 20px). Ex.: “Clone websites to your Page Builders in **minutes with AI**”.
- **Seções**: títulos com mesma técnica de **highlight** em uma palavra ou frase (“The fastest way to clone a website **without coding**”).
- **Botões**: `.bricks-button` primary com border-radius 9999px (pill), hover com borda.
- **Tipografia**: Inter / Inter Tight no site original; na LP mantemos Montserrat com o padrão subheading + highlight.
- **Pricing/Features**: blocos escuros (#151718), border-radius 16px, listas com ícone + título + descrição.

**Aplicado na LP:** Hero com subheading em pill (badge) e frase destacada no título (`.highlight` em “e na sua família”); SectionFeatureHighlight com `.highlight` na palavra “cotação”; CTA principal do hero com `rounded-[9999px]` (botão pill).

---

## Family

- **Animações**: spring nos botões (`whileHover`, `whileTap`) e nas entradas de seção (Framer Motion).
- **SectionDepoimentos**: carousel de depoimentos com dots e `AnimatePresence` (testimonials Family).
- **CTAs**: ênfase em botões com micro-interações (scale, spring).

---

## Design System Humano Saúde (aplicado)

- **Cores**: dourado principal **#B8941F**, dourado tema **#D4AF37**, gradiente **#bf953f → #aa771c**, fundo **#050505** (Black Piano).
- **Tipografia**: **Montserrat** (layout `font-montserrat`).
- **Tokens**: `content/pfDesignTokens.ts` centraliza todos os valores para manter a ID visual alinhada ao Design System.

Nenhum recurso relevante dos três sites foi ignorado: estrutura, inovação e elementos visuais foram mesclados com a identidade da Humano Saúde.
