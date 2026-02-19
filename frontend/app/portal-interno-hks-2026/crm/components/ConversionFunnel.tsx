'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const sampleData = [
  { stage: 'Novo Lead', deals: 150, color: '#94a3b8' },
  { stage: 'Qualificação', deals: 89, color: '#60a5fa' },
  { stage: 'Proposta', deals: 45, color: '#a78bfa' },
  { stage: 'Negociação', deals: 28, color: '#D4AF37' },
  { stage: 'Fechado', deals: 18, color: '#34d399' },
];

interface ConversionFunnelProps {
  data?: { stage: string; deals: number; color: string }[];
}

export default function ConversionFunnel({ data = sampleData }: ConversionFunnelProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          stroke="rgba(255,255,255,0.3)"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
        />
        <YAxis
          dataKey="stage"
          type="category"
          width={100}
          stroke="rgba(255,255,255,0.3)"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: 12,
          }}
          formatter={(value) => [`${value} oportunidades`, 'Quantidade']}
          labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
        />
        <Bar dataKey="deals" radius={[0, 6, 6, 0]} barSize={24}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
