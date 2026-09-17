import { test, expect } from '@playwright/test';

test('manifest, installability, fullscreen and translated app controls', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90000 });
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  const data = JSON.parse(manifest.data);
  expect(data.display).toBe('standalone');
  const base = new URL(page.url());
  expect(new URL(data.start_url, manifest.url).pathname).toBe(base.pathname);
  const errors = await cdp.send('Page.getInstallabilityErrors');
  expect(errors.installabilityErrors).toEqual([]);
  for (const icon of data.icons) {
    const dimensions = await page.evaluate(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, new URL(icon.src, manifest.url).href);
    expect(dimensions).toBe(icon.sizes);
  }
  await page.locator('#fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await expect(page.locator('#fullscreen')).toHaveText('Avslutt fullskjerm');
  await page.locator('#fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#fullscreen')).toHaveText('Fullscreen');
  await expect(page.locator('#install')).toHaveText('Install app');
  // The native installation dialog is browser UI; exercise our event handling
  // without actually installing software on the test machine.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => { window.installWasPrompted = true; };
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    dispatchEvent(event);
  });
  await page.locator('#install').click();
  expect(await page.evaluate(() => window.installWasPrompted)).toBe(true);
  await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
  await expect(page.locator('#install')).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
