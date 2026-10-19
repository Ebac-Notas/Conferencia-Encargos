import { pdfjsLib } from './pdfConfig';
import {
  cleanCnpj,
  formatCnpj,
  normalizePeriod,
  parsePtBrNumber,
  DEFAULT_EXCLUDED_CODES,
  RETENTION_CODES,
} from './constants';
import { ReportCompany, DarfDocument, DarfItem } from '../types';

interface RawTextPage {
  pageNumber: number;
  text: string;
  lines: string[];
}

/**
 * Extracts clean visual lines from a PDF page using pdfjs
 */
async function extractPageLines(page: any, pageNumber: number): Promise<RawTextPage> {
  const textContent = await page.getTextContent();
  const items: any[] = textContent.items;

  // Group items by vertical position (Y coordinate)
  const lineMap = new Map<number, any[]>();
  const yTolerance = 4; // pixels tolerance for items on the same line

  for (const item of items) {
    if (!item.str || item.str.trim() === '') continue;
    const y = item.transform[5];

    let matchedY: number | null = null;
    for (const existingY of lineMap.keys()) {
      if (Math.abs(existingY - y) <= yTolerance) {
        matchedY = existingY;
        break;
      }
    }

    if (matchedY !== null) {
      lineMap.get(matchedY)!.push(item);
    } else {
      lineMap.set(y, [item]);
    }
  }

  // Sort lines from top to bottom (descending Y in PDF coordinates)
  const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

  const lines: string[] = [];
  for (const y of sortedY) {
    const lineItems = lineMap.get(y)!;
    // Sort items within line from left to right (ascending X)
    lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
    const lineText = lineItems.map((item) => item.str.trim()).join(' ');
    if (lineText.length > 0) {
      lines.push(lineText);
    }
  }

  return {
    pageNumber,
    text: lines.join('\n'),
    lines,
  };
}

/**
 * Parses the "Resumo de Impostos" PDF (multi-page report)
 */
export async function parseTaxSummaryPdf(
  file: File,
  onPageProgress?: (current: number, total: number) => void
): Promise<ReportCompany[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const companies: ReportCompany[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const { lines, text } = await extractPageLines(page, i);
    onPageProgress?.(i, numPages);

    const parsed = parseReportPage(lines, text, i);
    if (parsed) {
      companies.push(parsed);
    }
  }

  return companies;
}

/**
 * Parses a single page of the tax summary report
 */
