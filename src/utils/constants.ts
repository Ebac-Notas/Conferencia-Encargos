export const RETENTION_CODES: Record<string, string> = {
  '5952': 'Retenção Contribuições (PIS/COFINS/CSLL) - Pagamento PJ a PJ',
  '1708': 'IRRF - Serviços prestados por Pessoa Jurídica',
  '1162': 'IRRF - Serviços de Limpeza, Conservação, Segurança e Mão de Obra',
  '5987': 'CSLL - Retenção na Fonte (Desmembramento do 5952)',
  '5960': 'COFINS - Retenção na Fonte (Desmembramento do 5952)',
  '5979': 'PIS/PASEP - Retenção na Fonte (Desmembramento do 5952)',
};

export const DEFAULT_EXCLUDED_CODES = ['5952', '1708', '1162', '5987', '5960', '5979'];

export const MONTH_MAP: Record<string, string> = {
  janeiro: '01',
  jan: '01',
  fevereiro: '02',
  fev: '02',
  marco: '03',
  março: '03',
  mar: '03',
  abril: '04',
  abr: '04',
  maio: '05',
  mai: '05',
  junho: '06',
  jun: '06',
  julho: '07',
  jul: '07',
  agosto: '08',
  ago: '08',
  setembro: '09',
  set: '09',
  outubro: '10',
  out: '10',
  novembro: '11',
  nov: '11',
  dezembro: '12',
  dez: '12',
};

export function normalizePeriod(periodStr: string): string {
  if (!periodStr) return '';
  const cleaned = periodStr.trim().toLowerCase();
  
  // Try pattern like MM/YYYY or MM/YY
  const slashNumMatch = cleaned.match(/(\d{1,2})\/(\d{2,4})/);
  if (slashNumMatch) {
    const month = slashNumMatch[1].padStart(2, '0');
    let year = slashNumMatch[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}`;
  }

  // Try pattern like "Setembro/2026" or "Setembro de 2026"
  const textMatch = cleaned.match(/([a-zç]+)[\s\/]+(?:de\s+)?(\d{4})/i);
  if (textMatch) {
    const monthName = textMatch[1].toLowerCase();
    const year = textMatch[2];
    const monthNum = MONTH_MAP[monthName];
    if (monthNum) {
      return `${year}-${monthNum}`;
    }
  }

  return periodStr;
}

export function formatPeriodReadable(normalizedOrRaw: string): string {
  if (!normalizedOrRaw) return 'Não identificado';
  const match = normalizedOrRaw.match(/(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const monthNum = match[2];
    const reverseMap: Record<string, string> = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro',
    };
    return `${reverseMap[monthNum] || monthNum}/${year}`;
  }
  return normalizedOrRaw;
}

export function cleanCnpj(cnpj: string): string {
  return cnpj ? cnpj.replace(/\D/g, '') : '';
}

export function formatCnpj(cnpj: string): string {
  const digits = cleanCnpj(cnpj);
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function parsePtBrNumber(val: string | number | undefined | null): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // If string contains Brazilian format like 1.234,56
  const str = val.trim();
  const normalized = str
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
