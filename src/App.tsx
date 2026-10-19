import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { BatchProgressBar } from './components/BatchProgressBar';
import { PeriodComparatorBanner } from './components/PeriodComparatorBanner';
import { KpiSummary } from './components/KpiSummary';
import { DivergenceTable } from './components/DivergenceTable';
import { CompanyDetailModal } from './components/CompanyDetailModal';
import { RetentionRulesModal } from './components/RetentionRulesModal';
import { ConfigModal } from './components/ConfigModal';
import {
  ReportCompany,
  DarfDocument,
  ReconciliationRow,
  BatchProgress,
  ProcessedNotification,
  AuditorConfig,
} from './types';
import { reconcileReportsAndDarfs, DEFAULT_CONFIG } from './utils/reconciliation';
import { parseTaxSummaryPdf, parseDarfPdf } from './utils/pdfParser';
import { exportToExcel, exportToPdf } from './utils/exporter';

export default function App() {
  // Empty initial states - no mock data!
  const [reports, setReports] = useState<ReportCompany[]>([]);
  const [darfs, setDarfs] = useState<DarfDocument[]>([]);
  const [config, setConfig] = useState<AuditorConfig>(DEFAULT_CONFIG);

  // Modals & UI Controls
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedRow, setSelectedRow] = useState<ReconciliationRow | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Processing & Notifications
  const [progress, setProgress] = useState<BatchProgress>({
    isProcessing: false,
    total: 0,
    current: 0,
    currentFileName: '',
    percentage: 0,
    statusText: '',
  });

  const [notifications, setNotifications] = useState<ProcessedNotification[]>([]);

  // Run reconciliation engine
  const rows = useMemo(() => {
    return reconcileReportsAndDarfs(reports, darfs, config);
  }, [reports, darfs, config]);

  // Aggregate stats
  const kpiStats = useMemo(() => {
    const totalEmpresas = rows.length;
    const conferidosCount = rows.filter((r) => r.status === 'conferido').length;
    const divergentesCount = rows.filter((r) => r.status === 'divergente').length;
    const retencoesTotalValor = rows.reduce(
      (acc, r) => acc + r.totalRetencoesExcluidas,
      0
    );
    const semDarfCount = rows.filter((r) => r.status === 'sem_darf').length;

    return {
      totalEmpresas,
      conferidosCount,
      divergentesCount,
      retencoesTotalValor,
      semDarfCount,
    };
  }, [rows]);

  // Period analysis for the PeriodComparatorBanner
  const periodData = useMemo(() => {
    const repPeriod = reports[0]?.periodo;

    const countByPeriod = new Map<string, { count: number; normalized: string }>();
    for (const d of darfs) {
      const p = d.periodoApuracao || 'Não identificado';
      const existing = countByPeriod.get(p) || { count: 0, normalized: d.normalizedPeriodo };
      existing.count += 1;
      countByPeriod.set(p, existing);
    }

    const darfPeriods = Array.from(countByPeriod.entries()).map(([period, data]) => ({
      period,
      count: data.count,
      normalized: data.normalized,
    }));

    const mismatchCount = rows.filter((r) => r.periodoMismatch).length;

    return {
      reportPeriod: repPeriod,
      darfPeriods,
      mismatchCount,
    };
  }, [reports, darfs, rows]);

  // Batch Processor for Real Uploaded PDFs
  const handleProcessFiles = async (
    reportFile: File | null,
    darfFiles: File[]
  ) => {
    const totalSteps = (reportFile ? 1 : 0) + darfFiles.length;
    let completedSteps = 0;

    setProgress({
      isProcessing: true,
      total: totalSteps,
      current: 0,
      currentFileName: 'Iniciando extração...',
      percentage: 0,
      statusText: 'Iniciando leitura dos documentos...',
    });

    const newNotifications: ProcessedNotification[] = [];

    try {
      // 1. Process Report PDF if provided
      if (reportFile) {
        setProgress({
          isProcessing: true,
          total: totalSteps,
          current: 0,
          currentFileName: reportFile.name,
          percentage: Math.round((completedSteps / totalSteps) * 100),
          statusText: `Lendo páginas do relatório: ${reportFile.name}`,
        });

        const parsedCompanies = await parseTaxSummaryPdf(
          reportFile,
          (page, totalPages) => {
            setProgress((prev) => ({
              ...prev,
              statusText: `Processando página ${page} de ${totalPages}...`,
            }));
          }
        );

        if (parsedCompanies.length > 0) {
          setReports(parsedCompanies);

          newNotifications.push({
            id: `notif_rep_${Date.now()}`,
            filename: reportFile.name,
            type: 'relatorio',
            title: `Relatório Fiscal: ${parsedCompanies.length} empresas identificadas`,
            subtitle: `Período: ${parsedCompanies[0]?.periodo || 'N/A'}`,
            status: 'success',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          });
        } else {
          newNotifications.push({
            id: `notif_rep_err_${Date.now()}`,
            filename: reportFile.name,
            type: 'relatorio',
            title: 'Nenhuma empresa localizada no relatório',
            subtitle: 'Verifique se o PDF selecionado é um Resumo de Impostos padrão.',
            status: 'warning',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          });
        }

        completedSteps += 1;
        setProgress((prev) => ({
          ...prev,
          current: completedSteps,
          percentage: Math.round((completedSteps / totalSteps) * 100),
        }));
      }

      // 2. Process DARFs in batch (handles 100+ seamlessly)
      if (darfFiles.length > 0) {
        const parsedDarfsBatch: DarfDocument[] = [];

        for (let i = 0; i < darfFiles.length; i++) {
          const file = darfFiles[i];

          setProgress({
            isProcessing: true,
            total: totalSteps,
            current: completedSteps + 1,
            currentFileName: file.name,
            percentage: Math.round(((completedSteps + 1) / totalSteps) * 100),
            statusText: `Lendo guia ${i + 1} de ${darfFiles.length}...`,
          });

          try {
            const parsedDarf = await parseDarfPdf(file, config.retentionCodes);
            parsedDarfsBatch.push(parsedDarf);

            newNotifications.push({
              id: `notif_darf_${i}_${Date.now()}`,
              filename: file.name,
              type: 'darf',
              title: `${parsedDarf.razaoSocial || file.name}`,
              subtitle: `CNPJ ${parsedDarf.cnpj} · R$ ${parsedDarf.totalDocumento.toFixed(2)}`,
              status: 'success',
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            });
          } catch (fileErr) {
            newNotifications.push({
              id: `notif_darf_err_${i}_${Date.now()}`,
              filename: file.name,
              type: 'darf',
              title: `Erro ao processar: ${file.name}`,
              subtitle: 'Não foi possível ler os campos da guia.',
              status: 'error',
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            });
          }

          completedSteps += 1;
          if (i % 5 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        setDarfs((prev) => {
          const incomingCnpjs = new Set(parsedDarfsBatch.map((d) => d.rawCnpj));
          const remainingPrev = prev.filter((d) => !incomingCnpjs.has(d.rawCnpj));
          return [...parsedDarfsBatch, ...remainingPrev];
        });
      }

      setNotifications((prev) => [...prev, ...newNotifications]);
    } catch (err) {
      console.error('Error processing files:', err);
    } finally {
      setProgress({
        isProcessing: false,
        total: totalSteps,
        current: totalSteps,
        currentFileName: '',
        percentage: 100,
        statusText: 'Processamento concluído.',
      });
    }
  };

  const handleResetData = () => {
    setReports([]);
    setDarfs([]);
    setNotifications([]);
  };

  const handleExportExcel = () => {
    const periodLabel = reports[0]?.periodo || 'Periodo_Fiscal';
    exportToExcel(rows, periodLabel);
  };

  const handleExportPdf = () => {
    const periodLabel = reports[0]?.periodo || 'Periodo_Fiscal';
    exportToPdf(rows, periodLabel);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Header
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        hasData={rows.length > 0}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Upload Dropzones */}
        <UploadSection
          onProcessFiles={handleProcessFiles}
          isProcessing={progress.isProcessing}
          hasLoadedData={rows.length > 0}
          reportLoadedCount={reports.length}
          darfsLoadedCount={darfs.length}
          onReset={handleResetData}
        />

        {/* Progress & Processing Notification */}
        <BatchProgressBar
          progress={progress}
          notifications={notifications}
          onDismissNotification={(id) =>
            setNotifications((prev) => prev.filter((n) => n.id !== id))
          }
          onClearAllNotifications={() => setNotifications([])}
        />

        {/* Period Comparator Banner (only if files are loaded) */}
        <PeriodComparatorBanner
          reportPeriod={periodData.reportPeriod}
          darfPeriods={periodData.darfPeriods}
          mismatchCount={periodData.mismatchCount}
          onFilterPeriodMismatch={() => setActiveFilter('periodo')}
        />

        {/* KPI Summaries (only if rows exist) */}
        <KpiSummary
          totalEmpresas={kpiStats.totalEmpresas}
          conferidosCount={kpiStats.conferidosCount}
          divergentesCount={kpiStats.divergentesCount}
          retencoesTotalValor={kpiStats.retencoesTotalValor}
          semDarfCount={kpiStats.semDarfCount}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* Divergence & Reconciliation Table */}
        <DivergenceTable
          rows={rows}
          onSelectRow={setSelectedRow}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span>Auditor DARF & Resumo Fiscal</span>
          <span>Regra: [INSS Líquido + IR + PIS] vs [DARF sem retenções NF]</span>
        </div>
      </footer>

      {/* Modals */}
      <CompanyDetailModal
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />

      <RetentionRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={setConfig}
      />
    </div>
  );
}
