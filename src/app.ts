import './styles.css';
import { escapeCsv, importTransactions, parseCsv, parseMoney, suggestMapping } from './csv';
import { reconcile } from './reconcile';
import { clearDraft, loadDraft, loadReceipts, saveDraft, saveReceipt, setStorageNamespace } from './storage';
import { cachedLicenseState, captureReturnedLicense, checkoutUrl, storeLicense, verifyLicense } from './license';
import { listenForServiceWorkerUpdate } from './service-worker';
import type { CheckResult, ColumnMapping, CsvData, Draft } from './types';

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector) as T;
const fileInput = $('#csv-file') as HTMLInputElement;
const backupFileInput = $('#backup-file') as HTMLInputElement;
const mappingForm = $('#mapping-form') as HTMLFormElement;
const mappingSection = $('#mapping-track');
const resultSection = $('#result-track');
const resultStatus = $('#result-status');
const importError = $('#import-error');
const mappingError = $('#mapping-error');
const resetButton = $('#reset-button') as HTMLButtonElement;

let csv: CsvData | null = null;
let csvText = '';
let filename = '';
let sourceHash = 'calculating…';
let sourceHashPromise: Promise<string> = Promise.resolve('unavailable');
let mapping: ColumnMapping | null = null;
let result: CheckResult | null = null;
let includedOverrides: Record<string, boolean> = {};
let proofUnlocked = false;
let deferredInstall: Event | null = null;
const demoMode = location.pathname === '/demo' || location.pathname === '/demo/' || new URLSearchParams(location.search).get('demo') === '1';
setStorageNamespace(demoMode ? 'demo:' : '');

const selectors = {
  date: $('#map-date') as HTMLSelectElement,
  description: $('#map-description') as HTMLSelectElement,
  amount: $('#map-amount') as HTMLSelectElement,
  debit: $('#map-debit') as HTMLSelectElement,
  credit: $('#map-credit') as HTMLSelectElement,
  balance: $('#map-balance') as HTMLSelectElement,
  dateFormat: $('#date-format') as HTMLSelectElement
};

const sampleCsv = `Date,Description,Amount,Running Balance
03/02/2026,Client invoice,800.00,2000.00
03/03/2026,Studio rent,-900.00,1100.00
03/05/2026,Corner coffee,-4.50,1095.50
03/05/2026,Corner coffee,-4.50,1095.50
03/08/2026,Groceries,-65.50,1030.00
03/12/2026,Utilities,-100.00,900.00`;

function show(element: HTMLElement, visible = true): void { element.hidden = !visible; }
function setMessage(element: HTMLElement, message: string): void {
  element.textContent = message;
  show(element, Boolean(message));
}
function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}
function fileSafe(value: string): string {
  return value.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ledger-check';
}
function money(value: number | null, currency = currencyCode()): string {
  if (value == null) return '—';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}
