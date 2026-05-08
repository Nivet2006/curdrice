import { test, expect, type Page } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';
import { supabaseAdmin } from '../../../lib/supabase/admin';

async function performLogout(page: Page) {
  console.log('[E2E-Logout] Triggering session logout...');
  try {
    const logoutBtn = page.locator('button:has(.lucide-log-out)').first();
    if (await logoutBtn.isVisible({ timeout: 3000 })) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 8000 });
      console.log('[E2E-Logout] Logged out successfully via UI.');
      return;
    }
  } catch (e) {
    console.log('[E2E-Logout] UI logout button not found/interrupted. Clearing cookies programmatically...');
  }
  await page.context().clearCookies();
  await page.goto('/login');
}

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

    await page.goto('/cc/events/create');
    await page.fill('input[name="title"]', testEventTitle);
    await page.fill('input[name="clubName"]', 'E2E Testing Club');
    await page.selectOption('select[name="targetedDepartment"]', 'CSE');
    await page.fill('textarea[name="description"]', 'An automated end-to-end event testing pipeline.');
    await page.fill('input[name="location"]', `Auditorium Block C ${Date.now()}`);
    
    // Select date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await page.fill('input[name="eventDate"]', futureDate.toISOString().slice(0, 16));

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 2);
    await page.fill('input[name="deadline"]', deadlineDate.toISOString().slice(0, 16));
    
    await page.fill('input[name="capacity"]', '150');

    // Add 3 required feedback questions to satisfy database validation
    const addFeedbackBtn = page.locator('button:has-text("Add Question")');
    for (let i = 0; i < 3; i++) {
      await addFeedbackBtn.click();
      await page.locator('input[placeholder="How was the event?"]').nth(i).fill(`Event feedback criteria ${i + 1}`);
    }

    await page.fill('input[name="bannerUrl"]', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80');
    await page.click('button:has-text("Submit for Review")');
    await page.waitForURL('**/cc/dashboard');

    // Query database programmatically to get the Event ID
    const { data: eventDb, error: eventDbErr } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('title', testEventTitle)
      .single();
    if (eventDbErr || !eventDb) {
      throw new Error(`Failed to find newly created event "${testEventTitle}". Error: ${eventDbErr?.message}`);
    }
    const eventId = eventDb.id;
    console.log(`[E2E-01] CC Event created successfully with ID: ${eventId}`);

    // Sign out CC safely
    await performLogout(page);

    // ==========================================
    // STEP 2: Teacher reviews and approves
    // ==========================================
    console.log('[E2E-01] Teacher review step...');
    await page.goto('/login');
    await page.fill('input[name="email"]', teacherCreds.usn);
    await page.fill('input[name="password"]', teacherCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/dashboard');

    // Navigate directly to teacher verify page
    await page.goto(`/teacher/verify/${eventId}`);

    await page.locator('button:has-text("Authorize")').click();
    await page.locator('textarea[placeholder*="State the reason"]').fill('Vetted and approved for departmental release.');
    await page.click('button:has-text("Submit Verification")');
    await page.waitForURL('**/teacher/dashboard');
    console.log('[E2E-01] Teacher authorized event proposal successfully.');

    // Sign out Teacher safely
    await performLogout(page);

    // ==========================================
    // STEP 3: HOD approves and publishes event
    // ==========================================
    console.log('[E2E-01] HOD final decision step...');
    await page.goto('/login');
    await page.fill('input[name="email"]', hodCreds.usn);
    await page.fill('input[name="password"]', hodCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/hod/dashboard');

    // Navigate directly to HOD approvals page
    await page.goto(`/hod/approvals/${eventId}`);

    await page.locator('button:has-text("Authorize")').click();
    await page.locator('textarea[placeholder*="State the reason"]').fill('Budget & venue confirmed. Publish immediately.');
    await page.click('button:has-text("Submit Verification")');
    await page.waitForURL('**/hod/dashboard');
    console.log('[E2E-01] HOD approved and published event successfully.');
  });
});
