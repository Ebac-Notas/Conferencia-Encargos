import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReconciliationRow } from '../types';
import { formatCurrency } from './constants';

export function exportToExcel(
  rows: ReconciliationRow[],
  periodoGeral: string = 'Setembro/2026'
): void {
  const wb = XLSX.utils.book_new();

  // Aba 1: "Divergências" (EM PRIMEIRO LUGAR conforme solicitação)
  // Contém estritamente: Nome do condomínio, CNPJ e Valor da diferença encontrada.
  // Condomínios não constantes no relatório (terceirizados sem folha) e conferidos são retirados daqui.
  const divergenciasRows = rows.filter((r) => r.status === 'divergente');
  const divergenciasData = divergenciasRows.map((r) => ({
    'Nome do Condomínio': r.companyName,
    'CNPJ': r.cnpj,
    'Valor da Diferença Encontrada (R$)': r.diferenca,
  }));

  const wsDivergencias = XLSX.utils.json_to_sheet(
    divergenciasData.length > 0
      ? divergenciasData
      : [
          {
            'Nome do Condomínio': 'Nenhuma divergência encontrada',
            'CNPJ': '-',
            'Valor da Diferença Encontrada (R$)': 0,
          },
        ]
  );
  wsDivergencias['!cols'] = [
    { wch: 45 }, // Nome do Condomínio
    { wch: 22 }, // CNPJ
    { wch: 32 }, // Valor da Diferença Encontrada (R$)
  ];
  XLSX.utils.book_append_sheet(wb, wsDivergencias, 'Divergências');

  // Aba 2: Conferência Completa
  const generalData = rows.map((r, idx) => ({
    'Nº': idx + 1,
    'CNPJ': r.cnpj,
    'Razão Social / Condomínio': r.companyName,
    'Cód. Estabelecimento': r.report?.estabelecimentoCode || '-',
    'Período Relatório': r.periodoRelatorio || '-',
    'Período DARF': r.periodoDarf || '-',
    'INSS Total Líquido (R$)': r.report ? r.report.inssTotalLiquido : 0,
    'IR Total a Recolher (R$)': r.report ? r.report.irTotalRecolher : 0,
    'Valor do PIS (R$)': r.report ? r.report.pisValor : 0,
    'Total Ref. Relatório (R$)': r.totalReferenciaRelatorio,
    'Total Bruto DARF (R$)': r.totalGeralDarf,
    'Retenções NF Excluídas (R$)': r.totalRetencoesExcluidas,
    'Códigos Retenção': r.retencoesDetalhes.map((d) => d.codigo).join(', ') || 'Nenhuma',
    'DARF Ajustado (R$)': r.totalDarfAjustado,
    'Diferença (R$)': r.diferenca,
    'Status': r.statusLabel,
    'Diagnóstico / Observação': r.discrepancyNote || 'Sem divergência de cálculo.',
  }));

  const wsGeneral = XLSX.utils.json_to_sheet(generalData);
  const colWidths = [
    { wch: 5 },  // Nº
    { wch: 20 }, // CNPJ
    { wch: 38 }, // Razão Social
    { wch: 12 }, // Estab
    { wch: 16 }, // Período Rel
    { wch: 16 }, // Período DARF
    { wch: 16 }, // INSS
    { wch: 16 }, // IR
    { wch: 14 }, // PIS
    { wch: 18 }, // Ref
    { wch: 16 }, // DARF Bruto
    { wch: 18 }, // Retenções
    { wch: 18 }, // Cód Retenção
    { wch: 18 }, // DARF Ajustado
    { wch: 15 }, // Dif
    { wch: 24 }, // Status
    { wch: 45 }, // Diagnóstico
  ];
  wsGeneral['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsGeneral, 'Conferência Geral');

  // Sheet 3: Retenções Excluídas
  const retencoesList: any[] = [];
  rows.forEach((r) => {
    r.retencoesDetalhes.forEach((item) => {
      retencoesList.push({
        'CNPJ': r.cnpj,
        'Empresa': r.companyName,
        'Código Retenção': item.codigo,
        'Denominação': item.denominacao,
        'Valor Retenção (R$)': item.total,
        'Motivo Exclusão': item.retentionReason || 'Retenção na Fonte de Nota Fiscal',
      });
    });
  });

  if (retencoesList.length > 0) {
    const wsRetencoes = XLSX.utils.json_to_sheet(retencoesList);
    wsRetencoes['!cols'] = [
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 35 },
      { wch: 16 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRetencoes, 'Retenções Excluídas');
  }

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanPeriod = periodoGeral.replace(/\//g, '-').replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Auditoria_DARF_vs_Relatorio_${cleanPeriod}_${dateStr}.xlsx`);
}

export function exportToPdf(
  rows: ReconciliationRow[],
  periodoGeral: string = 'Setembro/2026'
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Relatório de Auditoria Fiscal: DARF vs Resumo de Impostos', 40, 40);

  // Subheader
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const generationDate = new Date().toLocaleString('pt-BR');
  doc.text(
    `Período Analisado: ${periodoGeral}  ·  Gerado em: ${generationDate}  ·  Regra: [INSS Líquido + IR + PIS] vs [DARF sem 5952, 1708, 1162, 5987, 5960, 5979]`,
    40,
    58
  );

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 68, pageWidth - 40, 68);

  // KPI Metrics strip
  const totalEmpresas = rows.length;
  const conferidos = rows.filter((r) => r.status === 'conferido').length;
  const divergentes = rows.filter((r) => r.status === 'divergente').length;
  const semDarf = rows.filter((r) => r.status === 'sem_darf').length;
  const totalRetencoes = rows.reduce((acc, r) => acc + r.totalRetencoesExcluidas, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const kpis = [
    `Total Analisado: ${totalEmpresas}`,
    `Conferidos: ${conferidos} (${((conferidos / (totalEmpresas || 1)) * 100).toFixed(0)}%)`,
    `Divergências: ${divergentes}`,
    `Pendentes de DARF: ${semDarf}`,
    `Total Retenções Excluídas: ${formatCurrency(totalRetencoes)}`,
  ];

  let kpiX = 40;
  for (const kpi of kpis) {
    doc.text(kpi, kpiX, 84);
    kpiX += 150;
  }

  // Helper to format compact period (e.g. 09/2026) to prevent date wrapping
  const formatCompactPeriod = (p?: string) => {
    if (!p) return '-';
    if (/^\d{2}\/\d{4}$/.test(p.trim())) return p.trim();
    const clean = p.toLowerCase().trim();
    const months: Record<string, string> = {
      janeiro: '01', fevereiro: '02', março: '03', marco: '03',
      abril: '04', maio: '05', junho: '06', julho: '07',
      agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
    };
    for (const [mName, mNum] of Object.entries(months)) {
      if (clean.includes(mName)) {
        const yearMatch = clean.match(/\d{4}/);
        if (yearMatch) return `${mNum}/${yearMatch[0]}`;
      }
    }
    return p;
  };

  // Table Data
  const tableRows = rows.map((r, i) => [
    (i + 1).toString(),
    r.cnpj,
    // Permite quebra em até 2 linhas completas sem cortar o nome
    r.companyName.length > 65 ? r.companyName.substring(0, 64) + '…' : r.companyName,
    formatCompactPeriod(r.periodoDarf || r.periodoRelatorio),
    formatCurrency(r.report?.inssTotalLiquido || 0),
    formatCurrency(r.report?.irTotalRecolher || 0),
    formatCurrency(r.report?.pisValor || 0),
    formatCurrency(r.totalReferenciaRelatorio),
    formatCurrency(r.totalGeralDarf),
    r.totalRetencoesExcluidas > 0 ? `-${formatCurrency(r.totalRetencoesExcluidas)}` : 'R$ 0,00',
    formatCurrency(r.totalDarfAjustado),
    `${r.diferenca >= 0 ? '+' : ''}${formatCurrency(r.diferenca)}`,
    r.status === 'conferido'
      ? 'OK'
      : r.status === 'divergente'
      ? 'DIVERGENTE'
      : r.status === 'terceirizado_sem_folha'
      ? 'TERCEIRIZADO'
      : r.status === 'sem_darf'
      ? 'SEM DARF'
      : 'ATENÇÃO',
  ]);

  autoTable(doc, {
    startY: 96,
    margin: { left: 20, right: 20 },
    head: [
      [
        '#',
        'CNPJ',
        'Condomínio / Empresa',
        'Compet.',
        'INSS Líq.',
        'IR Rec.',
        'PIS Folha',
        'Ref. Relat.',
        'DARF Bruto',
        'Retenções',
        'DARF Ajust.',
        'Diferença',
        'Status',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 2, right: 2 },
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      overflow: 'visible', // Impede que números quebrem dígitos na linha de baixo!
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18 },
      1: { halign: 'center', cellWidth: 74 },
      2: { halign: 'left', cellWidth: 155, fontSize: 6.8, overflow: 'linebreak' }, // Linha dupla estritamente no nome
      3: { halign: 'center', cellWidth: 44, fontSize: 6.8 }, // Competência MM/AAAA (ex: 09/2026) sem quebra
      4: { halign: 'right', cellWidth: 56, fontSize: 6.6 },  // INSS Líquido com espaço amplo para não quebrar centavos
      5: { halign: 'right', cellWidth: 52, fontSize: 6.6 },  // IR a Recolher
      6: { halign: 'right', cellWidth: 50, fontSize: 6.6 },  // PIS Folha
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 60, fontSize: 6.6 }, // Total Ref. Relatório
      8: { halign: 'right', cellWidth: 60, fontSize: 6.6 },  // DARF Bruto
      9: { halign: 'right', textColor: [180, 83, 9], cellWidth: 52, fontSize: 6.6 }, // Retenções
      10: { halign: 'right', fontStyle: 'bold', cellWidth: 60, fontSize: 6.6 }, // DARF Ajustado
      11: { halign: 'right', fontStyle: 'bold', cellWidth: 54, fontSize: 6.6 }, // Diferença
      12: { halign: 'center', fontStyle: 'bold', cellWidth: 65, fontSize: 6.6 }, // Status
    },
    didParseCell: (data) => {
      // Highlight Status column
      if (data.section === 'body' && data.column.index === 12) {
        const val = data.cell.raw as string;
        if (val === 'OK') {
          data.cell.styles.textColor = [22, 101, 52]; // green-800
          data.cell.styles.fillColor = [240, 253, 244]; // green-50
        } else if (val === 'DIVERGENTE') {
          data.cell.styles.textColor = [153, 27, 27]; // red-800
          data.cell.styles.fillColor = [254, 242, 242]; // red-50
        } else if (val === 'SEM DARF') {
          data.cell.styles.textColor = [133, 77, 14]; // amber-800
          data.cell.styles.fillColor = [254, 252, 232]; // amber-50
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${data.pageNumber} de ${totalPages} · Sistema de Auditoria DARF & DCTFWeb`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanPeriod = periodoGeral.replace(/\//g, '-').replace(/\s+/g, '_');
  doc.save(`Auditoria_DARF_vs_Relatorio_${cleanPeriod}_${dateStr}.pdf`);
}
