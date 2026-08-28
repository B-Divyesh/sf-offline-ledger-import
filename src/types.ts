export type AmountMode = 'signed' | 'split';
export type DateFormat = 'auto' | 'ymd' | 'mdy' | 'dmy';

export interface CsvData {
  headers: string[];
  rows: string[][];
  delimiter: ',' | ';' | '\t';
}

export interface ColumnMapping {
  date: number;
  description: number;
  amountMode: AmountMode;
  amount: number;
  debit: number;
  credit: number;
  balance: number;
  dateFormat: DateFormat;
}

export interface ImportedTransaction {
  id: string;
  sourceIndex: number;
  dateRaw: string;
  date: string | null;
  description: string;
  amount: number | null;
  reportedBalance: number | null;
  raw: string[];
  error?: string;
}

export type DuplicateKind = 'exact' | 'possible' | null;

export interface CheckedTransaction extends ImportedTransaction {
  fingerprint: string;
  duplicateKind: DuplicateKind;
  duplicateOf?: string;
  included: boolean;
  expectedBalance: number | null;
  discrepancy: number | null;
  startsGap: boolean;
}

export interface CheckResult {
  rows: CheckedTransaction[];
  opening: number;
  closing: number;
  includedTotal: number;
  expectedClosing: number;
  closingDifference: number;
  exactDuplicates: number;
  possibleDuplicates: number;
  gapCount: number;
  invalidCount: number;
  hasRunningBalances: boolean;
  reconciled: boolean;
}

export interface Draft {
  version: 1;
  filename: string;
  csvText: string;
  statementName: string;
  currency: string;
  opening: string;
  closing: string;
  mapping: ColumnMapping;
  includedOverrides: Record<string, boolean>;
  savedAt: string;
}