function parseReportPage(
  lines: string[],
  fullText: string,
  pageNumber: number
): ReportCompany | null {
  // 1. Period: "Resumo de Impostos de Setembro/2026"
  let periodo = '';
  const periodMatch = fullText.match(
    /Resumo\s+de\s+Impostos\s+de\s+([A-Za-zçÇ]+\/\d{4})/i
  );
  if (periodMatch) {
    periodo = periodMatch[1];
  } else {
    // fallback check
    const altPeriod = fullText.match(/Resumo\s+de\s+Impostos\s+de\s+([^\n\r]+)/i);
    if (altPeriod) periodo = altPeriod[1].trim();
  }

  // 2. CNPJ and Empresa code
  // Example: "CNPJ : 26.444.364/0001-54 Empresa : 118"
  let cnpj = '';
  let empresaCode = '';
  const cnpjMatch = fullText.match(
    /CNPJ\s*:\s*([\d\.\/\-]+)(?:\s+Empresa\s*:\s*(\d+))?/i
  );
  if (cnpjMatch) {
    cnpj = cnpjMatch[1].trim();
    if (cnpjMatch[2]) empresaCode = cnpjMatch[2].trim();
  } else {
    // try standalone CNPJ regex
    const genericCnpj = fullText.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    if (genericCnpj) cnpj = genericCnpj[1];
  }

  if (!cnpj) {
    return null; // Not a valid report page or summary page without company
  }

  // 3. Company Name / Estabelecimento
  // Example: "Estabelecimento : 118 - Condomínio do Edifício Multiclínicas"
  let companyName = '';
  let estabelecimentoCode = '';
  const estabMatch = fullText.match(
    /Estabelecimento\s*:\s*(\d+)?\s*-?\s*([^\n\r]+)/i
  );
  if (estabMatch) {
    estabelecimentoCode = estabMatch[1] || '';
    companyName = estabMatch[2]?.trim() || '';
  }

  // If company name not found from Estabelecimento, look at header title lines
  if (!companyName) {
    for (const line of lines) {
      if (
        (line.toLowerCase().includes('condom') || line.toLowerCase().includes('ebac') || line.toLowerCase().includes('edifício')) &&
        !line.toLowerCase().includes('estabelecimento') &&
        !line.toLowerCase().includes('nasajon')
      ) {
        companyName = line.trim();
        break;
      }
    }
  }

  // Clean company name
  if (companyName.includes('Empresa :')) {
    companyName = companyName.split('Empresa :')[0].trim();
  }

  // 4. Section values
  // A) INSS: "(=) Total Líquido" -> value
  let inssTotalLiquido = 0;
  const inssMatch = fullText.match(
    /\(=\)\s*Total\s+L[íi]quido[\s:]*([0-9\.\,]+)/i
  );
  if (inssMatch) {
    inssTotalLiquido = parsePtBrNumber(inssMatch[1]);
  } else {
    // Check lines for (=) Total Líquido
    for (const line of lines) {
      if (line.includes('Total Líquido') || line.includes('Total Liquido')) {
        const valMatch = line.match(/([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/);
        if (valMatch) inssTotalLiquido = parsePtBrNumber(valMatch[1]);
      }
    }
  }

  // B) IR: "(=) Total a Recolher" -> value
  // Note: in report, under "IR", there is "(=) Total a Recolher"
  let irTotalRecolher = 0;
  // Let's locate the IR block
  const irIndex = fullText.indexOf('\nIR\n');
  const outrosIndex = fullText.indexOf('\nOutros\n');
  if (irIndex !== -1) {
    const irBlock = fullText.substring(
      irIndex,
      outrosIndex !== -1 && outrosIndex > irIndex ? outrosIndex : undefined
    );
    const irMatch = irBlock.match(
      /\(=\)\s*Total\s+a\s+Recolher[\s:]*([0-9\.\,]+)/i
    );
    if (irMatch) {
      irTotalRecolher = parsePtBrNumber(irMatch[1]);
    }
  } else {
    // Fallback: match Total a Recolher anywhere
    const irMatch = fullText.match(
      /\(=\)\s*Total\s+a\s+Recolher[\s:]*([0-9\.\,]+)/i
    );
    if (irMatch) irTotalRecolher = parsePtBrNumber(irMatch[1]);
  }

  // C) Outros: "Valor do PIS" -> value
  let pisValor = 0;
  const pisMatch = fullText.match(/Valor\s+do\s+PIS[\s:]*([0-9\.\,]+)/i);
  if (pisMatch) {
    pisValor = parsePtBrNumber(pisMatch[1]);
  } else {
    for (const line of lines) {
      if (line.includes('Valor do PIS')) {
        const valMatch = line.match(/([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/);
        if (valMatch) pisValor = parsePtBrNumber(valMatch[1]);
      }
    }
  }

  // D) FGTS: (=) Total de FGTS (optional for reference display)
  let fgtsTotal = 0;
  const fgtsMatch = fullText.match(
    /\(=\)\s*Total\s+de\s+FGTS[\s:]*([0-9\.\,]+)/i
  );
  if (fgtsMatch) fgtsTotal = parsePtBrNumber(fgtsMatch[1]);

  // Total de Referência: Total Líquido INSS + Total a Recolher IR + Valor do PIS
  const totalReferencia = inssTotalLiquido + irTotalRecolher + pisValor;

  return {
    id: `rep_${cleanCnpj(cnpj)}_${pageNumber}`,
    pageNumber,
    empresaCode,
    estabelecimentoCode,
    companyName: companyName || `Empresa ${empresaCode}`,
    cnpj: formatCnpj(cnpj),
    rawCnpj: cleanCnpj(cnpj),
    periodo,
    normalizedPeriodo: normalizePeriod(periodo),
    inssTotalLiquido,
    irTotalRecolher,
    pisValor,
    fgtsTotal,
    totalReferencia: Number(totalReferencia.toFixed(2)),
  };
}

/**
 * Parses a DARF PDF file (single DARF or multi-page DARF)
 */
export async function parseDarfPdf(
  file: File,
  excludedCodes: string[] = DEFAULT_EXCLUDED_CODES
): Promise<DarfDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let allLines: string[] = [];
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const { lines, text } = await extractPageLines(page, i);
    allLines = allLines.concat(lines);
    fullText += '\n' + text;
  }

  return extractDarfDetails(file.name, allLines, fullText, excludedCodes);
}

/**
 * Robustly extracts the Período de Apuração from DARF text and lines
 */
function extractDarfPeriod(fullText: string, lines: string[]): string {
  // Strategy 1: Explicit month name + slash + 4-digit year (e.g. "setembro/2026")
  const monthNames =
    'janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro';
  const monthYearRegex = new RegExp(`\\b(${monthNames})\\/(\\d{4})\\b`, 'i');
  const monthYearMatch = fullText.match(monthYearRegex);
  if (monthYearMatch) {
    const month =
      monthYearMatch[1].charAt(0).toUpperCase() +
      monthYearMatch[1].slice(1).toLowerCase();
    return `${month}/${monthYearMatch[2]}`;
  }

  // Strategy 2: PA:MM/YYYY in item details (e.g., "PA:09/2026" or "PA: 09/2026")
  const paMatch = fullText.match(/\bPA\s*:\s*(\d{2}\/\d{4})\b/i);
  if (paMatch) {
    return paMatch[1];
  }

  // Strategy 3: Lines inspection near "Período de Apuração"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.toLowerCase().includes('período de apuração') ||
      line.toLowerCase().includes('periodo de apuracao')
    ) {
      for (let j = i; j <= Math.min(i + 3, lines.length - 1); j++) {
        const candidateLine = lines[j];
        const m = candidateLine.match(monthYearRegex);
        if (m) {
          const month =
            m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
          return `${month}/${m[2]}`;
        }
        const numM = candidateLine.match(/\b([01]\d\/\d{4})\b/);
        if (numM) {
          return numM[1];
        }
      }
    }
  }

  // Strategy 4: Generic numeric MM/YYYY
  const genericMonthYear = fullText.match(/\b([01]\d)\/(\d{4})\b/);
  if (genericMonthYear) {
    return `${genericMonthYear[1]}/${genericMonthYear[2]}`;
  }

  return '';
}

