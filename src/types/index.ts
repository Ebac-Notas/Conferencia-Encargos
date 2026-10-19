export interface DarfItem {
  codigo: string;
  denominacao: string;
  principal: number;
  multa: number;
  juros: number;
  total: number;
  isRetention: boolean;
  retentionReason?: string;
}

export interface DarfDocument {
  id: string;
  filename: string;
  cnpj: string;
  rawCnpj: string;
  razaoSocial: string;
  periodoApuracao: string;
  normalizedPeriodo: string; // e.g. "2026-09"
  dataVencimento: string;
  numeroDocumento: string;
  numeroRecibo?: string;
  totalDocumento: number;
  items: DarfItem[];
  retencoesExcluidas: DarfItem[];
  totalRetencoes: number;
  totalAjustado: number; // totalDocumento - totalRetencoes
}

export interface ReportCompany {
  id: string;
  pageNumber: number;
  empresaCode: string;
  estabelecimentoCode: string;
  companyName: string;
  cnpj: string;
  rawCnpj: string;
  periodo: string;
  normalizedPeriodo: string; // e.g. "2026-09"
  // Breakdown
  inssTotalLiquido: number;
  irTotalRecolher: number;
  pisValor: number;
  // FGTS (informational only)
  fgtsTotal?: number;
  // Calculated Reference Total: INSS Total Líquido + IR Total a Recolher + PIS
  totalReferencia: number;
}

export type DivergenceStatus =
  | 'conferido'
  | 'divergente'
  | 'sem_darf'
  | 'sem_relatorio'
  | 'terceirizado_sem_folha'
  | 'periodo_divergente';

export interface ReconciliationRow {
  id: string;
  cnpj: string;
  rawCnpj: string;
  companyName: string;
  empresaCode?: string;
  
  // Data sources
  report?: ReportCompany;
  darf?: DarfDocument;
  
  // Computed values
  totalReferenciaRelatorio: number;
  totalGeralDarf: number;
  totalRetencoesExcluidas: number;
  retencoesDetalhes: DarfItem[];
  totalDarfAjustado: number;
  diferenca: number; // totalDarfAjustado - totalReferenciaRelatorio
  
  // Status
  status: DivergenceStatus;
  statusLabel: string;
  hasRetention: boolean;
  periodoMismatch: boolean;
  periodoRelatorio?: string;
  periodoDarf?: string;
  discrepancyNote?: string;
}

export interface ProcessedNotification {
  id: string;
  filename: string;
  type: 'relatorio' | 'darf';
  title: string;
  subtitle: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface BatchProgress {
  isProcessing: boolean;
  total: number;
  current: number;
  currentFileName: string;
  percentage: number;
  statusText: string;
}

export interface AuditorConfig {
  toleranceCentavos: number; // default 0.05
  retentionCodes: string[]; // default ['5952', '1708', '1162', '5987', '5960', '5979']
  strictPeriodCheck: boolean; // default true
}
