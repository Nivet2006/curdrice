import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Student Role End-to-End Tests', () => {
  const credentials = { usn: '1GD24CS006', pass: '123456' };

  test.afterEach(async ({ page }, testInfo) => {
    // If a test fails, capture the error and automatically submit a bug report via the widget!
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Automated Failure] Test "${testInfo.title}" failed under Student Role verification. Status: ${testInfo.status}. Expected elements or route failed to resolve.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit bug report via widget:', reporterError);
      }
    }
  });

  test('TC-ST-01: Login and Load Student Dashboard', async ({ page }) => {
    try {
      // 1. Navigate to login
      await page.goto('/login');
      await expect(page).toHaveTitle(/Club-Eve/i);

      // 2. Fill in student credentials
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');

      // 3. Verify Shield Loader steps or redirect (wait for animations)
      await page.waitForURL('**/student/dashboard', { timeout: 10000 });
      
      // 4. Verify Welcome title is visible and matches student profile info
      const welcomeHeader = page.locator('h1:has-text("Welcome")');
      await expect(welcomeHeader).toBeVisible();
      
      // 5. Verify student badges are present
      await expect(page.locator('text=Sem 4')).toBeVisible();
      await expect(page.locator('text=Year 2')).toBeVisible();
    } catch (err: any) {
      console.error('Test failed:', err);
      throw err;
    }
  });

  test('TC-ST-02: Verify Student Profile Navigation', async ({ page }) => {
    try {
      // Login and go to profile
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/student/dashboard');

      // Click or navigate to profile
      await page.goto('/student/profile');
      await page.waitForURL('**/student/profile');

      // Profile details checks
      const usnLabel = page.locator('text=1GD24CS006');
      await expect(usnLabel).toBeVisible();

      // Check if critical inputs like Name are visible or read-only
      const profileCard = page.locator('div:has-text("Profile")');
      await expect(profileCard).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

  test('TC-ST-03: Verify Student Events Board', async ({ page }) => {
    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/student/dashboard');

      // Navigate to student events listing
      await page.goto('/student/events');
      await page.waitForURL('**/student/events');

      // Check for search input or filtering options
      const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[placeholder*="search"]'));
      await expect(searchInput).toBeVisible();
    } catch (err: any) {
      throw err;
    }
  });

  test('TC-ST-04: Role Guard Enforcement (Negative Case)', async ({ page }) => {
    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', credentials.usn);
      await page.fill('input[name="password"]', credentials.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/student/dashboard');

      // Try navigating directly to Admin Dashboard as a Student
      await page.goto('/admin/dashboard');

      // Verify that access is blocked or redirected away
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/admin/dashboard');
    } catch (err: any) {
      throw err;
    }
  });
});
