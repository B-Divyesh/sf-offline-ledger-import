const SLUG = 'offline-ledger-import';
const API = 'https://api.sociobot.in/api/v1';
let storagePrefix = '';
function key(): string { return `${storagePrefix}sb_license:${SLUG}`; }
function verdictKey(): string { return `${key()}:verdict`; }
const DAY = 86_400_000;

interface Verdict { valid: boolean; checkedAt: number; reason?: string; }

/** Keeps every license artifact inside the demo sandbox when the app is a demo. */
export function setLicenseStoragePrefix(prefix = ''): void { storagePrefix = prefix; }

export function checkoutUrl(): string {
  return `${API}/products/${SLUG}/checkout`;
}

export function captureReturnedLicense(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  localStorage.setItem(key(), token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function storeLicense(token: string): void {
  localStorage.setItem(key(), token.trim());
  localStorage.removeItem(verdictKey());
}

/** Removes only the active namespace's license state. */
export function clearStoredLicense(): void {
  localStorage.removeItem(key());
  localStorage.removeItem(verdictKey());
}

export function cachedLicenseState(): { token: string | null; unlocked: boolean } {
  const token = localStorage.getItem(key());
  if (!token) return { token: null, unlocked: false };
  try {
    const verdict = JSON.parse(localStorage.getItem(verdictKey()) ?? '') as Verdict;
    return { token, unlocked: verdict.valid };
  } catch {
    return { token, unlocked: false };
  }
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason?: string }> {
  const token = localStorage.getItem(key());
  if (!token) return { valid: false, reason: 'missing' };
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(verdictKey()) ?? '') as Verdict;
      if (Date.now() - cached.checkedAt < DAY) return cached;
    } catch { /* verify below */ }
  }
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verify unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(verdictKey(), JSON.stringify(verdict));
    return verdict;
  } catch {
    const cached = cachedLicenseState();
    return { valid: cached.unlocked, reason: 'offline' };
  }
}
