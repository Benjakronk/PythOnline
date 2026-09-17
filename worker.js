// Keep synchronous Python input off the UI thread.
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let python;
let interpreter;
let control;
let bytes;
let pending = '';
let emitted = 0;
let outputLimitMessage = '';
const LIMIT = 100000;
function flush() {
  if (pending) { postMessage({ type: 'output', text: pending }); pending = ''; }
}
function write(buffer) {
  if (emitted < LIMIT) {
    pending += decoder.decode(buffer, { stream: true });
    emitted += buffer.length;
    if (emitted >= LIMIT) pending += outputLimitMessage;
    if (pending.length >= 1024) flush();
  }
  return buffer.length;
}
const decoder = new TextDecoder();
setInterval(flush, 30);
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      control = new Int32Array(data.shared, 0, 2);
      bytes = new Uint8Array(data.shared, 8);
      postMessage({ type: 'progress', message: 'Downloading Python…' });
      importScripts(`${PYODIDE_URL}pyodide.js`);
      python = await loadPyodide({ indexURL: PYODIDE_URL });
      postMessage({ type: 'progress', message: 'Preparing the terminal…' });
      python.setStdout({ write, isatty: true });
      python.setStderr({ write, isatty: true });
      python.setStdin({
        stdin: () => {
          flush();
          Atomics.store(control, 0, 0);
          postMessage({ type: 'input' });
          while (Atomics.load(control, 0) === 0) Atomics.wait(control, 0, 0);
          // TextDecoder requires an ordinary buffer, not a shared-memory view.
          return new TextDecoder().decode(bytes.slice(0, Atomics.load(control, 1))) + '\n';
        },
        isatty: true,
      });
      interpreter = python.runPython('from code import InteractiveConsole\nInteractiveConsole()');
      postMessage({ type: 'ready' });
    } catch (error) { postMessage({ type: 'error', text: String(error) }); }
    return;
  }
  if (!python) return;
  if (data.type === 'reset-buffer') {
    interpreter.resetbuffer();
    postMessage({ type: 'repl-done', more: false });
    return;
  }
  if (!['run', 'repl'].includes(data.type)) return;
  emitted = 0;
  outputLimitMessage = data.outputLimitMessage;
  pending = '';
  if (data.type === 'repl') {
    let more = false;
    let exited = false;
    try { more = interpreter.push(data.code); }
    catch (error) {
      if (error.type === 'SystemExit') exited = true;
      else postMessage({ type: 'output', text: `${error.message}\n` });
      interpreter.resetbuffer();
    }
    flush();
    postMessage({ type: 'repl-done', more, exited });
    return;
  }
  let globals;
  let ok = true;
  try {
    globals = python.toPy({ __name__: '__main__', __file__: data.filename });
    // A new namespace on every run makes the editor behave like a Python script.
    await python.runPythonAsync(data.code, { globals, filename: data.filename });
  } catch (error) {
    ok = false;
    flush();
    postMessage({ type: 'output', text: `${error.message}\n` });
  } finally {
    globals?.destroy();
    flush();
    postMessage({ type: 'done', ok });
  }
};
