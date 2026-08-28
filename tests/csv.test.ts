import { describe, expect, it } from 'vitest';
import { importTransactions, parseCsv, parseDate, parseMoney, suggestMapping } from '../src/csv';

describe('CSV import', () => {
  it('parses quoted commas, escaped quotes, and blank lines', () => {
    const parsed = parseCsv('Date,Description,Amount\r\n2026-01-01,"Cafe, ""North""",-12.50\r\n\r\n');
    expect(parsed.headers).toEqual(['Date', 'Description', 'Amount']);
    expect(parsed.rows).toEqual([['2026-01-01', 'Cafe, "North"', '-12.50']]);
  });

  it('handles European money and accounting negatives', () => {
    expect(parseMoney('€1.234,56')).toBe(1234.56);
    expect(parseMoney('(1,234.56)')).toBe(-1234.56);
    expect(parseMoney('')).toBeNull();
  });

  it('makes ambiguous automatic dates explicit and supports DMY', () => {
    expect(parseDate('03/04/2026', 'auto')).toBe('2026-03-04');
    expect(parseDate('03/04/2026', 'dmy')).toBe('2026-04-03');
    expect(parseDate('31/02/2026', 'dmy')).toBeNull();
  });

  it('maps split debit and credit files', () => {
    const csv = parseCsv('Posted date,Narration,Debit,Credit,Balance\n2026-01-01,Invoice,,500,1500\n2026-01-02,Rent,700,,800');
    const mapping = suggestMapping(csv.headers);
    expect(mapping.amountMode).toBe('split');
    const rows = importTransactions(csv, mapping);
    expect(rows.map((row) => row.amount)).toEqual([500, -700]);
  });

  it('reports malformed files in actionable language', () => {
    expect(() => parseCsv('only one field\nvalue')).toThrow(/No CSV columns/);
    expect(() => parseCsv('A,B\n"unfinished,2')).toThrow(/not closed/);
  });
});
