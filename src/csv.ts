import type { ColumnMapping, CsvData, ImportedTransaction } from './types';

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, '').trim();

function countDelimiter(line: string, delimiter: string): number {
  let count = 0;
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') quoted = !quoted;
    else if (!quoted && line[i] === delimiter) count += 1;
  }
  return count;
}

export function parseCsv(text: string): CsvData {
  if (!text.trim()) throw new Error('This file is empty. Choose a CSV with a header row.');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const candidates = [',', ';', '\t'] as const;
  const delimiter = candidates.reduce((best, candidate) =>
    countDelimiter(firstLine, candidate) > countDelimiter(firstLine, best) ? candidate : best
  , candidates[0]);

  if (countDelimiter(firstLine, delimiter) === 0) {
    throw new Error('No CSV columns were found. Export a comma, semicolon, or tab-separated file.');
  }

  const matrix: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      if (row.some((value) => value.trim())) matrix.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('A quoted field is not closed. Re-export the CSV and try again.');
  row.push(field);
  if (row.some((value) => value.trim())) matrix.push(row);
  if (matrix.length < 2) throw new Error('The CSV has a header but no transaction rows.');

  const rawHeaders = matrix[0] ?? [];
  const dataLikeCells = rawHeaders.filter((value) => {
    const trimmed = value.trim();
    return /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(trimmed) ||
      /^[-+]?\(?[£$€]?\d[\d,.' ]*\)?$/.test(trimmed);
  }).length;
  if (dataLikeCells >= Math.ceil(rawHeaders.length / 2)) {
    throw new Error('The first row must contain column names. Export the bank CSV with its header row included.');
  }
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((raw, index) => {
    const base = normalizeHeader(raw) || `Column ${index + 1}`;
    const next = (seen.get(base) ?? 0) + 1;
    seen.set(base, next);
    return next === 1 ? base : `${base} (${next})`;
  });
  const rows = matrix.slice(1).map((values) => headers.map((_, index) => (values[index] ?? '').trim()));
  return { headers, rows, delimiter };
}

function findHeader(headers: string[], patterns: RegExp[]): number {
  const lowered = headers.map((header) => header.toLowerCase().trim());
  for (const pattern of patterns) {
    const index = lowered.findIndex((header) => pattern.test(header));
    if (index >= 0) return index;
  }
  return -1;
}

export function suggestMapping(headers: string[]): ColumnMapping {
  const debit = findHeader(headers, [/^debit$/, /^withdrawal/, /^money out/, /^paid out/]);
  const credit = findHeader(headers, [/^credit$/, /^deposit/, /^money in/, /^paid in/]);
  return {
    date: findHeader(headers, [/^date$/, /transaction date/, /posted date/, /booking date/]),
    description: findHeader(headers, [/description/, /details/, /narration/, /merchant/, /memo/]),
    amountMode: debit >= 0 || credit >= 0 ? 'split' : 'signed',
    amount: findHeader(headers, [/^amount$/, /transaction amount/, /^value$/]),
    debit,
    credit,
    balance: findHeader(headers, [/running balance/, /^balance$/, /closing balance/]),
    dateFormat: 'auto'
  };
}

export function parseMoney(raw: string): number | null {
  let value = raw.trim();
  if (!value) return null;
  const parenthesized = /^\(.*\)$/.test(value);
  value = value.replace(/[()\s\u00A0]/g, '').replace(/[^0-9,.'+\-]/g, '').replace(/'/g, '');
  if (!value || !/[0-9]/.test(value)) return null;
  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? ',' : '.';
    const thousands = decimal === ',' ? /\./g : /,/g;
    value = value.replace(thousands, '').replace(decimal, '.');
  } else if (lastComma >= 0) {
    const fractionLength = value.length - lastComma - 1;
    value = fractionLength === 1 || fractionLength === 2
      ? value.replace(/\./g, '').replace(',', '.')
      : value.replace(/,/g, '');
  } else {
    const dots = value.match(/\./g)?.length ?? 0;
    if (dots > 1) {
      const final = value.lastIndexOf('.');
      value = `${value.slice(0, final).replace(/\./g, '')}${value.slice(final)}`;
    }
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return parenthesized ? -Math.abs(number) : number;
}

export function parseDate(raw: string, format: ColumnMapping['dateFormat']): string | null {
  const value = raw.trim();
  if (!value) return null;
  const iso = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\D.*)?$/);
  let year: number;
  let month: number;
  let day: number;
  if (iso) {
    year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]);
  } else {
    const parts = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:\D.*)?$/);
    if (!parts) return null;
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    year = Number(parts[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    const resolved = format === 'auto' ? (first > 12 ? 'dmy' : second > 12 ? 'mdy' : 'mdy') : format;
    if (resolved === 'ymd') return null;
    month = resolved === 'dmy' ? second : first;
    day = resolved === 'dmy' ? first : second;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function stableId(index: number, row: string[]): string {
  let hash = 2166136261;
  const input = `${index}|${row.join('\u001f')}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `row-${index + 1}-${(hash >>> 0).toString(36)}`;
}

export function importTransactions(csv: CsvData, mapping: ColumnMapping): ImportedTransaction[] {
  return csv.rows.map((row, sourceIndex) => {
    const dateRaw = row[mapping.date] ?? '';
    const description = (row[mapping.description] ?? '').trim();
    const date = parseDate(dateRaw, mapping.dateFormat);
    let amount: number | null;
    if (mapping.amountMode === 'split') {
      const debit = mapping.debit >= 0 ? parseMoney(row[mapping.debit] ?? '') : null;
      const credit = mapping.credit >= 0 ? parseMoney(row[mapping.credit] ?? '') : null;
      amount = debit == null && credit == null ? null : Math.abs(credit ?? 0) - Math.abs(debit ?? 0);
    } else amount = mapping.amount >= 0 ? parseMoney(row[mapping.amount] ?? '') : null;
    const reportedBalance = mapping.balance >= 0 ? parseMoney(row[mapping.balance] ?? '') : null;
    const errors: string[] = [];
    if (!date) errors.push('Date not understood');
    if (!description) errors.push('Description is empty');
    if (amount == null) errors.push('Amount not understood');
    return {
      id: stableId(sourceIndex, row), sourceIndex, dateRaw, date, description, amount,
      reportedBalance, raw: row, error: errors.length ? errors.join('; ') : undefined
    };
  });
}

export function escapeCsv(value: unknown): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