function currencyCode(): string {
  const value = ($('#currency') as HTMLInputElement).value.toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : 'USD';
}
function download(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
async function sha256(contents: string): Promise<string> {
  const bytes = new TextEncoder().encode(contents);
  if (!crypto.subtle) return 'unavailable';
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function setStage(stage: 1 | 2 | 3): void {
  for (let index = 1; index <= 3; index += 1) {
    const item = $(`#stage-${index}`);
    item.classList.toggle('active', index === stage);
    item.classList.toggle('complete', index < stage);
  }
}

function fillSelect(select: HTMLSelectElement, optional: boolean, selected: number): void {
  if (!csv) return;
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '-1';
  placeholder.textContent = optional ? 'Not present' : 'Choose a column…';
  select.append(placeholder);
  csv.headers.forEach((header, index) => {
    const option = document.createElement('option');
    option.value = String(index); option.textContent = header; select.append(option);
  });
  select.value = String(selected);
}

function populateMapping(suggestion: ColumnMapping): void {
  fillSelect(selectors.date, false, suggestion.date);
  fillSelect(selectors.description, false, suggestion.description);
  fillSelect(selectors.amount, false, suggestion.amount);
  fillSelect(selectors.debit, true, suggestion.debit);
  fillSelect(selectors.credit, true, suggestion.credit);
  fillSelect(selectors.balance, true, suggestion.balance);
  selectors.dateFormat.value = suggestion.dateFormat;
  const radio = mappingForm.querySelector<HTMLInputElement>(`input[name="amount-mode"][value="${suggestion.amountMode}"]`);
  if (radio) radio.checked = true;
  updateAmountFields();
  renderPreview();
}

function readMapping(): ColumnMapping {
  const mode = mappingForm.querySelector<HTMLInputElement>('input[name="amount-mode"]:checked')?.value === 'split' ? 'split' : 'signed';
  return {
    date: Number(selectors.date.value), description: Number(selectors.description.value),
    amountMode: mode, amount: Number(selectors.amount.value), debit: Number(selectors.debit.value),
    credit: Number(selectors.credit.value), balance: Number(selectors.balance.value),
    dateFormat: selectors.dateFormat.value as ColumnMapping['dateFormat']
  };
}

function updateAmountFields(): void {
  const split = mappingForm.querySelector<HTMLInputElement>('input[name="amount-mode"]:checked')?.value === 'split';
  show($('#signed-field'), !split);
  document.querySelectorAll<HTMLElement>('.split-field').forEach((field) => show(field, split));
}

function renderPreview(): void {
  if (!csv) return;
  $('#preview-head').innerHTML = `<tr>${csv.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr>`;
  $('#preview-body').innerHTML = csv.rows.slice(0, 3).map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell) || '<span aria-label="empty">—</span>'}</td>`).join('')}</tr>`).join('');
}

async function loadCsv(contents: string, sourceName: string, restoredMapping?: ColumnMapping): Promise<void> {
  try {
    const parsed = parseCsv(contents);
    csv = parsed; csvText = contents; filename = sourceName; result = null; includedOverrides = {};
    sourceHash = 'calculating…';
    sourceHashPromise = sha256(contents).then((hash) => { sourceHash = hash; return hash; });
    mapping = restoredMapping ?? suggestMapping(parsed.headers);
    populateMapping(mapping);
    // Show a loaded sample only after its selected storage namespace accepted it.
    await persistDraft();
    $('#file-status').innerHTML = `<strong>${escapeHtml(sourceName)}</strong> · ${parsed.rows.length.toLocaleString()} rows · ${parsed.headers.length} columns · delimiter ${parsed.delimiter === '\t' ? 'tab' : escapeHtml(parsed.delimiter)}`;
    show($('#file-status')); show(resetButton); show(mappingSection); show(resultSection, false);
    setMessage(importError, ''); setMessage(mappingError, ''); setStage(2);
    mappingSection.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  } catch (error) {
    setMessage(importError, error instanceof Error ? error.message : 'This file could not be read.');
  }
}

async function loadFile(file: File): Promise<void> {
  if (file.size > 20 * 1024 * 1024) {
    setMessage(importError, 'This file is over 20 MB. Split the statement into smaller periods and check each one.');
    return;
  }
  ($('#statement-name') as HTMLInputElement).value = file.name.replace(/\.[^.]+$/, '');
  ($('#opening-balance') as HTMLInputElement).value = '';
  ($('#closing-balance') as HTMLInputElement).value = '';
  await loadCsv(await file.text(), file.name);
}

function buildDraft(): Draft | null {
  if (!csv || !mapping) return null;
  return {
    version: 1, filename, csvText,
    statementName: ($('#statement-name') as HTMLInputElement).value,
    currency: ($('#currency') as HTMLInputElement).value,
    opening: ($('#opening-balance') as HTMLInputElement).value,
    closing: ($('#closing-balance') as HTMLInputElement).value,
    mapping: readMapping(), includedOverrides, savedAt: new Date().toISOString()
  };
}

async function persistDraft(): Promise<void> {
  const draft = buildDraft();
  if (draft) await saveDraft(draft).catch(() => setMessage(importError, 'This browser blocked local draft storage. The checker still works; download a backup before leaving.'));
}

