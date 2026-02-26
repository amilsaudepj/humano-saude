/**
 * Conteúdo da página Pessoa Física – Humano Saúde
 * Conceito: corretora que compara operadoras para você (individual/familiar)
 * ID visual: Design System Humano Saúde (dourado #B8941F, #050505, Montserrat). Estruturas: Reflect + Family + Alice.
 */

export const pfPageContent = {
  header: {
    navItems: ['Início', 'Rede', 'Como funciona', 'Compare', 'Depoimentos', 'Contato'],
    ctaLabel: 'Cotação grátis',
  },

  hero: {
    badge: 'Cotação em até 10 minutos',
    /** Frase destacada no título (estilo Softlite .highlight) */
    titleHighlight: 'e na sua família',
    title: 'O plano de saúde que cabe no seu bolso e na sua família',
    subtitle:
      'Somos uma corretora especializada: comparamos as melhores operadoras do mercado e entregamos a melhor oferta para você, sem custo extra.',
    primaryCta: 'Cotação grátis',
    secondaryCta: 'Sou empresa',
    trustLine: 'Seus dados estão seguros. Sem spam.',
  },

  rede: {
    title: 'Acesso à rede que você merece',
    subtitle:
      'Trabalhamos com as principais operadoras do Brasil. Você escolhe a rede e a gente encontra o melhor preço com Amil, Bradesco Saúde, SulAmérica e outras.',
    ctaLabel: 'Ver operadoras que trabalhamos',
  },

  operadorasCarousel: {
    title: 'Uma corretora que coloca você no centro',
    subtitle: 'Comparação transparente, sem letras miúdas. Você decide com informação.',
    cards: [
      { title: 'Cotação em minutos', description: 'Resposta por WhatsApp em até 10 min' },
      { title: 'Várias operadoras', description: 'Amil, Bradesco, SulAmérica e mais' },
      { title: 'Sem custo extra', description: 'Você não paga a mais por usar a corretora' },
      { title: 'Individual ou familiar', description: 'Planos para você e sua família' },
      { title: 'Economia real', description: 'Comparamos preços e carências por você' },
      { title: 'Suporte humano', description: 'Especialista disponível para tirar dúvidas' },
    ],
  },

  videoChecklist: {
    title: 'Resposta rápida, sem enrolação',
    bullets: [
      'Cotação personalizada em até 10 minutos via WhatsApp.',
      'Compare planos de diferentes operadoras em um só lugar.',
      'Contrate com segurança e reduza carência quando migrar.',
    ],
  },

  compare: {
    title: 'Compare e escolha com clareza',
    subtitle: 'Trazemos ofertas das principais operadoras. Você vê cobertura, preço e rede antes de decidir.',
    items: [
      { name: 'Amil', tag: 'Rede nacional para você cuidar da saúde com praticidade, onde estiver.' },
      { name: 'Bradesco Saúde', tag: 'Cobertura ampla com padrão premium para quem exige o melhor atendimento.' },
      { name: 'SulAmérica', tag: 'Flexibilidade de planos e benefícios para você escolher do seu jeito.' },
      { name: 'Outras operadoras', tag: 'Conforme sua região' },
    ],
  },

  depoimentos: {
    title: 'Quem já comparou com a Humano Saúde',
    items: [
      {
        quote: 'Fui atendido rápido e consegui um plano melhor que o que eu tinha, pagando menos.',
        author: 'Cliente Humano Saúde',
        role: 'Plano familiar',
      },
      {
        quote: 'Não sabia que dava para reduzir carência trocando de operadora. A equipe explicou tudo.',
        author: 'Cliente Humano Saúde',
        role: 'Migração',
      },
      {
        quote: 'Cotação em minutos e sem pressão. Recomendo.',
        author: 'Cliente Humano Saúde',
        role: 'Individual',
      },
    ],
  },

  footer: {
    title: 'Pronto para comparar e economizar?',
    subtitle: 'Fale com um especialista e receba sua cotação personalizada em minutos.',
    ctaLabel: 'Cotação grátis via WhatsApp',
    disclaimer: '© Humano Saúde. Todos os direitos reservados.',
  },

  /** Seção tipo Reflect: visual + pill + headline + 2 features (Never lose information). Softlite: highlight no título. */
  featureHighlight: {
    tag: 'Cotação e acompanhamento',
    title: 'Nunca perca sua cotação',
    titleHighlight: 'cotação',
    subtitle:
      'Tudo em um lugar: compare ofertas, tire dúvidas por WhatsApp e receba sua cotação em minutos. Depois, acompanhe sua proposta sem enrolação.',
    features: [
      {
        title: 'Integrado ao seu dia a dia',
        description: 'Resposta por WhatsApp, sem precisar ligar ou preencher vários formulários. Você envia o que precisa e recebe a comparação.',
        icon: 'devices',
      },
      {
        title: 'Transparência do início ao fim',
        description: 'Explicamos cobertura, carências e preço antes de você decidir. Nada de letra miúda escondida.',
        icon: 'shield',
      },
    ],
  },

  /** Seção dores: título e subtítulo persuasivos (foco na dor do cliente) */
  detailsMatter: {
    title: 'As dores que a gente entende.',
    subtitle:
      'Reajuste que sobe sem avisar, aniversário que dispara o preço, rede que some do dia para a noite. A gente audita, compara e te ajuda a não ficar no prejuízo.',
    features: [
      { title: 'Reajuste Anual', description: 'Sua operadora mandou a conta? Nossa IA audita se o reajuste foi abusivo.' },
      { title: 'Coparticipação', description: 'Pare de pagar por quem não usa. Descubra a Coparticipação Inteligente.' },
      { title: 'Aumento de faixa etária', description: 'Alerta de aniversário: veja como travar o salto de preço da próxima faixa etária.' },
      { title: 'Rede Credenciada', description: 'Rede que some do dia para a noite? A gente compara e te ajuda a não ficar no prejuízo.' },
    ],
  },

  /** 4 blocos das maiores dores – Sticky Scroll (Reajuste, Coparticipação, Faixa etária, Rede) */
  stickyScrollBlocks: [
    {
      id: '01',
      title: 'Reajuste Anual',
      scene: 'Empresário com cara de susto olhando uma carta/boleto vermelho.',
      description:
        'Sua operadora mandou a conta?\nNossa IA audita se o reajuste foi abusivo.',
    },
    {
      id: '02',
      title: 'Coparticipação',
      scene: 'Gráfico mostrando uma mensalidade fixa caindo 30%.',
      description:
        'Pare de pagar por quem não usa.\nDescubra a Coparticipação Inteligente.',
    },
    {
      id: '03',
      title: 'Aumento de faixa etária',
      scene: 'Calendário com a idade "44" circulada em vermelho + Alerta de celular.',
      description:
        'Alerta de aniversário:\nVeja como travar o salto de preço da próxima faixa etária.',
    },
    {
      id: '04',
      title: 'Rede Credenciada',
      scene: 'Celular mostrando o logo de hospitais premium (Copa D\'Or, etc).',
      description:
        'Sua rede mudou?\nVeja quais planos ainda dão acesso aos melhores hospitais do RJ.',
    },
  ],

  /** Seção tipo Reflect: "Hardened security" – dados protegidos */
  security: {
    tag: 'Privacidade',
    title: 'Seus dados protegidos',
    description:
      'Usamos suas informações apenas para montar a cotação e entrar em contato. Não vendemos dados e não fazemos spam. Você pode pedir exclusão a qualquer momento.',
  },

  faq: {
    title: 'Tire suas dúvidas',
    subtitle: 'antes de decidir',
    items: [
      {
        question: 'Quanto tempo leva para receber a cotação?',
        answer: 'Em até 10 minutos via WhatsApp. Enviamos uma comparação com as melhores ofertas das operadoras que trabalhamos, sem compromisso.',
      },
      {
        question: 'Eu pago algo a mais por usar a corretora?',
        answer: 'Não. Nossa remuneração vem da operadora. Você paga o mesmo que pagaria contratando direto, com a vantagem de ter comparação e suporte da Humano Saúde.',
      },
      {
        question: 'Posso contratar plano individual ou só familiar?',
        answer: 'Os dois. Trabalhamos com planos individuais e familiares das principais operadoras. A cotação é personalizada para o seu perfil.',
      },
      {
        question: 'Se eu já tenho plano, posso migrar e reduzir carência?',
        answer: 'Em muitos casos sim. Depende da operadora de origem e de destino. Na cotação explicamos as condições de migração e redução de carência quando aplicável.',
      },
      {
        question: 'Quais operadoras vocês comparam?',
        answer: 'Trabalhamos com Amil, Bradesco Saúde, SulAmérica e outras operadoras de referência. A comparação considera rede, cobertura e preço para o seu perfil.',
      },
      {
        question: 'Meus dados estão seguros?',
        answer: 'Sim. Usamos suas informações apenas para montar a cotação e não fazemos spam. Você pode pedir exclusão dos dados a qualquer momento.',
      },
    ],
  },
} as const;

export type PfPageContent = typeof pfPageContent;
