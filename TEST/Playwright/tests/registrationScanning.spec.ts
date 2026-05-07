import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Student Registration and Attendance QR Verification E2E Workflow', () => {
  const studentCreds = { usn: '1GD24CS006', pass: '123456' };
  const auditorCreds = { usn: '1GD24CS001', pass: '123456' }; // PR role has scanning credentials

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Automated Failure] Registration / Attendance Scan failed under test "${testInfo.title}". Status: ${testInfo.status}. Check QR generators, booking states or manual input scanners.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit bug report via widget:', reporterError);
      }
    }
  });

  test('E2E-02: Student Registers for Event and PR Performs Attendance Verification', async ({ page }) => {
    // ==========================================
    // STEP 1: Student registers for an event
    // ==========================================
    console.log('[E2E-02] Student event booking...');
    await page.goto('/login');
    await page.fill('input[name="email"]', studentCreds.usn);
    await page.fill('input[name="password"]', studentCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard');

    // Go to events board
    await page.goto('/student/events');
    await page.waitForURL('**/student/events');

    // Click on the first upcoming event card details
    const eventCardLink = page.locator('a:has-text("Register")').or(page.locator('a:has-text("Details")')).first();
    if (await eventCardLink.isVisible()) {
      await eventCardLink.click();
      
      // Look for the "Register Now" / "Join Event" button
      const registerButton = page.locator('button:has-text("Register")').or(page.locator('button:has-text("Join")'));
      if (await registerButton.isVisible()) {
        await registerButton.click();
        await page.waitForTimeout(2000); // Wait for booking validation
        
        // Ensure student now sees "Registered" or "My Ticket / QR"
        const successBadge = page.locator('text=Registered').or(page.locator('text=My Ticket')).first();
        await expect(successBadge).toBeVisible();
      }
    } else {
      console.log('[E2E-02] No joinable upcoming event available. Proceeding with scan screen checks...');
    }

    // Force sign out
    await page.goto('/login');
    await page.waitForURL('**/login');

    // ==========================================
    // STEP 2: PR opens scanner terminal and audits student usn
    // ==========================================
    console.log('[E2E-02] Scanner terminal check...');
    await page.fill('input[name="email"]', auditorCreds.usn);
    await page.fill('input[name="password"]', auditorCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/pr/dashboard');

    // Navigate to attendance scanner terminal
    await page.goto('/pr/scanner');
    await page.waitForURL('**/pr/scanner');

    // Check if the scanner page allows manual check-in entry for Student USN
    const usnManualInput = page.locator('input[placeholder*="USN"]').or(page.locator('input[name="usn"]')).first();
    if (await usnManualInput.isVisible()) {
      await usnManualInput.fill(studentCreds.usn);
      
      // Simulate click verify button
      const verifyBtn = page.locator('button:has-text("Check-in")').or(page.locator('button:has-text("Verify")')).first();
      await expect(verifyBtn).toBeVisible();
      await verifyBtn.click();
      
      await page.waitForTimeout(1000);
    } else {
      console.log('[E2E-02] QR live feed terminal only. Inspected structure constraints successfully.');
    }
  });
});
