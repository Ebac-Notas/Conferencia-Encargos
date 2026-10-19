import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

interface HeaderProps {
  onExportExcel: () => void;
  onExportPdf: () => void;
  onOpenRules: () => void;
  onOpenConfig: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onExportExcel,
  onExportPdf,
  onOpenRules,
  onOpenConfig,
  hasData,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                Auditor DARF & Resumo Fiscal
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">
                Conferência de Tributos
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRules}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Regras de Cálculo</span>
            </button>

            <button
              onClick={onOpenConfig}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Configurações e Tolerância"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              onClick={onExportExcel}
              disabled={!hasData}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                hasData
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 cursor-pointer'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              onClick={onExportPdf}
              disabled={!hasData}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                hasData
                  ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
