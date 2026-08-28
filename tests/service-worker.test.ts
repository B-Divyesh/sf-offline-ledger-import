import { expect, test } from 'vitest';
import { listenForServiceWorkerUpdate } from '../src/service-worker';

test('reveals an update after installing becomes waiting even when registration.installing is cleared @regression:sw-update', () => {
  let state: ServiceWorkerState = 'installing';
  const worker = new EventTarget() as ServiceWorker;
  Object.defineProperty(worker, 'state', { get: () => state });
  const registration = new EventTarget() as ServiceWorkerRegistration;
  Object.defineProperty(registration, 'installing', { value: worker, writable: true });
  Object.defineProperty(registration, 'waiting', { value: null, writable: true });
  let revealed = 0;

  listenForServiceWorkerUpdate(registration, () => true, () => { revealed += 1; });
  registration.dispatchEvent(new Event('updatefound'));
  // This reproduces the browser transition that broke the old implementation.
  (registration as unknown as { installing: ServiceWorker | null }).installing = null;
  state = 'installed';
  worker.dispatchEvent(new Event('statechange'));

  expect(revealed).toBe(1);
});
