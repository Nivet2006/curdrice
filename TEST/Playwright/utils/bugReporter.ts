import { Page, expect } from '@playwright/test';

/**
 * Helper function to raise a bug report via the floating Bug Reporter Widget.
 * This is designed to be called when any error, failure, or unexpected state occurs in a test.
 * 
 * @param page The Playwright Page instance
 * @param description Detailed description of the bug, including what failed and steps
 */
export async function raiseBugReport(page: Page, description: string) {
  console.log(`[Bug Reporter] Initiating bug report: "${description.slice(0, 50)}..."`);
  
  // 1. Locate the bug reporter floating widget button (collapsed 🐛 pill)
  const widgetPill = page.locator('button[title="Report a bug"]').or(page.locator('text=🐛'));
  
  // Ensure the widget is visible on the screen
  await expect(widgetPill).toBeVisible({ timeout: 5000 });
  await widgetPill.click();
  await page.waitForTimeout(500); // Wait for transition animation
  
  // 2. Check if verification is needed (Access ID and Password inputs exist)
  const accessIdInput = page.locator('input[placeholder="Access ID"]');
  const passwordInput = page.locator('input[placeholder="Password"]');
  
  const needsLogin = await accessIdInput.isVisible();
  
  if (needsLogin) {
    const accessId = process.env.PLAYWRIGHT_BUG_REPORTER_ACCESS_ID || 'DEV-NIVED';
    const password = process.env.PLAYWRIGHT_BUG_REPORTER_PASSWORD || 'Nived@123';
    
    console.log(`[Bug Reporter] Widget requires authentication. Logging in as ${accessId}...`);
    await accessIdInput.fill(accessId);
    await passwordInput.fill(password);
    
    // Click 'UNLOCK REPORTER' button
    const unlockBtn = page.locator('button:has-text("UNLOCK")').or(page.locator('button:has-text("REPORTER")'));
    await unlockBtn.click();
    
    // Wait for validation to succeed and UI to show the tabs
    await page.waitForTimeout(1500);
  } else {
    console.log('[Bug Reporter] Widget is already authenticated.');
  }

  // 3. Select 'REPORT' tab if not already selected
  const reportTab = page.locator('button:has-text("REPORT")').first();
  if (await reportTab.isVisible()) {
    await reportTab.click();
  }

  // 4. Fill in the description
  const descriptionTextarea = page.locator('textarea[placeholder="Describe what went wrong..."]');
  await expect(descriptionTextarea).toBeVisible({ timeout: 3000 });
  await descriptionTextarea.fill(description);

  // 5. Submit report
  const submitBtn = page.locator('button:has-text("SUBMIT REPORT")');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();
  
  // 6. Verify success (button shows 'SENT!' or widget collapses)
  const successPill = page.locator('button:has-text("SENT!")').or(page.locator('text=✓ SENT!'));
  await expect(successPill).toBeVisible({ timeout: 5000 });
  
  console.log('[Bug Reporter] Bug report successfully raised in database!');
  
  // Wait for automatic collapse transition
  await page.waitForTimeout(1500);
}
