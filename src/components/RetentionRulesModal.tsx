import React from 'react';
import { X, BookOpen, Check, ShieldAlert } from 'lucide-react';
import { RETENTION_CODES } from '../utils/constants';

interface RetentionRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RetentionRulesModal: React.FC<RetentionRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Regras de Conciliação e Retenções Excluídas
              </h2>
              <p className="text-xs text-slate-500">
                Critérios técnicos aplicados na auditoria automática de tributos
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
            <h3 className="font-bold text-indigo-950 text-sm">
              Fórmula de Cálculo do Valor de Referência (Relatório)
            </h3>
            <p className="text-indigo-900">
              Obtido diretamente da planilha consolidada ou folha de resumo de impostos através da soma:
            </p>
            <div className="p-2.5 bg-white border border-indigo-200 rounded-lg font-mono text-xs font-semibold text-indigo-900 text-center">
              Total Referência = INSS Total Líquido + IR Total a Recolher + Valor do PIS (Outros)
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Por que excluir as Retenções de Notas Fiscais do DARF?</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              O total da guia DARF gerada na DCTFWeb pode englobar retenções sofridas sobre notas fiscais de terceiros contratados pelo condomínio/empresa (serviços de portaria, limpeza, vigilância, manutenção). Como essas retenções não integram o custo da folha de pagamento do resumo de impostos, elas devem ser <strong className="text-slate-900">obrigatoriamente deduzidas do DARF</strong> antes do confronto.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Códigos de Retenção Desconsiderados Automaticamente:
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição / Tributo</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(RETENTION_CODES).map(([code, desc]) => (
                    <tr key={code} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                        {code}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{desc}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" /> Excluído
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 bg-slate-100 rounded-xl space-y-1">
            <span className="font-bold text-slate-800">
              Observação sobre Desmembramento do Código 5952:
            </span>
            <p className="text-slate-600 leading-relaxed">
              O código consolidado <strong>5952</strong> refere-se a PIS, Cofins e CSLL unificados. Quando o contribuinte ou órgão realiza apurações separadas, os códigos derivados <strong>5987</strong> (CSLL), <strong>5960</strong> (Cofins) e <strong>5979</strong> (Pis/Pasep) também são identificados e desconsiderados com precisão cirúrgica.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
