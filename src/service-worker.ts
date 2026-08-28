/**
 * Watch a registration for a waiting worker. The installing worker must be
 * captured at updatefound time because `registration.installing` is cleared
 * when that worker moves into the waiting state.
 */
export function listenForServiceWorkerUpdate(
  registration: ServiceWorkerRegistration,
  hasController: () => boolean,
  revealUpdate: () => void
): void {
  const announceWaiting = () => { if (registration.waiting) revealUpdate(); };
  announceWaiting();
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && hasController()) revealUpdate();
    });
  });
}
