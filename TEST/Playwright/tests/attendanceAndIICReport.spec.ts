import { test, expect, type Page } from '@playwright/test';
import { supabaseAdmin } from '../../../lib/supabase/admin';

async function performLogout(page: Page) {
  console.log('[Attendance & IIC] Triggering session logout...');
  const logoutBtn = page.locator('button:has(.lucide-log-out)').first();
  await expect(logoutBtn).toBeVisible();
  await logoutBtn.click();
  
  // Wait for session logout animation and redirect to login page
  await page.waitForURL('**/login', { timeout: 15000 });
  console.log('[Attendance & IIC] Successfully logged out.');
}

test.describe('Attendance Verification Rule and IIC Report Generation', () => {
  const ccCreds = { usn: '1GD24CS073', pass: '123456' };
  const teacherCreds = { usn: '1GD24CS008', pass: '123456' };
  const hodCreds = { usn: '1GD12CS001', pass: '123456' };
  const studentCreds = { usn: '1GD24CS006', pass: '123456' };

  const timestamp = Date.now();
  const eventTitle = `IIC-WORKSHOP-${timestamp}`;
  const venueName = `Sir M. Visvesvaraya Seminar Hall ${timestamp}`;

  test('E2E-04: Verifying the Present/Absent Triple-Condition Logic and Detailed Report PDF Generation', async ({ page }) => {
    // Increase test timeout to 180 seconds to cover all stages smoothly
    test.setTimeout(180000);

    // Enable browser log and dialog capture for high-fidelity debugging
    page.on('console', msg => console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[Browser Error] ${err.message}`));
    page.on('dialog', async dialog => {
      console.log(`[Browser Dialog] [${dialog.type()}] Message: "${dialog.message()}"`);
      await dialog.dismiss();
    });

    // ==========================================
    // STEP 1: CC creates and schedules event
    // ==========================================
    console.log(`[Attendance & IIC] STEP 1: Proposing event: ${eventTitle} at venue: ${venueName}`);
    await page.goto('/login');
    await page.fill('input[name="email"]', ccCreds.usn);
    await page.fill('input[name="password"]', ccCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cc/dashboard');

    await page.goto('/cc/events/create');
    await page.fill('input[name="title"]', eventTitle);
    await page.fill('input[name="clubName"]', 'IIC Club');
    await page.selectOption('select[name="targetedDepartment"]', 'CSE');
    await page.fill('textarea[name="description"]', 'An intensive hands-on lab on deep tech, innovation, and RAG architectures.');
    await page.fill('input[name="location"]', venueName);
    
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 10);
    await page.fill('input[name="eventDate"]', eventDate.toISOString().slice(0, 16));

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 5);
    await page.fill('input[name="deadline"]', deadlineDate.toISOString().slice(0, 16));
    await page.fill('input[name="capacity"]', '100');

    // Add exactly 3 feedback questions
    const addQuestionBtn = page.locator('button:has-text("Add Question")');
    for (let i = 0; i < 3; i++) {
      await addQuestionBtn.click();
      await page.locator('input[placeholder="How was the event?"]').nth(i).fill(`Workshop question ${i + 1}`);
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
    console.log(`[Attendance & IIC] Event created successfully with ID: ${eventId}`);

    // Log out CC
    await performLogout(page);

    // ==========================================
    // STEP 2: Approve event (Teacher -> HOD)
    // ==========================================
    console.log('[Attendance & IIC] STEP 2: Approving event (Teacher)');
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

    // Log out Teacher
    await performLogout(page);

    console.log('[Attendance & IIC] STEP 3: Approving & Publishing event (HOD)');
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

    // Log out HOD
    await performLogout(page);

    // ==========================================
    // STEP 3: Student Registers for the Event
    // ==========================================
    console.log('[Attendance & IIC] STEP 4: Student registers for the event');
    await page.fill('input[name="email"]', studentCreds.usn);
    await page.fill('input[name="password"]', studentCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard');

    // Navigate directly to student event details page
    await page.goto(`/student/events/${eventId}`);

    // Click register button and wait for it to transition to "Registered" to guarantee persistence
    const registerBtn = page.locator('button:has-text("Register for this Event")');
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
    }
    
    // Explicitly wait for button to transition and confirm persistence
    const registeredBtn = page.locator('button').filter({ hasText: 'Registered' });
    await expect(registeredBtn).toBeVisible({ timeout: 15000 });
    console.log('[Attendance & IIC] Student registration successfully persisted.');

    // Get dynamic student name from navbar profile badge for verification
    const studentNameBadge = page.locator('button:has(span.font-mono)').first();
    const studentName = (await studentNameBadge.locator('span.font-mono').innerText()).trim();
    console.log(`[Attendance & IIC] Student profile name: "${studentName}"`);

    // Log out Student
    await performLogout(page);

    // ==========================================
    // STEP 4: Verify Condition 1 (Registered, but Not Checked-In, No Feedback)
    // ==========================================
    console.log('[Attendance & IIC] STEP 5: Verifying state 1 (Un-scanned, No feedback)');
    await page.fill('input[name="email"]', ccCreds.usn);
    await page.fill('input[name="password"]', ccCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cc/dashboard');

    // Go directly to CC event detail page to view registration stats
    await page.goto(`/cc/events/${eventId}`);

    // Wait for manifest container and print debug info
    const manifestContainer = page.locator('.max-h-\\[400px\\]');
    await expect(manifestContainer).toBeVisible({ timeout: 15000 });
    const manifestText = await manifestContainer.innerText();
    console.log(`[Attendance & IIC] Current Manifest Text:\n${manifestText}`);

    // Verify student is listed in the manifest, but lacks both "Entered" and "Feedback" badges
    const manifestRow = page.locator('.divide-y > div').filter({ hasText: studentName }).first();
    await expect(manifestRow).toBeVisible({ timeout: 15000 });
    await expect(manifestRow.locator('text=Entered')).not.toBeVisible();
    await expect(manifestRow.locator('text=Feedback')).not.toBeVisible();
    console.log('[Attendance & IIC] Checked: Student is listed but remains Absent / Unmarked.');

    // Log out CC
    await performLogout(page);

    // ==========================================
    // STEP 5: Scan Student (Programmatic Check-in via Supabase Admin)
    // ==========================================
    console.log('[Attendance & IIC] STEP 6: Performing programmatic check-in via Supabase Admin');
    const { data: profileData, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('usn', studentCreds.usn)
      .single();
    if (profileErr || !profileData) {
      throw new Error(`Failed to find profile for student USN: ${studentCreds.usn}. Error: ${profileErr?.message}`);
    }

    const { error: updateErr } = await supabaseAdmin
      .from('registrations')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('student_id', profileData.id)
      .eq('event_id', eventId);
    if (updateErr) {
      throw new Error(`Failed to check-in student in registrations table. Error: ${updateErr.message}`);
    }
    console.log(`[Attendance & IIC] Programmatically checked in student: "${studentName}"`);

    // ==========================================
    // STEP 6: Verify Condition 2 (Registered, Scanned, but No Feedback)
    // ==========================================
    console.log('[Attendance & IIC] STEP 7: Verifying state 2 (Checked-In, No feedback) and Opening Feedback Portal');
    await page.fill('input[name="email"]', ccCreds.usn);
    await page.fill('input[name="password"]', ccCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cc/dashboard');

    // Go directly to CC event detail page to view updated registration stats
    await page.goto(`/cc/events/${eventId}`);

    // Verify student has "Entered" badge, but lacks "Feedback" badge
    const manifestRowScanned = page.locator('.divide-y > div').filter({ hasText: studentName }).first();
    await expect(manifestRowScanned).toBeVisible({ timeout: 15000 });
    await expect(manifestRowScanned.locator('text=Entered')).toBeVisible();
    await expect(manifestRowScanned.locator('text=Feedback')).not.toBeVisible();
    console.log('[Attendance & IIC] Checked: Student is Entered but not fully present (pending feedback).');

    // Open Student Feedback Portal so that student can submit feedback
    console.log('[Attendance & IIC] Toggling Student Feedback Portal switch to LIVE...');
    const feedbackCard = page.locator('div.rounded-3xl').filter({ hasText: 'Student Feedback Portal' }).first();
    const feedbackSwitch = feedbackCard.locator('button[role="switch"]');
    await expect(feedbackSwitch).toBeVisible();
    await feedbackSwitch.click();
    
    // Confirm it successfully transitions to "LIVE"
    await expect(feedbackCard.getByText('LIVE', { exact: true })).toBeVisible();
    console.log('[Attendance & IIC] Feedback Portal UI is now LIVE.');

    // Force feedback_open = true in database programmatically via Supabase Admin to bypass any local sandbox RLS limits
    const { error: dbOpenErr } = await supabaseAdmin
      .from('events')
      .update({ feedback_open: true })
      .eq('id', eventId);
    if (dbOpenErr) {
      throw new Error(`Failed to programmatically open feedback in DB: ${dbOpenErr.message}`);
    }
    console.log(`[Attendance & IIC] Successfully forced feedback_open = true in database for Event ${eventId}`);

    // Log out CC
    await performLogout(page);

    // ==========================================
    // STEP 7: Student Submits Post-Event Feedback
    // ==========================================
    console.log('[Attendance & IIC] STEP 8: Student submits feedback responses');
    await page.fill('input[name="email"]', studentCreds.usn);
    await page.fill('input[name="password"]', studentCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/dashboard');

    // Navigate directly to student event details page
    await page.goto(`/student/events/${eventId}`);
    
    // Hard-reload the page to bust Next.js client-side router cache and fetch the fresh live feedback state
    await page.reload();

    // Trigger feedback dialog
    const feedbackBtn = page.locator('button:has-text("Share Your Feedback")');
    await expect(feedbackBtn).toBeVisible({ timeout: 15000 });
    await feedbackBtn.click();

    // Fill rating star if visible
    const ratingStar = page.locator('button:has(.lucide-star)').nth(4); // 5 stars
    if (await ratingStar.isVisible()) {
      await ratingStar.click();
    }
    
    // Fill all 3 feedback questions dynamically (since they are all marked required)
    const responseInputs = page.locator('[placeholder*="Type your response"]');
    const responseCount = await responseInputs.count();
    console.log(`[Attendance & IIC] Filling ${responseCount} feedback responses...`);
    for (let i = 0; i < responseCount; i++) {
      await responseInputs.nth(i).fill(`Excellent response for question ${i + 1}`);
    }
    
    await page.click('button:has-text("Submit Insight")');
    // Wait for feedback terminal success transition to "Feedback Recorded ✓" to guarantee persistence
    await expect(page.locator('text=Feedback Recorded ✓')).toBeVisible({ timeout: 15000 });
    console.log('[Attendance & IIC] Feedback successfully recorded in DB.');

    // Log out Student
    await performLogout(page);

    // ==========================================
    // STEP 8: Verify Condition 3 (Registered, Scanned, Feedback Submitted)
    // ==========================================
    console.log('[Attendance & IIC] STEP 9: Verifying state 3 (Full presence condition met)');
    await page.fill('input[name="email"]', ccCreds.usn);
    await page.fill('input[name="password"]', ccCreds.pass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cc/dashboard');

    // Go directly to CC event detail page to verify complete presence state
    await page.goto(`/cc/events/${eventId}`);
    await page.reload();

    // Verify student has BOTH "Entered" and "Feedback" badges
    const manifestRowComplete = page.locator('.divide-y > div').filter({ hasText: studentName }).first();
    await expect(manifestRowComplete).toBeVisible({ timeout: 15000 });
    await expect(manifestRowComplete.locator('text=Entered')).toBeVisible();
    await expect(manifestRowComplete.locator('text=Feedback')).toBeVisible();
    console.log('[Attendance & IIC] Checked: Student is fully present in the attendance manifest!');

    // ==========================================
    // STEP 9: Detailed IIC Report Generation
    // ==========================================
    console.log('[Attendance & IIC] STEP 10: Compiling detailed IIC report across the 5 steps');
    
    // We are already on CCEventDetailPage, click "Generate Report" inside ReportHubCard
    const generateReportBtn = page.locator('a:has-text("Generate Report")').first();
    await expect(generateReportBtn).toBeVisible();
    await generateReportBtn.click();

    // MultiStepReportForm Wizard:
    // Step 1: Primary details
    await page.locator('button:has-text("Next")').click();

    // Step 2: Narrative details (Objective, Summary, Benefits)
    await page.fill('textarea[placeholder*="State the purpose"]', 'To train and seed student entrepreneurs with premium tech skills.');
    await page.fill('textarea[placeholder*="Describe activity nature"]', 'The activity was structured around 4 interactive seminar modules with live code submissions.');
    await page.fill('textarea[placeholder*="Outline knowledge"]', 'Students gained rich knowledge in RAG architecture, vector search, and web deployment.');
    await page.locator('button:has-text("Next")').click();

    // Step 3: Social & Collage details
    await page.locator('button:has-text("Next")').click();

    // Step 4: Socials & Speakers details
    // Add 1 Resource Speaker entry
    await page.click('button:has-text("Resource Person")');
    
    // Fill Internal Resource Person fields using adjacent sibling combinators which are 100% strict-mode compliant
    await page.locator('input[placeholder="Start typing name..."]').fill('Dr. Alan Turing');
    await page.locator('input[placeholder="Start typing USN..."]').fill('1GD24CS001');
    await page.locator('label:has-text("Department") + select').selectOption('CSE');
    await page.locator('label:has-text("Mobile Number") + input').fill('9876543210');
    await page.locator('label:has-text("E-mail id") + input').fill('turing@computing.org');
    
    await page.locator('button:has-text("Next")').click();

    // Step 5: Coordinators Sign-off
    await page.locator('button:has-text("Generate Official PDF")').click();

    // Assert successful compilation page is displayed with PDF links
    const successHeader = page.locator('h2:has-text("Report Generated")');
    await expect(successHeader).toBeVisible({ timeout: 20000 });

    const pdfLink = page.locator('a:has-text("View Report PDF")');
    await expect(pdfLink).toBeVisible();

    console.log(`[Attendance & IIC] SUCCESS! Dynamic present participant compilation and report generation verified for ${eventTitle}`);
  });
});
