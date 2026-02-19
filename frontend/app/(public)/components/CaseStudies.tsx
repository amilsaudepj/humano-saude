'use client';

import Image from 'next/image';

export default function CaseStudies() {
  const cases = [
    {
      perfil: 'Plano Empresarial',
      vidas: '4 vidas',
      fromName: 'Unimed',
      fromLogo: '/images/operadoras/unimed-logo.png',
      toName: 'Assim Saúde',
      toLogo: '/images/operadoras/assimsaude-logo.png',
      custoAnterior: 'R$ 3.780,00',
      novoCusto: 'R$ 2.960,00',
      reducao: '22% de redução',
      economia: 'R$ 820,00/mês',
      extra: 'Migração sem novas carências',
    },
    {
      perfil: 'Plano PME',
      vidas: '7 vidas',
      fromName: 'Porto Saúde',
      fromLogo: '/images/operadoras/portosaude-logo.png',
      toName: 'SulAmérica',
      toLogo: '/images/operadoras/sulamerica-logo.png',
      custoAnterior: 'R$ 6.230,00',
      novoCusto: 'R$ 4.970,00',
      reducao: '20% de redução',
      economia: 'R$ 1.260,00/mês',
      extra: 'Upgrade de rede com melhor custo final',
    },
    {
      perfil: 'Plano Empresarial',
      vidas: '18 vidas',
      fromName: 'Amil',
      fromLogo: '/images/operadoras/amil-logo.png',
      toName: 'Bradesco Saúde',
      toLogo: '/images/operadoras/bradesco-logo.png',
      custoAnterior: 'R$ 14.040,00',
      novoCusto: 'R$ 8.424,00',
      reducao: '40% de redução',
      economia: 'R$ 5.616,00/mês',
      extra: 'Rede hospitalar equivalente mantida',
    },
  ];

  return (
    <section id="pratica" className="bg-white py-20 text-center sm:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <span className="mb-5 inline-block rounded-full border border-[#B8941F]/25 bg-[#B8941F]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[2.8px] text-[#8E6B14]">
          Prova de resultado
        </span>
        <h2 className="mb-4 text-4xl font-black leading-[1.08] text-[#121212] md:text-5xl">
          Análise <span className="text-[#B8941F]">na prática</span>
        </h2>
        <p className="mx-auto mb-14 max-w-3xl text-sm font-medium uppercase tracking-[2.3px] text-[#646464] sm:text-base">
          migrações reais entre operadoras com economia recorrente e segurança de cobertura
        </p>

        <div className="mb-14 grid gap-6 text-left md:grid-cols-3">
          {cases.map((item) => (
            <article
              key={`${item.fromName}-${item.toName}-${item.vidas}`}
              className="group flex h-full flex-col rounded-3xl border border-[#E9E9E9] bg-white p-6 shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#B8941F]/45 hover:shadow-[0_18px_34px_rgba(98,76,18,0.18)] sm:p-7"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[2.8px] text-[#5E5E5E]">
                  {item.perfil}
                </p>
                <p className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] text-[#4d4d4d]">
                  {item.vidas}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="rounded-xl border border-[#E9E9E9] bg-white px-3 py-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#707070]">De</p>
                  <div className="flex h-12 items-center justify-center">
                    <Image
                      src={item.fromLogo}
                      alt={item.fromName}
                      width={item.fromName === 'Porto Saúde' || item.fromName === 'Unimed' ? 180 : 110}
                      height={36}
                      className={`${item.fromName === 'Porto Saúde' || item.fromName === 'Unimed' ? 'h-12' : 'h-9'} w-auto object-contain`}
                    />
                  </div>
                </div>

                <div className="rounded-full border border-[#B8941F]/20 bg-[#B8941F]/10 p-2 text-[#8A6812]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>

                <div className="rounded-xl border border-[#DCCB9A]/45 bg-[#FBF7EC] px-3 py-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#876512]">Para</p>
                  <div className="flex h-12 items-center justify-center">
                    <Image
                      src={item.toLogo}
                      alt={item.toName}
                      width={120}
                      height={36}
                      className="h-9 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#555]">{item.fromName}</p>
                <span className="rounded-full border border-[#B8941F]/30 bg-[#B8941F]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[2px] text-[#8C6913]">
                  {item.reducao}
                </span>
                <p className="text-right text-xs font-semibold text-[#7A5D14]">{item.toName}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#707070]">Antes</p>
                  <p className="mt-1 whitespace-nowrap text-lg font-bold tracking-tight text-[#7A7A7A] line-through sm:text-xl">
                    {item.custoAnterior}
                  </p>
                </div>
                <div className="rounded-xl border border-[#B8941F]/30 bg-[#B8941F]/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#876512]">Depois</p>
                  <p className="mt-1 whitespace-nowrap text-lg font-black tracking-tight text-[#785B13] sm:text-xl">
                    {item.novoCusto}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[#B8941F]/30 bg-[#B8941F]/8 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#876512]">Economia estimada</p>
                <p className="mt-1 whitespace-nowrap text-lg font-black text-[#7A5D14]">{item.economia}</p>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[2px] text-[#4D4D4D]">
                {item.extra}
              </p>

              <div className="mt-4 h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-[#B8941F]/70 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
            </article>
          ))}
        </div>

        <a
          href="#calculadora"
          className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl bg-[#B8941F] px-8 py-4 text-xs font-black uppercase tracking-[2.3px] text-white transition-all hover:-translate-y-0.5 hover:bg-[#A07E18] hover:shadow-lg hover:shadow-[#B8941F]/30 sm:px-11 sm:text-sm"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-6.75h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          Simular minha redução
        </a>
      </div>
    </section>
  );
}
