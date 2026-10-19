import {
  ReportCompany,
  DarfDocument,
  ReconciliationRow,
  AuditorConfig,
  DivergenceStatus,
} from '../types';
import { cleanCnpj } from './constants';

export const DEFAULT_CONFIG: AuditorConfig = {
  toleranceCentavos: 1.0, // Tolerância padrão de R$ 1,00
  retentionCodes: ['5952', '1708', '1162', '5987', '5960', '5979'],
  strictPeriodCheck: true,
};

export function reconcileReportsAndDarfs(
  reports: ReportCompany[],
  darfs: DarfDocument[],
  config: AuditorConfig = DEFAULT_CONFIG
): ReconciliationRow[] {
  const darfMap = new Map<string, DarfDocument>();
  const matchedDarfKeys = new Set<string>();

  // Index DARFs by clean CNPJ
  for (const darf of darfs) {
    const key = cleanCnpj(darf.cnpj);
    if (key) {
      darfMap.set(key, darf);
    }
  }

  const rows: ReconciliationRow[] = [];

  // 1. Process all report companies
  for (const rep of reports) {
    const key = cleanCnpj(rep.cnpj);
    const darf = key ? darfMap.get(key) : undefined;
    if (key && darf) {
      matchedDarfKeys.add(key);
    }

    if (!darf) {
      // Report company without DARF
      rows.push({
        id: `row_nodarf_${rep.id}`,
        cnpj: rep.cnpj,
        rawCnpj: rep.rawCnpj,
        companyName: rep.companyName,
        empresaCode: rep.empresaCode,
        report: rep,
        darf: undefined,
        totalReferenciaRelatorio: rep.totalReferencia,
        totalGeralDarf: 0,
        totalRetencoesExcluidas: 0,
        retencoesDetalhes: [],
        totalDarfAjustado: 0,
        diferenca: -rep.totalReferencia,
        status: 'sem_darf',
        statusLabel: 'Pendente de DARF',
        hasRetention: false,
        periodoMismatch: false,
        periodoRelatorio: rep.periodo,
        discrepancyNote: 'Guia DARF correspondente ainda não foi enviada para conferência.',
      });
      continue;
    }

    // Both report and DARF exist!
    const totalReferenciaRelatorio = rep.totalReferencia;
    const totalGeralDarf = darf.totalDocumento;
    const totalRetencoesExcluidas = darf.totalRetencoes;
    const totalDarfAjustado = darf.totalAjustado;
    const diferenca = Number(
      (totalDarfAjustado - totalReferenciaRelatorio).toFixed(2)
    );

    // Period check
    const periodoMismatch = Boolean(
      rep.normalizedPeriodo &&
      darf.normalizedPeriodo &&
      rep.normalizedPeriodo !== darf.normalizedPeriodo
    );

    // Status determine
    let status: DivergenceStatus = 'conferido';
    let statusLabel = 'Conferido com Sucesso';
    let discrepancyNote: string | undefined = undefined;

    if (periodoMismatch && config.strictPeriodCheck) {
      status = 'periodo_divergente';
      statusLabel = 'Período Divergente';
      discrepancyNote = `O relatório é de ${rep.periodo || rep.normalizedPeriodo}, mas o DARF é de ${darf.periodoApuracao || darf.normalizedPeriodo}.`;
    } else if (Math.abs(diferenca) <= config.toleranceCentavos) {
      status = 'conferido';
      statusLabel =
        Math.abs(diferenca) === 0
          ? 'Conferido Exato (R$ 0,00)'
          : `Conferido (Dif. ${diferenca > 0 ? '+' : ''}R$ ${Math.abs(diferenca).toFixed(2)} dentro da tolerância)`;
    } else {
      status = 'divergente';
      statusLabel = `Divergência: ${diferenca > 0 ? '+' : ''}R$ ${Math.abs(diferenca).toFixed(2)}`;
      if (diferenca > 0) {
        discrepancyNote = `DARF ajustado maior que o relatório em R$ ${diferenca.toFixed(2)}. Verificar deduções FPAS ou outros tributos.`;
      } else {
        discrepancyNote = `DARF ajustado menor que o relatório em R$ ${Math.abs(diferenca).toFixed(2)}. Verificar retenção não descontada ou guia incompleta.`;
      }
    }

    rows.push({
      id: `row_${key}_${rep.id}`,
      cnpj: rep.cnpj,
      rawCnpj: rep.rawCnpj,
      companyName: rep.companyName || darf.razaoSocial,
      empresaCode: rep.empresaCode,
      report: rep,
      darf,
      totalReferenciaRelatorio,
      totalGeralDarf,
      totalRetencoesExcluidas,
      retencoesDetalhes: darf.retencoesExcluidas,
      totalDarfAjustado,
      diferenca,
      status,
      statusLabel,
      hasRetention: darf.retencoesExcluidas.length > 0,
      periodoMismatch,
      periodoRelatorio: rep.periodo,
      periodoDarf: darf.periodoApuracao,
      discrepancyNote,
    });
  }

  // 2. DARFs that had no matching report company:
  // Condomínios que não constam no relatório não possuem folha de pagamento (contratação terceirizada).
  // Retirados de divergências conforme regra solicitada.
  for (const darf of darfs) {
    const key = cleanCnpj(darf.cnpj);
    if (!matchedDarfKeys.has(key)) {
      rows.push({
        id: `row_norep_${darf.id}`,
        cnpj: darf.cnpj,
        rawCnpj: darf.rawCnpj,
        companyName: darf.razaoSocial,
        report: undefined,
        darf,
        totalReferenciaRelatorio: 0,
        totalGeralDarf: darf.totalDocumento,
        totalRetencoesExcluidas: darf.totalRetencoes,
        retencoesDetalhes: darf.retencoesExcluidas,
        totalDarfAjustado: darf.totalAjustado,
        diferenca: 0,
        status: 'terceirizado_sem_folha',
        statusLabel: 'Terceirizado (Sem Folha)',
        hasRetention: darf.retencoesExcluidas.length > 0,
        periodoMismatch: false,
        periodoDarf: darf.periodoApuracao,
        discrepancyNote: 'Condomínio com contratação terceirizada (sem folha de pagamento no relatório). Não constitui divergência.',
      });
    }
  }

  return rows;
}
