import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Club Coordinator (CC) Role End-to-End Tests', () => {
  const credentials = { usn: '1GD24CS073', pass: '123456' };

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Automated Failure] Test "${testInfo.title}" failed under CC Role verification. Status: ${testInfo.status}. Expected CC components or event planners failed to render.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit bug report via widget:', reporterError);
      }
    }
  });

  test('TC-CC-01: Login and Load CC Dashboard', async ({ page }) => {
    try {
      await page.goto('/login');
      
      // Log in as CC
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');

      // Wait for redirect to /cc/dashboard
      await page.waitForURL('**/cc/dashboard', { timeout: 10000 });
      
      // Verify CC-specific title or content
      const ccTitle = page.locator('h1').or(page.locator('text=Coordinator')).first();
      await expect(ccTitle).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

  test('TC-CC-02: Verify CC Events Creation & Viewing', async ({ page }) => {
    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/cc/dashboard');

      // Verify CC Dashboard widgets and create button are visible
      const createBtn = page.locator('a:has-text("Create New Event")').first();
      await expect(createBtn).toBeVisible();
      
      const statsSection = page.locator('text=Pipeline').or(page.locator('text=Activity')).first();
      await expect(statsSection).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });
});
