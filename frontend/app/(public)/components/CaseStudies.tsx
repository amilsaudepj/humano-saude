'use client';

export default function CaseStudies() {
  const cases = [
    {
      tipo: 'PLANO EMPRESARIAL',
      custoAnterior: 'R$ 5.840,00',
      novoCusto: 'R$ 3.120,00',
      reducao: '46% de Redução',
      extra: 'Mesma Rede Hospitalar',
    },
    {
      tipo: 'PLANO FAMILIAR',
      custoAnterior: 'R$ 3.200,00',
      novoCusto: 'R$ 1.950,00',
      reducao: '39% de Redução',
      extra: 'Upgrade de Rede Samaritano',
    },
    {
      tipo: 'PLANO INDIVIDUAL',
      custoAnterior: 'R$ 1.100,00',
      novoCusto: 'R$ 680,00',
      reducao: '40% de Redução',
      extra: 'Migração sem novas Carências',
    },
  ];

  return (
    <section id="pratica" className="py-20 sm:py-32 bg-white text-slate-900 border-t border-gray-50 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter italic font-cinzel leading-[1.1]">
          Análise <span className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent">Na Prática</span>
        </h2>
        <p className="text-gray-500 text-lg tracking-widest uppercase font-medium mb-24">
          Como transformamos despesa em economia real
        </p>

        <div className="grid md:grid-cols-3 gap-12 text-left mb-20">
          {cases.map((item, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-white to-gray-50 p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-[3.5rem] border border-gray-200 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[3px] mb-8 italic">
                {item.tipo}
              </p>
              
              <div className="space-y-6 mb-10">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-bold mb-1">Custo Anterior</p>
                  <p className="text-2xl text-red-500 line-through font-bold tracking-tight">{item.custoAnterior}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-800 font-black uppercase tracking-widest mb-1">Novo Custo Humano</p>
                  <p className="text-4xl text-slate-900 font-black tracking-tighter">{item.novoCusto}</p>
                </div>
              </div>

              <div className="pt-8 border-t-2 border-[#bf953f] flex flex-col gap-4">
                <div className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] text-white py-2.5 px-6 rounded-full text-xs font-black uppercase tracking-widest text-center shadow-md italic">
                  {item.reducao}
                </div>
                <p className="text-[11px] text-gray-400 text-center font-bold italic uppercase">
                  {item.extra}
                </p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://wa.me/5521988179407?text=Olá!%20Desejo%20Simular%20minha%20Economia%20Real."
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#bf953f] to-[#aa771c] px-12 py-5 rounded-2xl text-sm uppercase tracking-widest font-black text-white hover:shadow-xl transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
          </svg>
          Simular Redução
        </a>
      </div>
    </section>
  );
}
