/* Boat R08 cutting downloads: independent of the 3D renderer. */
(() => {
  'use strict';
  const dialog = document.getElementById('documents');
  if (!dialog) return;
  document.getElementById('docs')?.addEventListener('click', () => { if (!dialog.open) dialog.showModal(); });
  for (const id of ['close-docs', 'close-docs-bottom']) document.getElementById(id)?.addEventListener('click', () => dialog.close());
  if (new URLSearchParams(location.search).get('descargas') === 'corte') {
    if (!dialog.open) dialog.showModal();
    (document.getElementById('download-cut-complete') || document.getElementById('download-cut-package'))?.focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }
})();
