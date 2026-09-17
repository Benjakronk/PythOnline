import { t, language, setLanguage, examples } from './i18n.js?v=4';
import { preparePython } from './isolation.js?v=4';
import { setupAppControls } from './pwa.js?v=4';
const $ = (id) => document.getElementById(id);
const example = examples[language];
const editor = $('editor');
let filename = 'hello.py';
let worker;
let shared;
let state = 'loading';
let timer;
let slowLoadTimer;
let statusKey = 'Loading Python…';
let hintKey = 'Getting your workspace ready. The first load can take a moment.';
let hintValues = {};
let more = false;
const history = [];
let historyIndex = 0;
let historyDraft = '';
function selectTab(name, focus = false) {
  for (const tab of ['code', 'terminal']) {
    const selected = name === tab;
    $(`${tab}-tab`).setAttribute('aria-selected', String(selected));
    $(`${tab}-tab`).tabIndex = selected ? 0 : -1;
    $(`${tab}-panel`).hidden = !selected;
  }
  if (focus) $(`${name}-tab`).focus();
  else if (name === 'terminal' && !$('input-form').hidden) $('terminal-input').focus();
}
for (const tab of ['code', 'terminal']) {
  $(`${tab}-tab`).onclick = () => selectTab(tab);
  $(`${tab}-tab`).onkeydown = (event) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      selectTab(event.key === 'Home' ? 'code' : event.key === 'End' ? 'terminal' : tab === 'code' ? 'terminal' : 'code', true);
    }
  };
}
function updatePrompt() {
  $('input-form').hidden = state !== 'input' && !(state === 'ready' && $('interpreter').checked);
  $('prompt').textContent = state === 'input' ? '›' : more ? '...' : '>>>';
  $('interpreter').disabled = ['running', 'input'].includes(state);
}
$('interpreter').onchange = () => {
  updatePrompt();
  if ($('interpreter').checked) $('terminal-input').focus();
};
$('terminal-body').addEventListener('click', (event) => {
  if (event.target.closest('button, input') || window.getSelection().toString()) return;
  if (!$('input-form').hidden) $('terminal-input').focus();
});
function setHint(key, values = {}) {
  hintKey = key;
  hintValues = values;
  $('hint').textContent = t(key, values);
  // Keep ordinary success/loading messages out of the workspace.
  $('hint').hidden = !key || ['All set.', 'Preparing Python.', 'Opened '].some(prefix => key.startsWith(prefix));
}
try {
  const saved = JSON.parse(localStorage.getItem('pythonline-draft'));
  editor.value = saved?.code ?? example;
  filename = saved?.filename ?? filename;
} catch { editor.value = example; }

