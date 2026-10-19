import React from 'react';
import { formatCurrency } from '../utils/constants';

interface KpiSummaryProps {
  totalEmpresas: number;
  conferidosCount: number;
  divergentesCount: number;
  retencoesTotalValor: number;
  semDarfCount: number;
  onSelectFilter: (filter: string) => void;
  activeFilter: string;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({
  totalEmpresas,
  conferidosCount,
  divergentesCount,
  retencoesTotalValor,
  semDarfCount,
  onSelectFilter,
  activeFilter,
}) => {
  if (totalEmpresas === 0) return null;

  const items = [
    {
      id: 'todos',
      label: 'Total Analisado',
      value: totalEmpresas.toString(),
      subtext: 'Registros na lista',
    },
    {
      id: 'conferidos',
      label: 'Conferidos (OK)',
      value: conferidosCount.toString(),
      subtext: `${totalEmpresas > 0 ? ((conferidosCount / totalEmpresas) * 100).toFixed(0) : 0}% conformes`,
      highlight: 'text-emerald-700',
    },
    {
      id: 'divergentes',
      label: 'Divergências',
      value: divergentesCount.toString(),
      subtext: 'Valores discrepantes',
      highlight: divergentesCount > 0 ? 'text-rose-600 font-bold' : '',
    },
    {
      id: 'retencoes',
      label: 'Retenções NF Excluídas',
      value: formatCurrency(retencoesTotalValor),
      subtext: '5952, 1708, etc.',
      highlight: 'text-amber-700',
    },
    {
      id: 'pendentes',
      label: 'Pendentes de DARF',
      value: semDarfCount.toString(),
      subtext: 'Sem guia anexada',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((item) => {
        const isSelected = activeFilter === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectFilter(item.id)}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider block ${
                isSelected ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
            <span
              className={`text-xl font-bold font-mono tabular-nums block mt-1 ${
                isSelected ? 'text-white' : item.highlight || 'text-slate-900'
              }`}
            >
              {item.value}
            </span>
            <span
              className={`text-[11px] block mt-0.5 ${
                isSelected ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {item.subtext}
            </span>
          </button>
        );
      })}
    </div>
  );
};
