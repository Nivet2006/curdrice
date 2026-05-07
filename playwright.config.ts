import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './TEST/Playwright/tests',
  outputDir: './TEST/Playwright/test-results',
  fullyParallel: false, // Run tests sequentially to avoid database collision and keep results cleaner
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Sequential workers to ensure smooth session transitions and stable DB updates
  reporter: [
    ['html', { outputFolder: './TEST/Playwright/playwright-report', open: 'never' }],
    ['json', { outputFile: './TEST/Playwright/test-results/report.json' }],
    ['junit', { outputFile: './TEST/Playwright/test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',          // Capture trace for every test
    screenshot: 'on',     // Capture screenshot for every test
    video: 'on',          // Capture video for every test
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  // Start local server automatically if not running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
