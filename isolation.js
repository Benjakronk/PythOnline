// All paths are relative to this module, including on /repository/ Pages sites.
export async function preparePython() {
  const isolated = globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined';
  const pageURL = new URL(location.href);
  const recoveryKey = 'python-recovery';
  if (isolated && pageURL.searchParams.has(recoveryKey)) {
    pageURL.searchParams.delete(recoveryKey);
    history.replaceState(null, '', pageURL);
  }
  // Also register on hosts with native headers, for the installed app.
  if (!globalThis.isSecureContext || !('serviceWorker' in navigator)) throw new Error('unsupported');
  const url = new URL('./isolation-sw.js?v=4', import.meta.url);
  const controlsApp = () => navigator.serviceWorker.controller?.scriptURL === url.href;
  // Register even when an older worker controls this tab. Changing the script
  // URL updates this app's registration without removing drafts or other sites.
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
  if (isolated) return true;
  // A claimed tab may still have been loaded without isolation headers.
  // Retry its navigation once, rather than rejecting an existing controller.
  if (pageURL.searchParams.has(recoveryKey)) throw new Error('not-isolated');
  pageURL.searchParams.set(recoveryKey, '1');
  // The new headers take effect on navigation. Drafts have already been saved.
  location.replace(pageURL);
  return false;
}
