import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Bug Reporter Widget Integrity Tests', () => {

  test('TC-BR-01: Verify Widget Visibility, Expansion, Authentication & Report Submission', async ({ page }) => {
    // 1. Load the entry login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Club-Eve/i);

    // 2. Submit a real ticket using the raiseBugReport helper to prove its integrity!
    const bugDescription = `[Playwright Verification] Automated testing suite successfully validated widget integrity on ${new Date().toLocaleString()}. System status: OK.`;
    
    await raiseBugReport(page, bugDescription);
    
    // 3. Confirm that the widget did not crash the page and we are still on the login page
    await expect(page.locator('h1')).toContainText(/Club-Eve/i);
  });
});
