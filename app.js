const $ = (id) => document.getElementById(id);
const example = `# Your first conversation with Python\n# Press Run code, then answer in the terminal.\n\nname = input("What's your name? ")\nprint(f"Hello, {name}! 👋")\n\nprint("Let's make something together.")\nfor number in range(1, 4):\n    print(f"  {number}. Write, run, explore!")\n`;
const editor = $('editor');
let filename = 'hello.py';
let worker;
let shared;
let state = 'loading';
let timer;
try {
  const saved = JSON.parse(localStorage.getItem('pythonline-draft'));
  editor.value = saved?.code ?? example;
  filename = saved?.filename ?? filename;
} catch { editor.value = example; }

function updateEditor() {
  const count = editor.value.split('\n').length;
  $('line-numbers').textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
  $('line-count').textContent = `${count} ${count === 1 ? 'line' : 'lines'}`;
  $('filename').textContent = filename;
  try { localStorage.setItem('pythonline-draft', JSON.stringify({ code: editor.value, filename })); }
  catch { $('hint').textContent = 'Browser storage is unavailable. Use Save to keep your code.'; }
}
function append(text) {
  $('output').textContent = ($('output').textContent + text).slice(-100000);
  $('terminal-body').scrollTop = $('terminal-body').scrollHeight;
}
function setState(next, label) {
  state = next;
  $('status').textContent = label;
  $('run').disabled = next !== 'ready';
  $('stop').disabled = !['running', 'input'].includes(next);
  $('retry').hidden = next !== 'error';
  $('input-form').hidden = next !== 'input';
}
function fail(message) {
  clearTimeout(timer);
  worker?.terminate();
  setState('error', 'Could not start Python');
  append(`\n${message}\n`);
  $('hint').textContent = 'Check your connection and try loading Python again.';
}
function startWorker() {
  worker?.terminate();
  setState('loading', 'Loading Python…');
  if (!crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
    fail('This page needs a secure connection and isolation headers. Start it with npm start on localhost, or use the hosting instructions in README.md.');
    return;
  }
  shared = new SharedArrayBuffer(65544);
  worker = new Worker('worker.js');
  timer = setTimeout(() => fail('Python took too long to load. The school network may be blocking cdn.jsdelivr.net.'), 90000);
  worker.onerror = () => fail('The Python worker could not load. Check your connection or hosting configuration.');
  worker.onmessage = ({ data }) => {
    if (data.type === 'ready') {
      clearTimeout(timer);
      setState('ready', 'Ready');
      $('hint').textContent = 'All set. Run your code whenever you’re ready.';
    } else if (data.type === 'output') append(data.text);
    else if (data.type === 'input') {
      setState('input', 'Waiting for your answer');
      $('terminal-input').value = '';
      $('terminal-input').focus();
      $('terminal-body').scrollTop = $('terminal-body').scrollHeight;
    } else if (data.type === 'done') {
      setState('ready', data.ok ? 'Finished' : 'Check your code');
      append(data.ok ? '\n✓ Program finished.\n' : '\nFix the error above and try again.\n');
    } else if (data.type === 'error') fail(data.text);
  };
  worker.postMessage({ type: 'init', shared });
}
function run() {
  if (state !== 'ready') return;
  $('output').textContent = `› python ${filename}\n\n`;
  setState('running', 'Running…');
  worker.postMessage({ type: 'run', code: editor.value, filename });
}
$('run').onclick = run;
$('stop').onclick = () => {
  append('\n■ Program stopped. Restarting Python…\n');
  startWorker();
};
$('retry').onclick = startWorker;
$('clear').onclick = () => { $('output').textContent = ''; };
$('input-form').onsubmit = (event) => {
  event.preventDefault();
  if (state !== 'input') return;
  const text = $('terminal-input').value;
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > shared.byteLength - 8) { $('hint').textContent = 'That answer is too long. Please use fewer than 65,536 bytes.'; return; }
  new Uint8Array(shared, 8).set(bytes);
  const control = new Int32Array(shared, 0, 2);
  Atomics.store(control, 1, bytes.length);
  append(`${text}\n`);
  setState('running', 'Running…');
  Atomics.store(control, 0, 1);
  Atomics.notify(control, 0);
};
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
  if (!file.name.toLowerCase().endsWith('.py')) { $('hint').textContent = 'Choose a Python file ending in .py.'; return; }
  if (file.size > 1000000) { $('hint').textContent = 'Please choose a .py file smaller than 1 MB.'; return; }
  if (editor.value !== example && editor.value.trim() && !confirm('Replace the code in the editor? Save a copy first if you want to keep it.')) return;
  try {
    const code = await file.text();
    editor.value = code.replace(/^\uFEFF/, '');
    filename = file.name;
    updateEditor();
    $('hint').textContent = `Opened ${filename}. Ready to explore.`;
  } catch { $('hint').textContent = 'Could not read that file. Please try again.'; }
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
$('example').onclick = () => {
  if (editor.value !== example && editor.value.trim() && !confirm('Replace your code with the example? Save a copy first if you want to keep it.')) return;
  editor.value = example;
  filename = 'hello.py';
  updateEditor();
};
updateEditor();
append('Welcome to your Python terminal.\nYour program’s output will appear here.\n');
startWorker();
