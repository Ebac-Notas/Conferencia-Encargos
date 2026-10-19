import React, { useRef, useState } from 'react';
import {
  FileText,
  Files,
  Upload,
  CheckCircle2,
  RefreshCw,
  X,
  Play,
} from 'lucide-react';

interface UploadSectionProps {
  onProcessFiles: (reportFile: File | null, darfFiles: File[]) => void;
  isProcessing: boolean;
  hasLoadedData: boolean;
  reportLoadedCount: number;
  darfsLoadedCount: number;
  onReset: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onProcessFiles,
  isProcessing,
  hasLoadedData,
  reportLoadedCount,
  darfsLoadedCount,
  onReset,
}) => {
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [darfFiles, setDarfFiles] = useState<File[]>([]);
  const [isDraggingReport, setIsDraggingReport] = useState(false);
  const [isDraggingDarfs, setIsDraggingDarfs] = useState(false);

  const reportInputRef = useRef<HTMLInputElement>(null);
  const darfInputRef = useRef<HTMLInputElement>(null);

  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleDarfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files).filter((f) =>
        f.name.toLowerCase().endsWith('.pdf')
      );
      setDarfFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const filteredNew = incoming.filter((f) => !existingNames.has(f.name));
        return [...prev, ...filteredNew];
      });
    }
  };

  const handleClearAll = () => {
    setReportFile(null);
    setDarfFiles([]);
    if (reportInputRef.current) reportInputRef.current.value = '';
    if (darfInputRef.current) darfInputRef.current.value = '';
    onReset();
  };

  const handleExecute = () => {
    if (!reportFile && darfFiles.length === 0) return;
    onProcessFiles(reportFile, darfFiles);
  };

  const canProcess = Boolean(reportFile || darfFiles.length > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      {/* Top title and actions */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Importação de Documentos Fiscais
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Faça o upload do relatório e das guias DARF para confrontar os valores automaticamente.
          </p>
        </div>

        {(reportFile || darfFiles.length > 0 || hasLoadedData) && (
          <button
            onClick={handleClearAll}
            disabled={isProcessing}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpar Arquivos</span>
          </button>
        )}
      </div>

      {/* Upload Dropzones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Dropzone 1: Report PDF */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingReport(true);
          }}
          onDragLeave={() => setIsDraggingReport(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingReport(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              if (file.name.toLowerCase().endsWith('.pdf')) {
                setReportFile(file);
              }
            }
          }}
          onClick={() => reportInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDraggingReport
              ? 'border-slate-800 bg-slate-50'
              : reportFile
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={reportInputRef}
            onChange={handleReportChange}
            accept=".pdf"
            className="hidden"
          />

          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 ${
              reportFile
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {reportFile ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
          </div>

          <span className="text-xs font-semibold text-slate-800">
            Relatório Resumo de Impostos (PDF Único)
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            {reportFile
              ? reportFile.name
              : reportLoadedCount > 0
              ? `${reportLoadedCount} empresas carregadas no relatório`
              : 'Arraste o arquivo ou clique para selecionar'}
          </span>

          {reportFile && (
            <div className="mt-2 text-[11px] font-mono text-emerald-700 flex items-center gap-1">
              <span>Pronto para processamento ({(reportFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* Dropzone 2: DARFs PDFs (Batch) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingDarfs(true);
          }}
          onDragLeave={() => setIsDraggingDarfs(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingDarfs(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const incoming = Array.from(e.dataTransfer.files).filter((f) =>
                f.name.toLowerCase().endsWith('.pdf')
              );
              setDarfFiles((prev) => {
                const existingNames = new Set(prev.map((f) => f.name));
                const filteredNew = incoming.filter((f) => !existingNames.has(f.name));
                return [...prev, ...filteredNew];
              });
            }
          }}
          onClick={() => darfInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            isDraggingDarfs
              ? 'border-slate-800 bg-slate-50'
              : darfFiles.length > 0
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={darfInputRef}
            onChange={handleDarfChange}
            accept=".pdf"
            multiple
            className="hidden"
          />

          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 ${
              darfFiles.length > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {darfFiles.length > 0 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Files className="w-5 h-5" />
            )}
          </div>

          <span className="text-xs font-semibold text-slate-800">
            Guias DARF (Múltiplos PDFs)
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            {darfFiles.length > 0
              ? `${darfFiles.length} guias selecionadas para leitura`
              : darfsLoadedCount > 0
              ? `${darfsLoadedCount} guias carregadas`
              : 'Selecione ou solte 100+ guias simultâneas'}
          </span>

          {darfFiles.length > 0 && (
            <div className="mt-2 text-[11px] font-mono text-emerald-700">
              Total: {(darfFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
      </div>

      {/* Action button bar */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Códigos de retenção de notas desconsiderados: 5952, 1708, 1162, 5987, 5960, 5979
        </span>

        <button
          onClick={handleExecute}
          disabled={!canProcess || isProcessing}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            canProcess && !isProcessing
              ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-xs'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Processando...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Processar Arquivos</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
