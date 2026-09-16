# PythOnline

A small classroom Python workspace. Students can edit code, open or drop a UTF-8 `.py` file, run it, answer `input()` prompts in the terminal, and download their work. Drafts stay in local browser storage. Python runs in a web worker using [Pyodide](https://pyodide.org/en/stable/usage/webworker.html), with [standard streams](https://pyodide.org/en/stable/usage/streams.html) connected to the terminal.

## Preview on your computer

The interface defaults to Norwegian Bokmål. Use the language selector in the header to switch to English; the browser remembers the choice. Labels, help, status messages, and the starter example are translated. Switching languages preserves student code and terminal history. Python's own error messages and program output remain in their original language.

Install Node.js 22 or newer, then run:

```sh
npm start
```

Open http://localhost:3000. No npm dependencies or Python installation are needed. The first visit downloads Python from cdn.jsdelivr.net, so internet access is required. Fonts also load from Google Fonts, with local fallbacks.

## Share with students

### GitHub Pages

1. Push the updated project to your GitHub repository, including `isolation.js`, `isolation-sw.js`, and `.nojekyll`.
2. In **Settings → Pages**, select **Deploy from a branch**, choose the branch containing the files and **/(root)**, and save. No build command or Node server is needed.
3. Open the published HTTPS URL, for example `https://username.github.io/PythOnline/`.

GitHub Pages does not supply the isolation headers required by interactive input. The included service worker adds them in the browser. On the first visit, the site reloads once automatically, then starts Python. Relative paths support both repository subdirectories and custom domains. The service worker does not cache the website files. Use a modern browser with service workers enabled, and open the site directly rather than embedding it in another page.

### Other static hosts

Returning tabs automatically update the app's service worker. If a tab was claimed before isolation headers took effect, startup retries navigation once. The recovery preserves local drafts and language preferences. When deploying this update to an older installation, opening the Pages URL with `?v=2` once also bypasses a stale cached HTML page.

Host `index.html`, `style.css`, `app.js`, `i18n.js`, `worker.js`, `isolation.js`, and `isolation-sw.js` together on an HTTPS static host. Students only need the website URL and a modern browser. Netlify and Cloudflare Pages can use the included `_headers` file; publish this directory with no build command. Hosts that support custom headers can set these for the site and worker, avoiding the first-visit reload:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers enable the shared memory used for interactive terminal input. When headers are absent, the service worker provides them. Opening the HTML directly or using plain HTTP on a school network address will not work. The included Node server sets the headers for localhost development; a public Node deployment needs HTTPS through its host or reverse proxy.

## Scope

- Designed for standard-library exercises, loops, functions, and terminal input/output. This is a program terminal, not a PowerShell shell or an interactive Python REPL.
- Desktop GUI libraries (such as tkinter), subprocesses, and arbitrary native Python packages are not supported. Additional third-party packages are not automatically installed.
- Programs use a virtual filesystem, without direct access to the student's disk. Open loads one script into the editor; it does not upload a whole project or accompanying data files.
- Stop terminates the worker and reloads Python, including when code is waiting for input or running an infinite loop. New runs have fresh script variables, but imported module state and virtual files may persist until Stop/reload.
- Browser drafts are per device and browser, may be cleared, and are not accounts or cloud backups. Save downloads a `.py` copy.
- Output is limited to keep accidental print loops from overwhelming the page. Individual input answers are limited to 65,536 UTF-8 bytes.

## Checks

```sh
npm test
```

For the end-to-end browser check, run `npm install`, `npx playwright install chromium`, then `npm run test:browser`. Playwright is only a development dependency; the website itself needs no npm packages.

The browser tests run both with server headers and with a GitHub Pages simulation (no isolation headers, hosted under `/PythOnline/`). To preview the latter manually, run `node server.js --pages` and open http://localhost:3001/PythOnline/.
