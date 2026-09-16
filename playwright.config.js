import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests',
  timeout: 180000,
  use: { baseURL: 'http://localhost:3000', browserName: 'chromium' },
  webServer: { command: 'node server.js', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
});
