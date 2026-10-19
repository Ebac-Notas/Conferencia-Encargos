import React, { useState } from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { AuditorConfig } from '../types';
import { RETENTION_CODES } from '../utils/constants';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AuditorConfig;
  onSaveConfig: (newConfig: AuditorConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [tolerance, setTolerance] = useState<number>(config.toleranceCentavos);
  const [strictPeriod, setStrictPeriod] = useState<boolean>(config.strictPeriodCheck);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(config.retentionCodes);

  if (!isOpen) return null;

  const handleToggleCode = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      toleranceCentavos: tolerance,
      strictPeriodCheck: strictPeriod,
      retentionCodes: selectedCodes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Configurações da Auditoria
              </h2>
              <p className="text-xs text-slate-500">
                Parâmetros de tolerância matemática e validação de período
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Tolerance */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 text-sm block">
              Tolerância de Arredondamento (Centavos)
            </label>
            <p className="text-slate-500 text-[11px]">
              Diferenças abaixo deste teto são consideradas como conformes (OK), comuns devido a arredondamentos fracionários na DCTFWeb.
            </p>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { val: 1.0, label: '± R$ 1,00 (Padrão)' },
                { val: 0.0, label: 'R$ 0,00 (Exato)' },
                { val: 0.05, label: '± R$ 0,05' },
                { val: 2.0, label: '± R$ 2,00' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setTolerance(opt.val)}
                  className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-colors cursor-pointer ${
                    tolerance === opt.val
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period Strict Check */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <label className="font-bold text-slate-900 text-xs block cursor-pointer">
                Exigir Mesmo Período de Apuração
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Alerta como divergência se o DARF for de mês/ano diferente do relatório.
              </p>
            </div>
            <input
              type="checkbox"
              checked={strictPeriod}
              onChange={(e) => setStrictPeriod(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Retention Codes Active */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 text-sm block">
              Códigos de Retenção a Desconsiderar no DARF
            </label>
            <p className="text-slate-500 text-[11px]">
              Selecione quais códigos de retenção de notas fiscais devem ser subtraídos do total do DARF:
            </p>

            <div className="space-y-1.5 pt-1">
              {Object.entries(RETENTION_CODES).map(([code, desc]) => {
                const isSelected = selectedCodes.includes(code);
                return (
                  <div
                    key={code}
                    onClick={() => handleToggleCode(code)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">
                        {code}
                      </span>
                      <span className="text-[11px] font-medium">{desc}</span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Salvar e Reaplicar Regras
          </button>
        </div>
      </div>
    </div>
  );
};