/**
 * Extracts DARF metadata, line items, and excluded retentions
 */
export function extractDarfDetails(
  filename: string,
  lines: string[],
  fullText: string,
  excludedCodes: string[] = DEFAULT_EXCLUDED_CODES
): DarfDocument {
  // 1. CNPJ: e.g. "26.444.364/0001-54 CONDOMINIO DO EDIFICIO MULTICLINICAS" or "CNPJ: 26.444.364/0001-54"
  let cnpj = '';
  let razaoSocial = '';
  const cnpjMatch = fullText.match(
    /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\s+([^\n\r]+)/
  );
  if (cnpjMatch) {
    cnpj = cnpjMatch[1].trim();
    razaoSocial = cnpjMatch[2].trim();
    // Strip headers if it captured trailing text
    if (razaoSocial.includes('Período')) {
      razaoSocial = razaoSocial.split(/Período/i)[0].trim();
    }
  } else {
    // Try CNPJ alone
    const soloCnpj = fullText.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
    if (soloCnpj) cnpj = soloCnpj[1];
    
    // Try Razão Social
    const razaoMatch = fullText.match(/Razão\s+Social[\s:]*([^\n\r]+)/i);
    if (razaoMatch) razaoSocial = razaoMatch[1].trim();
  }

  // 2. Período de Apuração: e.g. "Setembro/2026" or "09/2026"
  let periodoApuracao = extractDarfPeriod(fullText, lines);

  // 3. Data de Vencimento
  let dataVencimento = '';
  const vencMatch = fullText.match(/Data\s+de\s+Vencimento[\s:]*([\d\/]+)/i);
  if (vencMatch) dataVencimento = vencMatch[1].trim();

  // 4. Número do Documento
  let numeroDocumento = '';
  const docMatch = fullText.match(
    /Número\s+do\s+Documento[\s:]*([0-9\.\-]+)/i
  );
  if (docMatch) numeroDocumento = docMatch[1].trim();

  // 5. Número do Recibo Declaração
  let numeroRecibo = '';
  const reciboMatch = fullText.match(/Nº?\s*Recibo\s*Declaração[\s:]*(\d+)/i);
  if (reciboMatch) numeroRecibo = reciboMatch[1].trim();

  // 6. Valor Total do Documento
  let totalDocumento = 0;
  const totalDocMatch = fullText.match(
    /Valor\s+Total\s+do\s+Documento[\s:]*([0-9\.\,]+)/i
  );
  if (totalDocMatch) {
    totalDocumento = parsePtBrNumber(totalDocMatch[1]);
  } else {
    // Look for "Totais 14.027,16"
    const totaisMatch = fullText.match(/Totais[\s:]*([0-9\.\,]+)/i);
    if (totaisMatch) totalDocumento = parsePtBrNumber(totaisMatch[1]);
  }

  // 7. Parse items in "Composição do Documento de Arrecadação"
  // Format typically:
  // "1082 CONTR PREV DESCONTA SEGURADO-EMPREGADO/AVULSO 2.869,75 2.869,75"
  // "5952 RET DE CONTRIBUICOES PAGT PJ A PJ DE DIR PRIV 124,84 124,84"
  // "8301 PIS - FOLHA DE PAGAMENTO 296,11 296,11"
  const items: DarfItem[] = [];
  const retencoesExcluidas: DarfItem[] = [];

  // Regex matches 4 digit tax code at the beginning or isolated, followed by denomination, and values at the end
  const itemLineRegex = /^(\d{4})\s+([A-Z0-9\s\-\/\.\(\)]+?)\s+([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})(?:\s+([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}))*(?:\s+([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}))?$/;

  for (const line of lines) {
    const trimmed = line.trim();
    // Check if line starts with a 4-digit code (e.g., 1082, 5952, etc.)
    const codePrefixMatch = trimmed.match(/^(\d{4})\b/);
    if (codePrefixMatch) {
      const code = codePrefixMatch[1];
      // Extract numbers from the line (Principal, Multa, Juros, Total)
      const currencyMatches = trimmed.match(/([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/g);
      if (currencyMatches && currencyMatches.length > 0) {
        const lastValStr = currencyMatches[currencyMatches.length - 1];
        const itemTotal = parsePtBrNumber(lastValStr);
        const principal = currencyMatches.length >= 2 ? parsePtBrNumber(currencyMatches[0]) : itemTotal;

        // Extract denomination text between code and first currency number
        const firstNumIndex = trimmed.search(/[0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}/);
        let denominacao = trimmed.substring(4, firstNumIndex).trim();

        const isRetention = excludedCodes.includes(code);
        const retentionReason = isRetention
          ? RETENTION_CODES[code] || 'Retenção de Nota Fiscal desconsiderada'
          : undefined;

        const item: DarfItem = {
          codigo: code,
          denominacao: denominacao || `Código ${code}`,
          principal,
          multa: 0,
          juros: 0,
          total: itemTotal,
          isRetention,
          retentionReason,
        };

        items.push(item);
        if (isRetention) {
          retencoesExcluidas.push(item);
        }
      }
    }
  }

  // If totalDocumento wasn't caught by header regex, sum items or look for last total
  if (totalDocumento === 0 && items.length > 0) {
    totalDocumento = items.reduce((acc, curr) => acc + curr.total, 0);
  }

  const totalRetencoes = retencoesExcluidas.reduce(
    (acc, curr) => acc + curr.total,
    0
  );
  const totalAjustado = Number((totalDocumento - totalRetencoes).toFixed(2));

  return {
    id: `darf_${cleanCnpj(cnpj)}_${Date.now()}`,
    filename,
    cnpj: formatCnpj(cnpj),
    rawCnpj: cleanCnpj(cnpj),
    razaoSocial: razaoSocial || filename.replace('.pdf', ''),
    periodoApuracao,
    normalizedPeriodo: normalizePeriod(periodoApuracao),
    dataVencimento,
    numeroDocumento,
    numeroRecibo,
    totalDocumento: Number(totalDocumento.toFixed(2)),
    items,
    retencoesExcluidas,
    totalRetencoes: Number(totalRetencoes.toFixed(2)),
    totalAjustado,
  };
}