function validateCheck(): { opening: number; closing: number } | null {
  if (!csv) return null;
  mapping = readMapping();
  if (mapping.date < 0 || mapping.description < 0) {
    setMessage(mappingError, 'Choose both the date and description columns.'); return null;
  }
  if (mapping.amountMode === 'signed' && mapping.amount < 0) {
    setMessage(mappingError, 'Choose the signed amount column, or switch to separate debit and credit columns.'); return null;
  }
  if (mapping.amountMode === 'split' && mapping.debit < 0 && mapping.credit < 0) {
    setMessage(mappingError, 'Choose at least one debit or credit column.'); return null;
  }
  const opening = parseMoney(($('#opening-balance') as HTMLInputElement).value);
  const closing = parseMoney(($('#closing-balance') as HTMLInputElement).value);
  if (opening == null || closing == null) {
    setMessage(mappingError, 'Enter valid opening and closing balances, including 0.00 where appropriate.'); return null;
  }
  const code = ($('#currency') as HTMLInputElement).value.trim();
  if (!/^[A-Za-z]{3}$/.test(code)) {
    setMessage(mappingError, 'Use a three-letter currency code such as USD, EUR, or GBP.'); return null;
  }
  setMessage(mappingError, '');
  return { opening, closing };
}

function runCheck(focusResult = true): void {
  const values = validateCheck();
  if (!values || !csv || !mapping) return;
  const imported = importTransactions(csv, mapping);
  result = reconcile(imported, values.opening, values.closing, includedOverrides);
  renderResult();
  show(resultSection); setStage(3); void persistDraft();
  if (focusResult) {
    resultSection.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    resultStatus.focus({ preventScroll: true });
  }
}

