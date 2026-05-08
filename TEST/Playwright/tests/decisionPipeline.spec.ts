import { test, expect, type Page } from '@playwright/test';
import { supabaseAdmin } from '../../../lib/supabase/admin';

async function performLogout(page: Page) {
  console.log('[Decision Pipeline] Triggering session logout...');
  try {
    const logoutBtn = page.locator('button:has(.lucide-log-out)').first();
    if (await logoutBtn.isVisible({ timeout: 4000 })) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 15000 });
      console.log('[Decision Pipeline] Successfully logged out via UI.');
      return;
    }
  } catch (e) {
    console.log('[Decision Pipeline] UI logout interrupted or not visible. Clearing cookies...');
  }
  await page.context().clearCookies();
  await page.goto('/login');
}

test.describe('Event Decision Pipeline (Teacher & HOD Approval to Student Dashboard Reflection)', () => {
  const ccCreds = { usn: '1GD24CS073', pass: '123456' };
  const teacherCreds = { usn: '1GD24CS008', pass: '123456' };
  const hodCreds = { usn: '1GD12CS001', pass: '123456' };
  const studentCreds = { usn: '1GD24CS006', pass: '123456' };

  test('E2E: Full Approval Pipeline and Student Dashboard Reflection', async ({ page }) => {
    // Set timeout to 120 seconds for this long-running multi-user E2E scenario
    test.setTimeout(120000);

    // Enable browser log and dialog capture for high-fidelity debugging
    page.on('console', msg => console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[Browser Error] ${err.message}`));
    page.on('dialog', async dialog => {
      console.log(`[Browser Dialog] [${dialog.type()}] Message: "${dialog.message()}"`);
      await dialog.dismiss();
    });

    const timestamp = Date.now();
    const eventTitle = `DECISION-FLOW-${timestamp}`;

    // =============================================================
    // STEP 1: CC CREATES THE EVENT PROPOSAL
    // =============================================================
    console.log(`[Decision Pipeline] STEP 1: CC logs in and schedules event: ${eventTitle}`);
    await page.goto('/login');
    await page.fill('input[name="email"]', ccCreds.usn);
    await page.fill('input[name="password"]', ccCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cc/dashboard');

    await page.goto('/cc/events/create');
    await page.fill('input[name="title"]', eventTitle);
    await page.fill('input[name="clubName"]', 'Debate Club');
    await page.selectOption('select[name="targetedDepartment"]', 'CSE');
    await page.fill('textarea[name="description"]', 'An automated event designed to test the complete Teacher and HOD approval flow.');
    await page.fill('input[name="location"]', `Conference Room B ${timestamp}`);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    await page.fill('input[name="eventDate"]', futureDate.toISOString().slice(0, 16));

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 5);
    await page.fill('input[name="deadline"]', deadlineDate.toISOString().slice(0, 16));
    await page.fill('input[name="capacity"]', '120');

    // Add 3 required feedback questions to satisfy database validation
    const addFeedbackBtn = page.locator('button:has-text("Add Question")');
    for (let i = 0; i < 3; i++) {
      await addFeedbackBtn.click();
      await page.locator('input[placeholder="How was the event?"]').nth(i).fill(`Pipeline feedback criteria ${i + 1}`);
    }

    await page.fill('input[name="bannerUrl"]', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80');
    await page.click('button:has-text("Submit for Review")');
    await page.waitForURL('**/cc/dashboard');

    // Query database programmatically to get the Event ID
    const { data: eventDb, error: eventDbErr } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('title', eventTitle)
      .single();
    if (eventDbErr || !eventDb) {
      throw new Error(`Failed to find newly created event "${eventTitle}". Error: ${eventDbErr?.message}`);
    }
    const eventId = eventDb.id;
    console.log(`[Decision Pipeline] CC Event created successfully with ID: ${eventId}`);

    // Logout CC
    await performLogout(page);

    // =============================================================
    // STEP 2: TEACHER LOGS IN, AUTHORIZES, WRITES NOTE & LOGS OUT
    // =============================================================
    console.log(`[Decision Pipeline] STEP 2: Teacher logs in to Authorize: ${eventTitle}`);
    await page.goto('/login');
    await page.fill('input[name="email"]', teacherCreds.usn);
    await page.fill('input[name="password"]', teacherCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/dashboard');

    // Navigate directly to the teacher verification url using the retrieved eventId
    await page.goto(`/teacher/verify/${eventId}`);

    // Verify and interact with FacultyReviewForm
    const teacherAuthorizeBtn = page.locator('button:has-text("Authorize")');
    await expect(teacherAuthorizeBtn).toBeVisible();
    await teacherAuthorizeBtn.click();

    const teacherRemarks = page.locator('textarea[placeholder*="State the reason for your decision"]');
    await teacherRemarks.fill('Authorized by Faculty: Checked syllabus alignment and budget outline. Looks excellent!');

    await page.click('button:has-text("Submit Verification")');
    await page.waitForURL('**/teacher/dashboard');
    console.log('[Decision Pipeline] Event successfully authorized by Teacher.');

    // Logout Teacher
    await performLogout(page);

    // =============================================================
    // STEP 3: HOD LOGS IN, APPROVES, WRITES NOTE & LOGS OUT
    // =============================================================
    console.log(`[Decision Pipeline] STEP 3: HOD logs in to final Approve: ${eventTitle}`);
    await page.goto('/login');
    await page.fill('input[name="email"]', hodCreds.usn);
    await page.fill('input[name="password"]', hodCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/hod/dashboard');

    // Navigate directly to HOD approvals page using the retrieved eventId
    await page.goto(`/hod/approvals/${eventId}`);

    // Verify and interact with HOD Action Terminal
    const hodAuthorizeBtn = page.locator('button:has-text("Authorize")');
    await expect(hodAuthorizeBtn).toBeVisible();
    await hodAuthorizeBtn.click();

    const hodRemarks = page.locator('textarea[placeholder*="State the reason for your decision"]');
    await hodRemarks.fill('HOD Approved: Final signature attached. Venue allocated successfully. Publish!');

    await page.click('button:has-text("Submit Verification")');
    await page.waitForURL('**/hod/dashboard');
    console.log('[Decision Pipeline] Event successfully approved and published by HOD.');

    // Logout HOD
    await performLogout(page);

    // =============================================================
    // STEP 4: STUDENT LOGS IN & VERIFIES EVENT ON DASHBOARD
    // =============================================================
    console.log(`[Decision Pipeline] STEP 4: Student logs in to verify event publication: ${eventTitle}`);
    await page.goto('/login');
    await page.fill('input[name="email"]', studentCreds.usn);
    await page.fill('input[name="password"]', studentCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard');

    // Verify that the approved event card is fully reflected on the student dashboard
    const studentDashboardCard = page.locator(`text=${eventTitle}`).first();
    await expect(studentDashboardCard).toBeVisible();
    console.log(`[Decision Pipeline] SUCCESS! Confirmed that approved event "${eventTitle}" reflects perfectly on the Student Dashboard.`);
  });
});
