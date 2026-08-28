import type { Draft } from './types';

const REAL_DB_NAME = 'ledger-import-check';
const STORE = 'local-data';
let namespace = '';

/** Keep sample work physically separate from a visitor's own browser data. */
export function setStorageNamespace(nextNamespace: string): void {
  namespace = nextNamespace;
}

function databaseName(): string {
  return `${namespace}${REAL_DB_NAME}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(), 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function useStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export const saveDraft = (draft: Draft) => useStore('readwrite', (store) => store.put(draft, 'current'));
export const loadDraft = () => useStore<Draft | undefined>('readonly', (store) => store.get('current'));
export const clearDraft = () => useStore('readwrite', (store) => store.delete('current'));

/** A saved Proof Kit entry is self-contained after the active draft changes. */
export interface ReceiptRecord {
  id: string;
  statement: string;
  checkedAt: string;
  summary: string;
  filename: string;
  receiptText: string;
}

export async function saveReceipt(record: ReceiptRecord): Promise<void> {
  const existing = await loadReceipts();
  const next = [record, ...existing.filter((item) => item.id !== record.id)].slice(0, 50);
  await useStore('readwrite', (store) => store.put(next, 'receipts'));
}

export async function loadReceipts(): Promise<ReceiptRecord[]> {
  return (await useStore<ReceiptRecord[] | undefined>('readonly', (store) => store.get('receipts'))) ?? [];
}
