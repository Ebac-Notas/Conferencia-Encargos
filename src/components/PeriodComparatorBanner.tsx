import React from 'react';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatPeriodReadable } from '../utils/constants';

interface PeriodComparatorBannerProps {
  reportPeriod?: string;
  darfPeriods: Array<{ period: string; count: number; normalized: string }>;
  onFilterPeriodMismatch?: () => void;
  mismatchCount: number;
}

export const PeriodComparatorBanner: React.FC<PeriodComparatorBannerProps> = ({
  reportPeriod,
  darfPeriods,
  onFilterPeriodMismatch,
  mismatchCount,
}) => {
  if (!reportPeriod && darfPeriods.length === 0) return null;

  const hasMismatch = mismatchCount > 0;

  return (
    <div
      className={`rounded-xl border p-3.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        hasMismatch
          ? 'bg-amber-50/60 border-amber-200 text-amber-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {hasMismatch ? (
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <div>
          <span className="font-semibold">
            {hasMismatch ? 'Atenção ao Período: ' : 'Período de Apuração: '}
          </span>
          <span>
            Relatório ({reportPeriod ? formatPeriodReadable(reportPeriod) : 'N/A'})
            {' · '}
            DARFs (
            {darfPeriods.map((p) => `${formatPeriodReadable(p.period)}: ${p.count}`).join(', ') || 'Nenhum'}
            )
          </span>
          {hasMismatch && (
            <span className="block sm:inline sm:ml-2 font-medium text-amber-900">
              ({mismatchCount} {mismatchCount === 1 ? 'guia divergente' : 'guias divergentes'})
            </span>
          )}
        </div>
      </div>

      {hasMismatch && onFilterPeriodMismatch && (
        <button
          onClick={onFilterPeriodMismatch}
          className="self-start sm:self-auto px-2.5 py-1 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
        >
          Filtrar Incompatíveis
        </button>
      )}
    </div>
  );
};
