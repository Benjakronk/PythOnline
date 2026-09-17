export function setupAppControls(t, showMessage) {
  const fullscreen = document.getElementById('fullscreen');
  const install = document.getElementById('install');
  const standalone = matchMedia('(display-mode: standalone)');
  let installPrompt;
  let installed = false;
  function update() {
    fullscreen.hidden = !document.fullscreenEnabled;
    fullscreen.textContent = t(document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen');
    fullscreen.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
    install.textContent = t('Install app');
    install.hidden = installed || standalone.matches;
  }
  fullscreen.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { showMessage('Could not enter fullscreen. Check your browser permissions.'); }
  };
  document.addEventListener('fullscreenchange', update);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    update();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    installPrompt = undefined;
    update();
  });
  standalone.addEventListener('change', update);
  install.onclick = async () => {
    if (!installPrompt) {
      showMessage('To install, use the install icon in the address bar or the Apps menu in Edge or Chrome. If it is not available yet, wait for Python to load and try again.');
      return;
    }
    const prompt = installPrompt;
    installPrompt = undefined;
    try { await prompt.prompt(); await prompt.userChoice; }
    catch { showMessage('Installation could not start. Try the install option in your browser menu.'); }
  };
  update();
  return update;
}
