import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/demoGallery.test.js', '**/socrataClient.test.js'],
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node scripts/dev-server.js',
    port: 4173,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