function updateEditor() {
  const count = editor.value.split('\n').length;
  $('line-numbers').textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
  $('line-count').textContent = `${count} ${t(count === 1 ? 'line' : 'lines')}`;
  $('filename').textContent = filename;
  try { localStorage.setItem('pythonline-draft', JSON.stringify({ code: editor.value, filename })); }
  catch { setHint('Browser storage is unavailable. Use Save to keep your code.'); }
}
function append(text) {
  $('output').textContent = ($('output').textContent + text).slice(-100000);
  $('terminal-body').scrollTop = $('terminal-body').scrollHeight;
}
function setState(next, label) {
  state = next;
  statusKey = label;
  $('status').textContent = t(label);
  $('run').disabled = next !== 'ready';
  $('run').textContent = t(next === 'loading' ? 'Loading Python…' : '▶ Run code');
  $('stop').disabled = !['running', 'input'].includes(next);
  $('retry').hidden = next !== 'error';
  updatePrompt();
}
function fail(message) {
  clearTimeout(timer);
  clearTimeout(slowLoadTimer);
  worker?.terminate();
  setState('error', 'Could not start Python');
  append(`\n${t(message)}\n`);
  setHint('Check your connection and try loading Python again.');
}
async function startWorker() {
  worker?.terminate();
  clearTimeout(timer);
  clearTimeout(slowLoadTimer);
  setState('loading', 'Loading Python…');
  more = false;
  setHint('Preparing Python. Run code becomes available when loading finishes.');
  slowLoadTimer = setTimeout(() => {
    if (state === 'loading') setHint('Python is still loading. The first visit can take up to 90 seconds. Keep this tab open.');
  }, 15000);
  try {
    if (!await preparePython()) return;
  } catch {
    fail('Could not prepare Python in this browser. Open the site directly over HTTPS, allow service workers, and try again.');
    return;
  }
  try {
    shared = new SharedArrayBuffer(65544);
    worker = new Worker('worker.js?v=3');
  } catch {
    fail('The Python worker could not load. Check your connection or hosting configuration.');
    return;
  }
  timer = setTimeout(() => fail('Python took too long to load. The school network may be blocking cdn.jsdelivr.net.'), 90000);
  worker.onerror = () => fail('The Python worker could not load. Check your connection or hosting configuration.');
  worker.onmessage = ({ data }) => {
    if (data.type === 'ready') {
      clearTimeout(timer);
      clearTimeout(slowLoadTimer);
      setState('ready', 'Ready');
      setHint('All set. Run your code whenever you’re ready.');
    } else if (data.type === 'progress') {
      statusKey = data.message;
      $('status').textContent = t(statusKey);
    } else if (data.type === 'output') append(data.text);
    else if (data.type === 'input') {
      selectTab('terminal');
      setState('input', 'Waiting for your answer');
      $('terminal-input').value = '';
      $('terminal-input').focus();
      $('terminal-body').scrollTop = $('terminal-body').scrollHeight;
    } else if (data.type === 'done') {
      setState('ready', data.ok ? 'Finished' : 'Check your code');
      append(t(data.ok ? '\n✓ Program finished.\n' : '\nFix the error above and try again.\n'));
    } else if (data.type === 'repl-done') {
      more = data.more;
      if (data.exited) $('interpreter').checked = false;
      $('terminal-input').value = '';
      setState('ready', 'Ready');
      if ($('interpreter').checked) $('terminal-input').focus();
    } else if (data.type === 'error') fail(data.text);
  };
  worker.postMessage({ type: 'init', shared });
}
function run() {
  if (state !== 'ready') return;
  selectTab('terminal');
  setHint('');
  $('output').textContent = `› python ${filename}\n\n`;
  setState('running', 'Running…');
  worker.postMessage({ type: 'run', code: editor.value, filename, outputLimitMessage: t('\n[Output limit reached. Use Stop if your program keeps running.]\n') });
}
$('run').onclick = run;
$('stop').onclick = () => {
  append(t('\n■ Program stopped. Restarting Python…\n'));
  startWorker();
};
$('retry').onclick = startWorker;
$('clear').onclick = () => { $('output').textContent = ''; };
$('input-form').onsubmit = (event) => {
  event.preventDefault();
  if (state === 'ready' && $('interpreter').checked) {
    const code = $('terminal-input').value;
    append(`${more ? '...' : '>>>'} ${code}\n`);
    if (code.trim()) history.push(code);
    historyIndex = history.length;
    historyDraft = '';
    $('terminal-input').value = '';
    setState('running', 'Running…');
    worker.postMessage({ type: 'repl', code, outputLimitMessage: t('\n[Output limit reached. Use Stop if your program keeps running.]\n') });
    return;
  }
  if (state !== 'input') return;
  const text = $('terminal-input').value;
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > shared.byteLength - 8) { setHint('That answer is too long. Please use fewer than 65,536 bytes.'); return; }
  new Uint8Array(shared, 8).set(bytes);
  const control = new Int32Array(shared, 0, 2);
  Atomics.store(control, 1, bytes.length);
  append(`${text}\n`);
  setState('running', 'Running…');
  Atomics.store(control, 0, 1);
  Atomics.notify(control, 0);
};
$('terminal-input').addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === 'c' && !window.getSelection().toString()) {
    event.preventDefault();
    if (state === 'input') $('stop').click();
    else if (state === 'ready' && $('interpreter').checked) {
      append(`${more ? '...' : '>>>'} ${$('terminal-input').value}\nKeyboardInterrupt\n`);
      setState('running', 'Running…');
      worker.postMessage({ type: 'reset-buffer' });
    }
  }
  if (state !== 'ready' || !$('interpreter').checked) return;
  if (event.key === 'Tab') {
    event.preventDefault();
    const input = event.target;
    input.setRangeText('    ', input.selectionStart, input.selectionEnd, 'end');
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    if (historyIndex === history.length) historyDraft = event.target.value;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    event.target.value = historyIndex === history.length ? historyDraft : history[historyIndex];
  }
});
editor.addEventListener('input', updateEditor);
editor.addEventListener('scroll', () => { $('line-numbers').scrollTop = editor.scrollTop; });
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end');
    updateEditor();
  }
});
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); }
});
$('open').onclick = () => $('file-input').click();
async function openFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.py')) { setHint('Choose a Python file ending in .py.'); return; }
  if (file.size > 1000000) { setHint('Please choose a .py file smaller than 1 MB.'); return; }
  if (!Object.values(examples).includes(editor.value) && editor.value.trim() && !confirm(t('Replace the code in the editor? Save a copy first if you want to keep it.'))) return;
  try {
    const code = await file.text();
    editor.value = code.replace(/^\uFEFF/, '');
    filename = file.name;
    updateEditor();
    selectTab('code');
    setHint('Opened {filename}. Ready to explore.', { filename });
  } catch { setHint('Could not read that file. Please try again.'); }
}
$('file-input').onchange = async (event) => { await openFile(event.target.files[0]); event.target.value = ''; };
const dropzone = document.querySelector('.editor-wrap');
dropzone.addEventListener('dragover', (event) => { event.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); openFile(event.dataTransfer.files[0]); });
$('save').onclick = () => {
  const url = URL.createObjectURL(new Blob([editor.value], { type: 'text/x-python;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('language').addEventListener('change', (event) => {
  const wasExample = Object.values(examples).includes(editor.value);
  setLanguage(event.target.value);
  if (wasExample && !['running', 'input'].includes(state)) editor.value = examples[language];
  setState(state, statusKey);
  setHint(hintKey, hintValues);
  updateEditor();
  updateAppControls();
});
setLanguage(language);
const updateAppControls = setupAppControls(t, setHint);
updateEditor();
startWorker();
