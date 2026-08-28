import { describe, expect, it } from 'vitest';
import { reconcile } from '../src/reconcile';
import type { ImportedTransaction } from '../src/types';

function row(index: number, month: number, balance: number): ImportedTransaction {
  const date = `2026-${String(month).padStart(2, '0')}-15`;
  return { id: `row-${index}`, sourceIndex: index, dateRaw: date, date, description: `Monthly entry ${month}`, amount: 100, reportedBalance: balance, raw: [] };
}

describe('reconciliation', () => {
  it('detects every injected duplicate and missing transaction in a 12-month corpus', () => {
    const corpus: ImportedTransaction[] = [];
    for (let month = 1; month <= 12; month += 1) {
      if (month !== 10) corpus.push(row(corpus.length, month, 1000 + month * 100));
      if (month === 6) {
        const duplicate = { ...corpus[corpus.length - 1]!, id: 'injected-duplicate', sourceIndex: corpus.length };
        corpus.push(duplicate);
      }
    }
    const checked = reconcile(corpus, 1000, 2200);
    expect(checked.exactDuplicates).toBe(1);
    expect(checked.rows.find((item) => item.id === 'injected-duplicate')?.included).toBe(false);
    expect(checked.gapCount).toBe(1);
    expect(checked.rows.find((item) => item.date === '2026-11-15')?.startsGap).toBe(true);
    expect(checked.closingDifference).toBe(100);
    expect(checked.reconciled).toBe(false);
  });

  it('reconciles when included movements bridge opening and closing', () => {
    const checked = reconcile([row(0, 1, 1100), row(1, 2, 1200)], 1000, 1200);
    expect(checked.reconciled).toBe(true);
    expect(checked.closingDifference).toBe(0);
    expect(checked.gapCount).toBe(0);
  });

  it('lets the user include an exact repeat when the bank balance proves it is real', () => {
    const first = row(0, 1, 1100);
    const second = { ...first, id: 'row-1', sourceIndex: 1, reportedBalance: 1200 };
    const checked = reconcile([first, second], 1000, 1200, { 'row-1': true });
    expect(checked.exactDuplicates).toBe(1);
    expect(checked.reconciled).toBe(true);
  });
});
