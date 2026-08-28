const heading = document.querySelector<HTMLElement>('main h1');
const announce = document.querySelector<HTMLElement>('#route-announcement');

// A full-document navigation still deserves a clear keyboard and screen-reader destination.
if (heading) {
  heading.tabIndex = -1;
  requestAnimationFrame(() => {
    heading.focus({ preventScroll: true });
    if (announce) announce.textContent = `${document.title}.`;
  });
}
