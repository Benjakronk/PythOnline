// All paths are relative to this module, including on /repository/ Pages sites.
export async function preparePython() {
  if (globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') return true;
  if (!globalThis.isSecureContext || !('serviceWorker' in navigator)) throw new Error('unsupported');
  const url = new URL('./isolation-sw.js', import.meta.url);
  const controlsApp = () => navigator.serviceWorker.controller?.scriptURL === url.href;
  // A controlled page that is still not isolated must show a useful error,
  // rather than repeatedly reloading (for example in an unsupported browser).
  if (controlsApp()) throw new Error('not-isolated');
  await navigator.serviceWorker.register(url, { scope: new URL('./', import.meta.url).pathname, updateViaCache: 'none' });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 15000);
    function cleanup() {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('controllerchange', changed);
    }
    function changed() {
      if (controlsApp()) { cleanup(); resolve(); }
    }
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    changed();
  });
  // The new headers take effect on navigation. Drafts have already been saved.
  location.reload();
  return false;
}
