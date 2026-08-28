import type { CheckResult, CheckedTransaction, ImportedTransaction } from './types';

const CENT = 0.005;
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const normalizedDescription = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function fingerprint(transaction: ImportedTransaction): string {
  const input = `${transaction.date}|${normalizedDescription(transaction.description)}|${transaction.amount?.toFixed(2)}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function reconcile(
  transactions: ImportedTransaction[],
  opening: number,
  closing: number,
  includedOverrides: Record<string, boolean> = {}
): CheckResult {
  const sorted = [...transactions].sort((a, b) => {
    if (!a.date && !b.date) return a.sourceIndex - b.sourceIndex;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date) || a.sourceIndex - b.sourceIndex;
  });
  const exactSeen = new Map<string, string>();
  const previousValid: CheckedTransaction[] = [];
  const rows: CheckedTransaction[] = [];

  for (const transaction of sorted) {
    const rowFingerprint = fingerprint(transaction);
    let duplicateKind: CheckedTransaction['duplicateKind'] = null;
    let duplicateOf: string | undefined;
    if (!transaction.error) {
      duplicateOf = exactSeen.get(rowFingerprint);
      if (duplicateOf) duplicateKind = 'exact';
      else exactSeen.set(rowFingerprint, transaction.id);
      if (!duplicateKind && transaction.date && transaction.amount != null) {
        const currentTime = Date.parse(transaction.date);
        const possible = previousValid.find((previous) =>
          previous.date && previous.amount === transaction.amount &&
          normalizedDescription(previous.description) === normalizedDescription(transaction.description) &&
          Math.abs(currentTime - Date.parse(previous.date)) <= 3 * 86_400_000
        );
        if (possible) {
          duplicateKind = 'possible';
          duplicateOf = possible.id;
        }
      }
    }
    const includedDefault = !transaction.error && duplicateKind !== 'exact';
    const checked: CheckedTransaction = {
      ...transaction,
      fingerprint: rowFingerprint,
      duplicateKind,
      duplicateOf,
      included: transaction.id in includedOverrides ? Boolean(includedOverrides[transaction.id]) : includedDefault,
      expectedBalance: null,
      discrepancy: null,
      startsGap: false
    };
    rows.push(checked);
    if (!transaction.error) previousValid.push(checked);
  }

  let running = opening;
  let priorDiscrepancy = 0;
  let gapCount = 0;
  for (const row of rows) {
    if (row.included && row.amount != null) running = roundMoney(running + row.amount);
    row.expectedBalance = row.error ? null : running;
    if (row.reportedBalance != null && row.expectedBalance != null) {
      row.discrepancy = roundMoney(row.reportedBalance - row.expectedBalance);
      if (Math.abs(row.discrepancy - priorDiscrepancy) >= CENT) {
        row.startsGap = true;
        gapCount += 1;
      }
      priorDiscrepancy = row.discrepancy;
    }
  }
  const includedTotal = roundMoney(rows.reduce((total, row) => total + (row.included ? row.amount ?? 0 : 0), 0));
  const expectedClosing = roundMoney(opening + includedTotal);
  const closingDifference = roundMoney(closing - expectedClosing);
  const invalidCount = rows.filter((row) => Boolean(row.error)).length;
  const exactDuplicates = rows.filter((row) => row.duplicateKind === 'exact').length;
  const possibleDuplicates = rows.filter((row) => row.duplicateKind === 'possible').length;
  return {
    rows, opening, closing, includedTotal, expectedClosing, closingDifference,
    exactDuplicates, possibleDuplicates, gapCount, invalidCount,
    hasRunningBalances: rows.some((row) => row.reportedBalance != null),
    reconciled: Math.abs(closingDifference) < CENT && gapCount === 0 && invalidCount === 0
  };
}
