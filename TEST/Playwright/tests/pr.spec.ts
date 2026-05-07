import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Public Relations (PR) Role End-to-End Tests', () => {
  const credentials = { usn: '1GD24CS001', pass: '123456' };

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Automated Failure] Test "${testInfo.title}" failed under PR Role verification. Status: ${testInfo.status}. Scanner or report audits are missing.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit bug report via widget:', reporterError);
      }
    }
  });

  test('TC-PR-01: Login and Load PR Dashboard', async ({ page }) => {
    try {
      await page.goto('/login');
      
      // Log in as PR
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');

      // Wait for redirect to PR dashboard
      await page.waitForURL('**/pr/dashboard', { timeout: 10000 });
      
      // Verify PR específico elements are visible
      const prHeader = page.locator('h1').or(page.locator('text=Public Relations')).first();
      await expect(prHeader).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

  test('TC-PR-02: Verify PR QR Scanner Interface', async ({ page }) => {
    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pr/dashboard');

      // Navigate to /pr/scanner
      await page.goto('/pr/scanner');
      await page.waitForURL('**/pr/scanner');

      // Ensure scanner containers or instructions are there
      const scannerEl = page.locator('text=scanner').or(page.locator('text=Scanner')).first();
      await expect(scannerEl).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

  test('TC-PR-03: Verify PR Post-Event Reports Portal', async ({ page }) => {
    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pr/dashboard');

      // Navigate to /pr/reports
      await page.goto('/pr/reports');
      await page.waitForURL('**/pr/reports');

      const reportsHeading = page.locator('text=Report').or(page.locator('h1, h2')).first();
      await expect(reportsHeading).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });
});
