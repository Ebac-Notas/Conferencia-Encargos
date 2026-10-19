import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Receipt,
  Scale,
  Calendar,
  Building,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import { ReconciliationRow } from '../types';
import { formatCurrency, formatPeriodReadable } from '../utils/constants';

interface CompanyDetailModalProps {
  row: ReconciliationRow | null;
  onClose: () => void;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  row,
  onClose,
}) => {
  if (!row) return null;

  const isOk = row.status === 'conferido';
  const hasDivergence = row.status === 'divergente';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detalhamento da Conferência Fiscal
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${
                  isOk
                    ? 'bg-emerald-100 text-emerald-800'
                    : hasDivergence
                    ? 'bg-rose-100 text-rose-800'
                    : row.status === 'terceirizado_sem_folha'
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {row.statusLabel}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {row.companyName}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-mono flex-wrap">
              <span>CNPJ: {row.cnpj}</span>
              {row.empresaCode && <span>Empresa: {row.empresaCode}</span>}
              {row.report?.estabelecimentoCode && (
                <span>Estabelecimento: {row.report.estabelecimentoCode}</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Diagnostic Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isOk
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                : hasDivergence
                ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                : row.status === 'terceirizado_sem_folha'
                ? 'bg-slate-50 border-slate-200 text-slate-900'
                : 'bg-amber-50/50 border-amber-200 text-amber-950'
            }`}
          >
            {isOk ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : row.status === 'terceirizado_sem_folha' ? (
              <CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Parecer da Auditoria
              </h4>
              <p className="text-sm font-semibold mt-0.5">
                {row.discrepancyNote || 'Cálculos conferidos com sucesso sem pendências.'}
              </p>
              {row.periodoMismatch && (
                <p className="text-xs text-amber-800 mt-1">
                  Atenção ao período: Relatório é de {row.periodoRelatorio} e o DARF é de {row.periodoDarf}.
                </p>
              )}
            </div>
          </div>

          {/* Confrontation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Col 1: Relatório de Impostos */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-xs font-bold text-slate-800">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>1. Relatório de Resumo</span>
              </div>

              {row.report ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>(+) INSS Total Líquido:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(row.report.inssTotalLiquido)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>(+) IR Total a Recolher:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(row.report.irTotalRecolher)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>(+) Valor do PIS (Outros):</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(row.report.pisValor)}
                    </span>
                  </div>

                  {row.report.fgtsTotal !== undefined && (
                    <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1">
                      <span>(i) FGTS (Informativo):</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(row.report.fgtsTotal)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-900">
                    <span>(=) Total Referência:</span>
                    <span className="font-mono text-sm text-indigo-700">
                      {formatCurrency(row.totalReferenciaRelatorio)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Nenhuma página correspondente no resumo de impostos.
                </p>
              )}
            </div>

            {/* Col 2: Guia DARF (Receita Federal) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-xs font-bold text-slate-800">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>2. Guia DARF (DCTFWeb)</span>
              </div>

              {row.darf ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total Geral do DARF:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(row.totalGeralDarf)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-amber-800">
                    <span>(-) Retenções NF Excluídas:</span>
                    <span className="font-mono tabular-nums font-semibold text-amber-700">
                      -{formatCurrency(row.totalRetencoesExcluidas)}
                    </span>
                  </div>

                  {row.retencoesDetalhes.length > 0 && (
                    <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-md text-[11px] space-y-1">
                      {row.retencoesDetalhes.map((ret, i) => (
                        <div key={i} className="flex justify-between text-amber-900">
                          <span>
                            Cód. {ret.codigo} ({ret.denominacao.split('-')[0].trim()}):
                          </span>
                          <span className="font-mono font-medium">
                            {formatCurrency(ret.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-900">
                    <span>(=) DARF Ajustado:</span>
                    <span className="font-mono text-sm text-emerald-700">
                      {formatCurrency(row.totalDarfAjustado)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Guia DARF correspondente ainda não anexada.
                </p>
              )}
            </div>

            {/* Col 3: Resultado da Comparação */}
            <div
              className={`border rounded-xl p-4 ${
                isOk
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : hasDivergence
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-xs font-bold text-slate-800">
                <Scale className="w-4 h-4 text-slate-700" />
                <span>3. Confronto Final</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                    Fórmula de Conferência:
                  </span>
                  <span className="text-[11px] font-mono text-slate-700 block mt-0.5">
                    [DARF Ajustado] - [Ref. Relatório]
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Diferença:</span>
                    <span
                      className={`text-base font-bold font-mono tabular-nums ${
                        hasDivergence
                          ? 'text-rose-600'
                          : isOk
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {row.diferenca > 0 ? '+' : ''}
                      {formatCurrency(row.diferenca)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  {isOk ? (
                    <span className="text-emerald-700 font-medium">
                      Conferido com sucesso. Os valores coincidem com os tributos apurados na folha.
                    </span>
                  ) : hasDivergence ? (
                    <span className="text-rose-700 font-medium">
                      Discrepância detectada. Verifique os códigos detalhados abaixo na guia.
                    </span>
                  ) : (
                    <span>Aguardando todos os documentos para conclusão.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed DARF Lines if available */}
          {row.darf && row.darf.items.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-slate-600" />
                <span>Composição Detalhada da Guia DARF (Todos os Códigos)</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Denominação do Tributo</th>
                      <th className="py-2.5 px-3 text-right">Valor Total</th>
                      <th className="py-2.5 px-3 text-center">Tratamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {row.darf.items.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          item.isRetention
                            ? 'bg-amber-50/60 font-medium'
                            : 'hover:bg-slate-50/60'
                        }
                      >
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          {item.codigo}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {item.denominacao}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.isRetention ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/70 text-amber-900">
                              Excluído do Confronto (Retenção NF)
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Considerado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {row.darf?.numeroDocumento
              ? `Nº DARF: ${row.darf.numeroDocumento}`
              : 'Sem guia DARF registrada'}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Fechar Inspeção
          </button>
        </div>
      </div>
    </div>
  );
};
