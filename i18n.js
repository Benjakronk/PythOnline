export const translations = {
  'Code': 'Kode',
  'Workspace': 'Arbeidsområde',
  'Interpreter (>>>)': 'Interaktiv Python (>>>)',
  'Downloading Python…': 'Laster ned Python…',
  'Preparing the terminal…': 'Klargjør terminalen…',
  'Preparing Python. Run code becomes available when loading finishes.': 'Klargjør Python. Kjør kode blir tilgjengelig når innlastingen er ferdig.',
  'Python is still loading. The first visit can take up to 90 seconds. Keep this tab open.': 'Python lastes fortsatt. Første besøk kan ta opptil 90 sekunder. Hold denne fanen åpen.',
  'Could not prepare Python in this browser. Open the site directly over HTTPS, allow service workers, and try again.': 'Kunne ikke klargjøre Python i denne nettleseren. Åpne nettstedet direkte med HTTPS, tillat service workers og prøv igjen.',
  'PythOnline · Your Python workspace': 'PythOnline · Ditt Python-verksted',
  'CLASSROOM': 'KLASSEROM',
  'Runs in your browser': 'Kjører i nettleseren',
  'A LITTLE CODE. ENDLESS POSSIBILITIES.': 'LITT KODE. UENDELIGE MULIGHETER.',
  'Your next idea starts here.': 'Din neste idé starter her.',
  'Write Python, open a file, and see what happens. No installation needed.': 'Skriv Python, åpne en fil og se hva som skjer. Ingen installasjon nødvendig.',
  '↻ Load example': '↻ Last inn eksempel',
  'Your code': 'Koden din',
  '↑ Open .py': '↑ Åpne .py',
  '↓ Save': '↓ Lagre',
  'Python code': 'Python-kode',
  'to run': 'for å kjøre',
  'Clear': 'Tøm',
  'Python output': 'Utdata fra Python',
  'Program input': 'Svar til programmet',
  'Type your answer and press Enter': 'Skriv svaret ditt og trykk Enter',
  'Send ↵': 'Send ↵',
  'Loading Python…': 'Laster Python…',
  'Getting your workspace ready. The first load can take a moment.': 'Gjør klart arbeidsområdet ditt. Første innlasting kan ta litt tid.',
  'Retry loading': 'Prøv igjen',
  '■ Stop': '■ Stopp',
  '▶ Run code': '▶ Kjør kode',
  'Quick guide': 'Hurtigveiledning',
  'Bring your own code': 'Ta med din egen kode',
  'Open a .py file or drop one into the editor.': 'Åpne en .py-fil eller dra den inn i kodefeltet.',
  'A conversation with your code': 'En samtale med koden din',
  'When your program asks a question, answer in the terminal.': 'Når programmet stiller et spørsmål, svarer du i terminalen.',
  'Make yourself at home': 'Ta vare på arbeidet ditt',
  'Your code is saved in this browser. Download a copy to keep.': 'Koden lagres i denne nettleseren. Last ned en kopi for å ta vare på den.',
  'Made for learning, one line at a time.': 'Laget for læring, én linje om gangen.',
  'Python, minus the setup.': 'Python, uten oppsettet.',
  'Language': 'Språk',
  'line': 'linje',
  'lines': 'linjer',
  'Browser storage is unavailable. Use Save to keep your code.': 'Nettleserlagring er utilgjengelig. Bruk Lagre for å ta vare på koden.',
  'Could not start Python': 'Kunne ikke starte Python',
  'Check your connection and try loading Python again.': 'Sjekk nettilkoblingen og prøv å laste Python på nytt.',
  'This page needs a secure connection and isolation headers. Start it with npm start on localhost, or use the hosting instructions in README.md.': 'Siden trenger en sikker tilkobling og isolasjonshoder. Start den med npm start på localhost, eller følg veiledningen i README.md.',
  'Python took too long to load. The school network may be blocking cdn.jsdelivr.net.': 'Det tok for lang tid å laste Python. Skolens nettverk kan blokkere cdn.jsdelivr.net.',
  'The Python worker could not load. Check your connection or hosting configuration.': 'Kunne ikke laste Python. Sjekk nettilkoblingen eller oppsettet for nettstedet.',
  'Ready': 'Klar',
  'All set. Run your code whenever you’re ready.': 'Alt er klart. Kjør koden når du er klar.',
  'Waiting for your answer': 'Venter på svaret ditt',
  'Finished': 'Ferdig',
  'Check your code': 'Sjekk koden din',
  '\n✓ Program finished.\n': '\n✓ Programmet er ferdig.\n',
  '\nFix the error above and try again.\n': '\nRett feilen over og prøv igjen.\n',
  'Running…': 'Kjører…',
  '\n■ Program stopped. Restarting Python…\n': '\n■ Programmet er stoppet. Starter Python på nytt…\n',
  'That answer is too long. Please use fewer than 65,536 bytes.': 'Svaret er for langt. Bruk færre enn 65 536 byte.',
  'Choose a Python file ending in .py.': 'Velg en Python-fil som slutter på .py.',
  'Please choose a .py file smaller than 1 MB.': 'Velg en .py-fil som er mindre enn 1 MB.',
  'Replace the code in the editor? Save a copy first if you want to keep it.': 'Vil du erstatte koden i kodefeltet? Lagre en kopi først hvis du vil beholde den.',
  'Opened {filename}. Ready to explore.': 'Åpnet {filename}. Klar til å utforske.',
  'Could not read that file. Please try again.': 'Kunne ikke lese filen. Prøv igjen.',
  'Replace your code with the example? Save a copy first if you want to keep it.': 'Vil du erstatte koden din med eksemplet? Lagre en kopi først hvis du vil beholde den.',
  'Welcome to your Python terminal.\nYour program’s output will appear here.\n': 'Velkommen til Python-terminalen din.\nUtdata fra programmet vises her.\n',
  '\n[Output limit reached. Use Stop if your program keeps running.]\n': '\n[Grensen for utdata er nådd. Bruk Stopp hvis programmet fortsetter å kjøre.]\n',
};

export let language = 'nb';
try {
  if (localStorage.getItem('pythonline-language') === 'en') language = 'en';
} catch { /* Norwegian is the default when storage is unavailable. */ }

export function t(key, values = {}) {
  const text = language === 'nb' ? (translations[key] ?? key) : key;
  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

export function setLanguage(value) {
  language = value === 'en' ? 'en' : 'nb';
  try { localStorage.setItem('pythonline-language', language); } catch { /* Still switch for this visit. */ }
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  for (const attribute of ['aria-label', 'placeholder']) {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
      element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
    });
  }
  document.getElementById('language').value = language;
}

export const examples = {
  nb: `# Din første samtale med Python
# Trykk Kjør kode, og svar i terminalen.

navn = input("Hva heter du? ")
print(f"Hei, {navn}! 👋")

print("La oss lage noe sammen.")
for nummer in range(1, 4):
    print(f"  {nummer}. Skriv, kjør, utforsk!")
`,
  en: `# Your first conversation with Python
# Press Run code, then answer in the terminal.

name = input("What's your name? ")
print(f"Hello, {name}! 👋")

print("Let's make something together.")
for number in range(1, 4):
    print(f"  {number}. Write, run, explore!")
`,
};
