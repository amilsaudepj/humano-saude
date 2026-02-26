# Alice Assets Report

## Copiados para `/public/brand/alice/`

| Arquivo                            | Origem (Alice CDN)                                          | Uso sugerido           |
| ---------------------------------- | ----------------------------------------------------------- | ---------------------- |
| `mapa-rede-credenciada.webp`       | mapa pins rede credenciada (desktop)                        | Hero visual / network  |
| `mapa-rede-credenciada-mobile.avif`| mapa pins rede credenciada (mobile)                         | Hero visual responsive |
| `hospitais-alice.webp`             | cards flutuantes de hospitais                               | BenefitsScroll         |
| `video-poster.jpg`                 | poster do vídeo principal (home hero)                       | HeroSection container  |
| `portal-alice.webp`                | screenshot portal RH                                        | PlanCards ou extra      |

## Não copiados (referências externas / CDN)

| Asset                              | Motivo                                                       |
| ---------------------------------- | ------------------------------------------------------------ |
| Fotos de especialistas (foto-1..4) | Hospedadas em CDN da Alice (não local). Usar placeholder SVG |
| Logos de clientes (Creditas, Zig…)  | Marca de terceiros. Substituir por logos Humano Saúde        |
| Vídeo MP4 (67f80581…transcode.mp4) | 45MB+, pesado para repo. Manter referência ou hospedar à parte |
| Fontes Haffer (woff2)              | Proprietárias da Alice. Usar Inter (já no projeto)           |
| Favicon SVG da Alice               | Não relevante (usamos icon-humano.png)                       |

## Placeholders necessários

- Fotos de especialistas → usar ícones SVG genéricos nos cards de especialistas
- Logos de clientes → seção não incluída na PF (se precisar, usar logos das operadoras parceiras)
