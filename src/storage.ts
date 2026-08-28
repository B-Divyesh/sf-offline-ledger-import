import type { Draft } from './types';

const DB_NAME = 'ledger-import-check';
const STORE = 'local-data';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
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

export interface ReceiptRecord { id: string; statement: string; checkedAt: string; summary: string; }

export async function saveReceipt(record: ReceiptRecord): Promise<void> {
  const existing = await loadReceipts();
  const next = [record, ...existing.filter((item) => item.id !== record.id)].slice(0, 50);
  await useStore('readwrite', (store) => store.put(next, 'receipts'));
}

export async function loadReceipts(): Promise<ReceiptRecord[]> {
  return (await useStore<ReceiptRecord[] | undefined>('readonly', (store) => store.get('receipts'))) ?? [];
}
