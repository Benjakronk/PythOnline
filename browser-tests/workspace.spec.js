import { test, expect } from '@playwright/test';

for (const language of ['nb', 'en']) {
test(`${language}: run, input, file loading, download, autosave, errors, and stop`, async ({ page }) => {
  await page.goto('./');
  // On a headerless static host, the first visit installs a service worker
  // and reloads once before Python becomes ready.
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
  await expect(page.locator('#run')).toContainText('Kjør kode');
  await page.locator('#language').selectOption(language);
  const run = page.locator('#run');
  const editor = page.locator('#editor');
  const output = page.locator('#output');
  const input = page.locator('#terminal-input');
  await expect(run).toBeEnabled({ timeout: 90000 });
  await run.click();
  await expect(input).toBeVisible();
  await input.fill('Bjørn 👋');
  await input.press('Enter');
  await expect(output).toContainText(language === 'nb' ? 'Hei, Bjørn 👋!' : 'Hello, Bjørn 👋!');
  await expect(page.locator('#status')).toHaveText(language === 'nb' ? 'Ferdig' : 'Finished');
  await expect(run).toBeEnabled();
  await editor.fill('first = input("First: ")\nsecond = input("Second: ")\nprint(repr(first), second)');
  await run.click();
  await expect(input).toBeVisible();
  await input.press('Enter');
  await expect(output).toContainText('Second:');
  await input.fill('42');
  await input.press('Enter');
  await expect(output).toContainText("'' 42");
  await expect(run).toBeEnabled();
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('#file-input').setInputFiles({ name: 'lesson.py', mimeType: 'text/x-python', buffer: Buffer.from('print("Loaded from a file")') });
  await expect(editor).toHaveValue('print("Loaded from a file")');
  await page.locator('#language').selectOption(language === 'nb' ? 'en' : 'nb');
  await expect(editor).toHaveValue('print("Loaded from a file")');
  await page.locator('#language').selectOption(language);
  await run.click();
  await expect(output).toContainText('Loaded from a file');
  const download = page.waitForEvent('download');
  await page.locator('#save').click();
  expect((await download).suggestedFilename()).toBe('lesson.py');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('#language')).toHaveValue(language);
  await expect(page.locator('#run')).toContainText(language === 'nb' ? 'Kjør kode' : 'Run code');
  await expect(editor).toHaveValue('print("Loaded from a file")');
  await expect(run).toBeEnabled({ timeout: 90000 });
  await editor.fill('1 / 0');
  await run.click();
  await expect(output).toContainText('ZeroDivisionError');
  await expect(run).toBeEnabled();
  await editor.fill('while True:\n    pass');
  await run.click();
  await page.locator('#stop').click();
  await expect(output).toContainText(language === 'nb' ? 'Programmet er stoppet' : 'Program stopped');
  await expect(run).toBeEnabled({ timeout: 90000 });
  await editor.fill('print("Recovered")');
  await run.click();
  await expect(output).toContainText('Recovered');
  await page.screenshot({ path: `test-results/workspace-${language}.png`, fullPage: true });
});
}
