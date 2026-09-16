import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests',
  timeout: 180000,
  use: { browserName: 'chromium' },
  projects: [
    { name: 'local', use: { baseURL: 'http://localhost:3000/' } },
    { name: 'github-pages', use: { baseURL: 'http://localhost:3001/PythOnline/' } },
  ],
  webServer: [
    { command: 'node server.js', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
    { command: 'node server.js --pages', url: 'http://localhost:3001/PythOnline/', reuseExistingServer: !process.env.CI },
  ],
});
