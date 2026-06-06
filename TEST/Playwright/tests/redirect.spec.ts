import { test, expect } from '@playwright/test';

test.describe('HTTP Redirect Pipeline Pages', () => {
  test('should display 301 Moved Permanently with No Redirect (Missing Target warning)', async ({ page }) => {
    // Navigate to /redirect/301
    await page.goto('/redirect/301');

    // Verify code title exists
    const title = page.locator('h1');
    await expect(title).toHaveText('301');

    // Verify specific description/detail texts
    const subtitle = page.locator('h2');
    await expect(subtitle).toContainText('Moved Permanently');

    // Verify Missing Target URI alert box is visible
    const alertBox = page.locator('text=Missing Target URI');
    await expect(alertBox).toBeVisible();

    const warningText = page.locator('text=Please provide a destination target URL');
    await expect(warningText).toBeVisible();

    // Take screenshot of the "No Redirect" UI
    await page.screenshot({ path: './TEST/Playwright/test-results/redirect-301-no-target.png', fullPage: true });
  });

  test('should display redirect animation and info when target is provided', async ({ page }) => {
    // Navigate to /redirect/301 with a target URL and 5 second delay to allow checking the UI
    await page.goto('/redirect/301?to=https://google.com&delay=5');

    // Verify target URL is displayed
    const targetDisplay = page.locator('text=https://google.com');
    await expect(targetDisplay).toBeVisible();

    // Verify countdown text appears
    const countdown = page.locator('text=Redirecting in');
    await expect(countdown).toBeVisible();

    // Verify redirect button is visible
    const redirectButton = page.locator('text=Redirect Now');
    await expect(redirectButton).toBeVisible();

    // Take screenshot of the redirection flow
    await page.screenshot({ path: './TEST/Playwright/test-results/redirect-301-with-target.png', fullPage: true });
  });
});
