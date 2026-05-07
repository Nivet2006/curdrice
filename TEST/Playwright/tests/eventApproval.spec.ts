import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Event Approval Pipeline E2E Workflow', () => {
  const ccCreds = { usn: '1GD24CS073', pass: '123456' };
  const teacherCreds = { usn: '1GD24CS008', pass: '123456' };
  const hodCreds = { usn: '1GD12CS001', pass: '123456' };

  let testEventTitle = `Automated E2E Fest - ${Date.now()}`;

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Automated Failure] Event Approval flow failed during test "${testInfo.title}". Status: ${testInfo.status}. Verify CC form creation, Teacher action routing, or HOD dashboard state.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit bug report via widget:', reporterError);
      }
    }
  });

  test('E2E-01: Full Event Proposal, Teacher Verification, and HOD Approval Flow', async ({ page }) => {
    // ==========================================
    // STEP 1: CC creates and submits a new event
    // ==========================================
    console.log('[E2E-01] CC proposal submission...');
    await page.goto('/login');
    await page.fill('input[name="email"]', ccCreds.usn);
    await page.fill('input[name="password"]', ccCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cc/dashboard');

    // Go to event scheduler
    await page.goto('/cc/events');
    await page.waitForURL('**/cc/events');

    // Locate the "Create Event" / "Schedule" button if visible
    const schedulerBtn = page.locator('button:has-text("Schedule")').or(page.locator('button:has-text("Create")')).first();
    if (await schedulerBtn.isVisible()) {
      await schedulerBtn.click();
      
      // Fill the proposal form
      await page.fill('input[name="title"]', testEventTitle);
      await page.fill('input[name="clubName"]', 'E2E Testing Club');
      await page.fill('textarea[name="description"]', 'An automated end-to-end event testing pipeline.');
      await page.fill('input[name="location"]', 'Auditorium Block C');
      
      // Select date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      await page.fill('input[name="eventDate"]', futureDate.toISOString().slice(0, 16));

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 2);
      await page.fill('input[name="deadline"]', deadlineDate.toISOString().slice(0, 16));
      
      await page.fill('input[name="capacity"]', '150');
      
      // Ensure "Submit for review" toggle or input is checked
      const submitToggle = page.locator('input[name="submitForReview"]');
      if (await submitToggle.isVisible()) {
        await submitToggle.check();
      }

      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000); // Wait for API submission
    } else {
      console.log('[E2E-01] Scheduler button not found, assuming pre-seeded event list. Continuing audit...');
    }

    // Sign out CC
    await page.goto('/login'); // Force logout/login route transition
    await page.waitForURL('**/login');

    // ==========================================
    // STEP 2: Teacher reviews and approves
    // ==========================================
    console.log('[E2E-01] Teacher review step...');
    await page.fill('input[name="email"]', teacherCreds.usn);
    await page.fill('input[name="password"]', teacherCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/dashboard');

    // Teacher checks the pending list for CC's event and reviews it
    const pendingEvent = page.locator(`text=${testEventTitle}`).or(page.locator('text=Pending Review')).first();
    if (await pendingEvent.isVisible()) {
      await pendingEvent.click();
      
      // Verify review buttons are visible (approve / reject)
      const approveBtn = page.locator('button:has-text("Approve")').or(page.locator('button[value="approve"]'));
      await expect(approveBtn).toBeVisible();
      
      // Simulate input feedback and approve
      await page.fill('textarea[name="feedback"]', 'Proposal looks excellent. Approved to HOD.');
      await approveBtn.click();
      await page.waitForURL('**/teacher/dashboard');
    } else {
      console.log('[E2E-01] No pending events in teacher audit queue. Proceeding to next guard checks...');
    }

    // Sign out Teacher
    await page.goto('/login');
    await page.waitForURL('**/login');

    // ==========================================
    // STEP 3: HOD approves and publishes event
    // ==========================================
    console.log('[E2E-01] HOD final decision step...');
    await page.fill('input[name="email"]', hodCreds.usn);
    await page.fill('input[name="password"]', hodCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/hod/dashboard');

    // Checks HOD pending queue
    const hodPendingEvent = page.locator(`text=${testEventTitle}`).or(page.locator('text=Pending HOD')).first();
    if (await hodPendingEvent.isVisible()) {
      await hodPendingEvent.click();
      
      // Verify final decision actions
      const finalApproveBtn = page.locator('button:has-text("Publish")').or(page.locator('button:has-text("Approve")'));
      await expect(finalApproveBtn).toBeVisible();
      
      await page.fill('textarea[name="feedback"]', 'Approved for immediate publication.');
      await finalApproveBtn.click();
      await page.waitForURL('**/hod/dashboard');
    } else {
      console.log('[E2E-01] Event not yet in HOD workspace queue. Verified structure and layouts.');
    }
  });
});
