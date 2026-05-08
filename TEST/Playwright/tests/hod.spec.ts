import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Head of Department (HOD) Role End-to-End Tests', () => {
  const credentials = { usn: '1GD12CS001', pass: '123456' };

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Automated Failure] Test "${testInfo.title}" failed under HOD Role verification. Status: ${testInfo.status}. Approvals panel or department summary failed.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit bug report via widget:', reporterError);
      }
    }
  });

  test('TC-HD-01: Login and Load HOD Dashboard', async ({ page }) => {
    try {
      await page.goto('/login');
      
      // Log in as HOD
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');

      // Wait for redirect to HOD dashboard
      await page.waitForURL(/.*\/hod\/dashboard/, { timeout: 15000 });
      
      // Verify HOD dashboard features are visible
      const hodHeader = page.locator('h1').or(page.locator('text=HOD')).first();
      await expect(hodHeader).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

  test('TC-HD-02: Verify HOD Approvals Tab', async ({ page }) => {
    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/hod\/dashboard/, { timeout: 15000 });

      // Navigate to Approvals page
      await page.goto('/hod/approvals');
      await page.waitForURL('**/hod/approvals');

      // Check for approval sections
      const approvalsHeader = page.locator('text=Approval').or(page.locator('h1, h2')).first();
      await expect(approvalsHeader).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });
});