function renderResult(): void {
  if (!result) return;
  const candidateCount = result.exactDuplicates + result.possibleDuplicates;
  let title: string;
  let detail: string;
  let kind: 'success' | 'problem' | 'review';
  if (result.reconciled && candidateCount === 0) {
    title = '✓ Balances agree. This track plays clean.';
    detail = `${result.rows.filter((row) => row.included).length} included rows move the opening balance to the supplied closing balance.`;
    kind = 'success';
  } else if (result.reconciled) {
    title = '✓ Balances agree, with repeat rows marked.';
    detail = 'The arithmetic closes. Confirm the highlighted repeat candidates before exporting.';
    kind = 'review';
  } else {
    title = '✕ The balances do not agree yet.';
    detail = 'Review the marked rows, amount signs, date order, and supplied balances. The difference below is what is still unexplained.';
    kind = 'problem';
  }
  resultStatus.className = `result-status ${kind}`;
  resultStatus.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p>`;
  $('#result-meters').innerHTML = [
    ['Source rows', result.rows.length],
    ['Included', result.rows.filter((row) => row.included).length],
    ['Repeat candidates', candidateCount],
    ['Gap changes', result.gapCount],
    ['Unexplained', money(result.closingDifference)]
  ].map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
  const balanceNote = $('#balance-note');
  if (result.hasRunningBalances) {
    balanceNote.innerHTML = result.gapCount
      ? `<strong>${result.gapCount} balance jump${result.gapCount === 1 ? '' : 's'} located.</strong> “Gap starts” marks where the bank’s running balance changes by more than the included rows explain.`
      : '<strong>No running-balance jumps found.</strong> Each reported balance follows from the prior included amount.';
  } else {
    balanceNote.innerHTML = '<strong>No running-balance column was mapped.</strong> The end difference is still checked, but the app cannot locate where a missing row begins.';
  }
  renderRows();
  show($('#archive-receipt'), proofUnlocked);
}

function renderRows(): void {
  if (!result) return;
  const filter = ($('#row-filter') as HTMLSelectElement).value;
  const rows = result.rows.filter((row) => {
    const issue = Boolean(row.error || row.duplicateKind || row.startsGap);
    return filter === 'all' || (filter === 'issues' && issue) || (filter === 'included' && row.included) || (filter === 'excluded' && !row.included);
  });
  $('#row-count').textContent = `${rows.length} of ${result.rows.length} rows shown`;
  $('#result-rows').innerHTML = rows.map((row) => {
    const findings: string[] = [];
    if (row.error) findings.push(`<span class="finding finding-danger">${escapeHtml(row.error)}</span>`);
    if (row.duplicateKind === 'exact') findings.push('<span class="finding finding-warn">Exact repeat</span>');
    if (row.duplicateKind === 'possible') findings.push('<span class="finding finding-warn">Possible repeat</span>');
    if (row.startsGap) findings.push(`<span class="finding finding-danger">Gap starts ${escapeHtml(money(row.discrepancy))}</span>`);
    if (!findings.length) findings.push('<span class="finding finding-ok">Clear</span>');
    const running = row.reportedBalance == null ? 'Not supplied' : `${money(row.reportedBalance)} reported<br><small>${money(row.expectedBalance)} expected</small>`;
    return `<tr data-issue="${Boolean(row.error || row.duplicateKind || row.startsGap)}" data-excluded="${!row.included}" data-invalid="${Boolean(row.error)}">
      <td data-label="Include"><input class="include-check" type="checkbox" data-row-id="${escapeHtml(row.id)}" ${row.included ? 'checked' : ''} ${row.error ? 'disabled' : ''} aria-label="Include ${escapeHtml(row.description || `source row ${row.sourceIndex + 2}`)}" /></td>
      <td data-label="Transaction" class="description-cell"><strong>${escapeHtml(row.date ?? (row.dateRaw || 'Invalid date'))} · ${escapeHtml(row.description || 'No description')}</strong><small>source row ${row.sourceIndex + 2} · fingerprint ${escapeHtml(row.fingerprint)}</small></td>
      <td data-label="Amount" class="money">${escapeHtml(money(row.amount))}</td>
      <td data-label="Balance" class="money">${running}</td>
      <td data-label="Finding">${findings.join(' ')}</td>
    </tr>`;
  }).join('');
  document.querySelectorAll<HTMLInputElement>('.include-check').forEach((checkbox) => checkbox.addEventListener('change', () => {
    includedOverrides[checkbox.dataset.rowId ?? ''] = checkbox.checked;
    runCheck(false);
  }));
}

function cleanedCsv(): string {
  if (!result) return '';
  const lines = [['Date', 'Description', 'Amount', 'Reported balance', 'Source fingerprint'].map(escapeCsv).join(',')];
  result.rows.filter((row) => row.included && !row.error).forEach((row) => lines.push([
    row.date, row.description, row.amount?.toFixed(2), row.reportedBalance?.toFixed(2) ?? '', row.fingerprint
  ].map(escapeCsv).join(',')));
  return `${lines.join('\r\n')}\r\n`;
}

function receiptText(): string {
  if (!result) return '';
  const label = ($('#statement-name') as HTMLInputElement).value.trim() || filename;
  const issueRows = result.rows.filter((row) => row.error || row.duplicateKind || row.startsGap);
  const lines = [
    'LEDGER IMPORT CHECK — RECONCILIATION RECEIPT',
    '================================================',
    `Statement: ${label}`,
    `Source file: ${filename}`,
    `Source SHA-256: ${sourceHash}`,
    `Checked: ${new Date().toISOString()}`,
    `Currency: ${currencyCode()}`,
    '',
    `Opening balance: ${money(result.opening)}`,
    `Included movement: ${money(result.includedTotal)}`,
    `Expected closing: ${money(result.expectedClosing)}`,
    `Supplied closing: ${money(result.closing)}`,
    `Unexplained difference: ${money(result.closingDifference)}`,
    `Status: ${result.reconciled ? 'BALANCES AGREE' : 'REVIEW REQUIRED'}`,
    '',
    `Source rows: ${result.rows.length}`,
    `Included rows: ${result.rows.filter((row) => row.included).length}`,
    `Exact repeats: ${result.exactDuplicates}`,
    `Possible repeats: ${result.possibleDuplicates}`,
    `Running-balance gap changes: ${result.gapCount}`,
    `Invalid rows: ${result.invalidCount}`,
    '', 'MARKED ROWS'
  ];
  if (!issueRows.length) lines.push('None');
  else issueRows.forEach((row) => lines.push(`- source row ${row.sourceIndex + 2}: ${row.dateRaw} | ${row.description} | ${row.amount ?? 'invalid'} | ${[row.error, row.duplicateKind && `${row.duplicateKind} repeat`, row.startsGap && `gap ${row.discrepancy}`].filter(Boolean).join('; ')}`));
  lines.push('', 'METHOD NOTE', 'Exact repeat fingerprint = normalized date + description + amount. Possible repeat = matching description and amount within 3 days. Running-balance gaps compare each reported balance with opening + included movements.', '', 'This is a file-consistency receipt, not an audit or financial, accounting, or tax advice. Statement data was processed locally in the browser.');
  return `${lines.join('\n')}\n`;
}

async function restoreDraft(draft: Draft): Promise<void> {
  if (draft.version !== 1 || typeof draft.csvText !== 'string') throw new Error('That backup is not a Ledger Import Check draft.');
  ($('#statement-name') as HTMLInputElement).value = draft.statementName ?? '';
  ($('#currency') as HTMLInputElement).value = draft.currency || 'USD';
  ($('#opening-balance') as HTMLInputElement).value = draft.opening ?? '';
  ($('#closing-balance') as HTMLInputElement).value = draft.closing ?? '';
  includedOverrides = draft.includedOverrides ?? {};
  await loadCsv(draft.csvText, draft.filename || 'restored.csv', draft.mapping);
  includedOverrides = draft.includedOverrides ?? {};
  if (draft.opening !== '' && draft.closing !== '') runCheck(false);
}

function updateNetworkState(): void { show($('#offline-banner'), !navigator.onLine); }

function focusMainFromSkipLink(event: Event): void {
  event.preventDefault();
  const main = $('#main');
  main.setAttribute('tabindex', '-1');
  main.focus();
  history.replaceState(null, '', '#main');
}

async function renderLicense(): Promise<void> {
  const state = cachedLicenseState();
  proofUnlocked = state.unlocked;
  show($('#license-locked'), !proofUnlocked); show($('#license-unlocked'), proofUnlocked); show($('#receipt-archive'), proofUnlocked);
  show($('#archive-receipt'), proofUnlocked && Boolean(result));
  if (proofUnlocked) {
    const receipts = await loadReceipts().catch(() => []);
    $('#archive-list').innerHTML = receipts.length ? receipts.map((item) => `<li><strong>${escapeHtml(item.statement)}</strong> · <time datetime="${escapeHtml(item.checkedAt)}">${escapeHtml(new Date(item.checkedAt).toLocaleDateString())}</time><br><span>${escapeHtml(item.summary)}</span></li>`).join('') : '<li>No saved receipts yet. Run a check, then choose “Save to Proof Kit.”</li>';
  }
}

fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) void loadFile(file); });
backupFileInput.addEventListener('change', async () => {
  const file = backupFileInput.files?.[0]; if (!file) return;
  try { await restoreDraft(JSON.parse(await file.text()) as Draft); setMessage(importError, ''); }
  catch (error) { setMessage(importError, error instanceof Error ? error.message : 'The backup could not be restored.'); }
  backupFileInput.value = '';
});

const dropZone = $('#drop-zone');
for (const eventName of ['dragenter', 'dragover']) dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); });
for (const eventName of ['dragleave', 'drop']) dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); });
dropZone.addEventListener('drop', (event) => { const file = (event as DragEvent).dataTransfer?.files[0]; if (file) void loadFile(file); });

async function loadSample(): Promise<void> {
  ($('#statement-name') as HTMLInputElement).value = 'Example current account · March 2026';
  ($('#currency') as HTMLInputElement).value = 'USD';
  ($('#opening-balance') as HTMLInputElement).value = '1200.00';
  ($('#closing-balance') as HTMLInputElement).value = '900.00';
  await loadCsv(sampleCsv, 'example-march-2026.csv');
}
$('#sample-button').addEventListener('click', () => { location.assign('/demo'); });
$('#reset-demo').addEventListener('click', async () => {
  await clearDraft();
  await loadSample();
  setMessage($('#demo-status'), 'Sample reset.');
});
$('#start-real').addEventListener('click', async (event) => {
  event.preventDefault();
  await clearDraft();
  location.assign('/');
});
$('.skip-link').addEventListener('click', focusMainFromSkipLink);
mappingForm.addEventListener('change', () => { updateAmountFields(); mapping = readMapping(); void persistDraft(); });
mappingForm.addEventListener('submit', (event) => { event.preventDefault(); runCheck(); });
mappingForm.addEventListener('input', () => { if (csv) void persistDraft(); });
($('#row-filter') as HTMLSelectElement).addEventListener('change', renderRows);

$('#backup-button').addEventListener('click', () => {
  const draft = buildDraft(); if (draft) download(`${fileSafe(filename)}-draft.json`, `${JSON.stringify(draft, null, 2)}\n`, 'application/json');
});
resetButton.addEventListener('click', async () => {
  if (!confirm(`Erase the local draft for “${filename}”? Downloaded files will not be affected.`)) return;
  await clearDraft(); csv = null; result = null; csvText = ''; filename = ''; includedOverrides = {};
  show(mappingSection, false); show(resultSection, false); show($('#file-status'), false); show(resetButton, false); setStage(1); fileInput.value = '';
  $('#import-track').scrollIntoView({ behavior: 'smooth' });
});
$('#export-csv').addEventListener('click', () => download(`${fileSafe(($('#statement-name') as HTMLInputElement).value || filename)}-clean.csv`, cleanedCsv(), 'text/csv;charset=utf-8'));
$('#export-receipt').addEventListener('click', async () => {
  await sourceHashPromise;
  download(`${fileSafe(($('#statement-name') as HTMLInputElement).value || filename)}-receipt.txt`, receiptText(), 'text/plain;charset=utf-8');
});
$('#print-receipt').addEventListener('click', () => window.print());
$('#archive-receipt').addEventListener('click', async () => {
  if (!result || !proofUnlocked) return;
  await sourceHashPromise;
  const statement = ($('#statement-name') as HTMLInputElement).value.trim() || filename;
  await saveReceipt({ id: `${sourceHash.slice(0, 16)}-${result.closing}`, statement, checkedAt: new Date().toISOString(), summary: result.reconciled ? 'Balances agree' : `Review ${money(result.closingDifference)} difference` });
  $('#license-status').textContent = 'Receipt snapshot saved locally.'; await renderLicense();
});

$('#buy-link').setAttribute('href', checkoutUrl());
$('#license-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = ($('#license-token') as HTMLInputElement).value.trim();
  if (!token) return;
  storeLicense(token); $('#license-status').textContent = 'Checking license…';
  const verdict = await verifyLicense(true);
  $('#license-status').textContent = verdict.valid ? 'License verified on this device.' : verdict.reason === 'offline' ? 'Could not reach verification. Reconnect and try again.' : 'That license is not active for this product.';
  await renderLicense();
});

window.addEventListener('online', updateNetworkState); window.addEventListener('offline', updateNetworkState); updateNetworkState();
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstall = event; show($('#install-button')); });
$('#install-button').addEventListener('click', async () => {
  if (!deferredInstall) return;
  const prompt = deferredInstall as Event & { prompt: () => Promise<void> };
  await prompt.prompt(); deferredInstall = null; show($('#install-button'), false);
});

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  try {
    const hadController = Boolean(navigator.serviceWorker.controller);
    const registration = await navigator.serviceWorker.register('/sw.js');
    listenForServiceWorkerUpdate(registration, () => Boolean(navigator.serviceWorker.controller), () => show($('#update-toast')));
    $('#update-button').addEventListener('click', () => { registration.waiting?.postMessage('SKIP_WAITING'); });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !refreshing) { refreshing = true; location.reload(); } });
  } catch {
    show($('#pwa-error'));
  }
}

async function initialize(): Promise<void> {
  if (demoMode) {
    document.title = 'Demo — Ledger Import Check';
    show($('#demo-banner'));
  }
  const returned = captureReturnedLicense();
  if (returned) $('#license-status').textContent = 'Purchase returned. Verifying your license…';
  await renderLicense();
  const tokenState = cachedLicenseState();
  if (tokenState.token && (returned || !tokenState.unlocked)) {
    const verdict = await verifyLicense(returned);
    if (!verdict.valid && verdict.reason !== 'offline') $('#license-status').textContent = 'License no longer active. The free checker remains available.';
    await renderLicense();
  } else if (tokenState.token) {
    void verifyLicense().then(renderLicense);
  }
  const draft = await loadDraft().catch(() => undefined);
  if (draft) {
    try { await restoreDraft(draft); $('#file-status').insertAdjacentHTML('beforeend', ' · <strong>restored from this browser</strong>'); }
    catch { /* leave the clean empty state */ }
  } else if (demoMode) await loadSample();
  await registerServiceWorker();
}

void initialize();
