# Ícones na página Pessoa Física

## Método 1: Lucide React (uso geral)

Para botões, menus, rodapé, listas de benefícios:

```tsx
import { ShieldCheck, ArrowRight, Phone } from 'lucide-react';

<ShieldCheck className="w-5 h-5" style={{ color: PF_TOKENS.primary }} />
<ArrowRight className="w-4 h-4" />
```

A biblioteca `lucide-react` já está instalada. Basta importar o ícone e usar com `className` e `style` quando precisar.

## Método 2: SVG bruto + Framer Motion (animações pathLength)

Para ícones de destaque com animação de “desenho na tela”:

1. Acesse [lucide.dev](https://lucide.dev), busque o ícone (ex: Heart, Shield, Activity).
2. Passe o mouse e clique em **Copy SVG**.
3. Cole o código no Cursor e peça: *“Transforme este SVG em um componente React com Framer Motion. Aplique animação de pathLength de 0 a 1 para o ícone se desenhar na tela. Mantenha as coordenadas originais.”*

Exemplo de uso já criado: `IconShieldDraw.tsx` — ícone de escudo que “desenha” ao aparecer. Para outros ícones premium, crie componentes semelhantes usando `motion.path` e `pathLength: [0, 1]`.
