import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Faculty Role End-to-End Tests', () => {
  const credentials = { usn: '1GD24CS008', pass: '123456' };

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Automated Failure] Test "${testInfo.title}" failed under Faculty Role verification. Status: ${testInfo.status}. Verify dashboard panels, report structures or routing limits.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit bug report via widget:', reporterError);
      }
    }
  });

  test('TC-FC-01: Login and Load Faculty Dashboard', async ({ page }) => {
    try {
      await page.goto('/login');
      
      // Log in as Faculty
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');

      // Wait for redirect to teacher/faculty dashboard
      await page.waitForURL('**/teacher/dashboard', { timeout: 10000 });
      
      // Verify faculty specific elements (e.g. Header, Faculty dashboard title)
      const dashboardTitle = page.locator('h1').or(page.locator('text=Faculty')).first();
      await expect(dashboardTitle).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

  test('TC-FC-02: Verify Faculty Reports Board', async ({ page }) => {
    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/dashboard');

      // Navigate to reports section
      await page.goto('/teacher/reports');
      await page.waitForURL('**/teacher/reports');

      // Verify page loaded successfully
      const reportsHeading = page.locator('text=Report').or(page.locator('h1, h2')).first();
      await expect(reportsHeading).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

});
