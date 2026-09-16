import { test, expect } from '@playwright/test';

test('recovers an already controlled tab without deleting its draft', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'github-pages', 'Requires a host without isolation headers');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/app.js*', async route => { await gate; await route.continue(); });
  await page.goto('./', { waitUntil: 'commit' });
  // Reproduce a returning tab already claimed by our worker, but whose
  // original document response did not contain COOP/COEP headers.
  await page.evaluate(async () => {
    localStorage.setItem('pythonline-draft', JSON.stringify({ code: 'print("Saved work")', filename: 'saved.py' }));
    localStorage.setItem('pythonline-language', 'en');
    await navigator.serviceWorker.register('./isolation-sw.js?v=2', { scope: './' });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
  });
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(false);
  release();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90000 });
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  await expect(page.locator('#editor')).toHaveValue('print("Saved work")');
  await expect(page.locator('#language')).toHaveValue('en');
  expect(new URL(page.url()).searchParams.has('python-recovery')).toBe(false);
  await page.locator('#run').click();
  await expect(page.locator('#output')).toContainText('Saved work');
  await page.reload();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90000 });
  await expect(page.locator('#editor')).toHaveValue('print("Saved work")');
});
