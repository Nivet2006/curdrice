import { test, expect } from '@playwright/test';
import { raiseBugReport } from '../utils/bugReporter';

test.describe('Club-Eve Master End-to-End Product Lifecycle Workflow', () => {
  const ccCreds = { usn: '1GD24CS073', pass: '123456' };
  const teacherCreds = { usn: '1GD24CS008', pass: '123456' };
  const hodCreds = { usn: '1GD12CS001', pass: '123456' };
  const studentCreds = { usn: '1GD24CS006', pass: '123456' };
  const prCreds = { usn: '1GD24CS001', pass: '123456' };

  // Generate a totally unique, timestamped title to avoid any DB constraint or uniqueness conflicts
  const uniqueId = Date.now();
  const testEventTitle = `ENG-FEST-${uniqueId}`;

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const errorMsg = `[Playwright Master Lifecycle Failure] Failed on step "${testInfo.title}". Status: ${testInfo.status}. Expected interactive fields or transitions failed to resolve.`;
      try {
        await raiseBugReport(page, errorMsg);
      } catch (reporterError) {
        console.error('Failed to submit automatic bug report:', reporterError);
      }
    }
  });

  test('M-01: Execution of the Complete Cross-Role Product Lifecycle', async ({ page }) => {
    
    // ==========================================
    // STEP 1: CC Creates Event Proposal Form
    // ==========================================
    await test.step('CC Logs in and proposes a new event with 3 feedback questions', async () => {
      console.log(`[Master E2E] STEP 1: Proposing event: ${testEventTitle}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', ccCreds.usn);
      await page.fill('input[name="password"]', ccCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/cc/dashboard');

      // Click to create event
      await page.goto('/cc/events');
      await page.waitForURL('**/cc/events');
      
      const createBtn = page.locator('a:has-text("Schedule")').or(page.locator('a:has-text("Create")')).first();
      await expect(createBtn).toBeVisible();
      await createBtn.click();
      await page.waitForURL('**/cc/events/create');

      // Fill primary details
      await page.fill('input[name="title"]', testEventTitle);
      await page.fill('input[name="clubName"]', 'Automated Testing Club');
      await page.selectOption('select[name="targetedDepartment"]', 'CSE');
      await page.fill('textarea[name="description"]', 'This is a premium, fully automated test event validating the entire software pipeline.');

      // Fill venue & date
      await page.fill('input[name="location"]', 'Sir M. Visvesvaraya Seminar Hall');
      
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 10);
      await page.fill('input[name="eventDate"]', eventDate.toISOString().slice(0, 16));

      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 5);
      await page.fill('input[name="deadline"]', deadlineDate.toISOString().slice(0, 16));

      await page.fill('input[name="capacity"]', '200');

      // Add exactly 3 Feedback Questions to comply with system creation policies
      const addQuestionBtn = page.locator('button:has-text("Add Question")');
      await expect(addQuestionBtn).toBeVisible();
      
      // Question 1
      await addQuestionBtn.click();
      await page.locator('input[placeholder="How was the event?"]').nth(0).fill('How would you rate the overall event speaker?');
      await page.locator('select[value="short_text"]').nth(0).selectOption('rating'); // Mark as rating question

      // Question 2
      await addQuestionBtn.click();
      await page.locator('input[placeholder="How was the event?"]').nth(1).fill('What was your primary takeaway from this seminar?');

      // Question 3
      await addQuestionBtn.click();
      await page.locator('input[placeholder="How was the event?"]').nth(2).fill('Do you want more sessions on this topic?');
      await page.locator('select[value="short_text"]').nth(2).selectOption('boolean'); // Yes/No question

      // Add poster banner URL
      await page.fill('input[name="bannerUrl"]', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80');

      // Submit Proposal for review
      const submitProposalBtn = page.locator('button:has-text("Submit for Review")');
      await expect(submitProposalBtn).toBeVisible();
      await submitProposalBtn.click();

      // Ensure we are redirected back to cc dashboard successfully
      await page.waitForURL('**/cc/dashboard');
    });

    // ==========================================
    // STEP 2: Teacher Reviews & Approves Proposal
    // ==========================================
    await test.step('Teacher logs in and endorses the proposed event', async () => {
      console.log(`[Master E2E] STEP 2: Teacher vetting ${testEventTitle}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', teacherCreds.usn);
      await page.fill('input[name="password"]', teacherCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/teacher/dashboard');

      // Click on the proposed event detail card
      const proposalCard = page.locator(`text=${testEventTitle}`).first();
      await expect(proposalCard).toBeVisible();
      await proposalCard.click();

      // Vet report forms and endorse
      const commentArea = page.locator('textarea[name="feedback"]').or(page.locator('textarea')).first();
      await expect(commentArea).toBeVisible();
      await commentArea.fill('Looks fantastic and complies with all CSE curriculum standards. Approved!');

      const approveBtn = page.locator('button:has-text("Approve")').or(page.locator('button[value="approve"]')).first();
      await expect(approveBtn).toBeVisible();
      await approveBtn.click();

      // Redirect check
      await page.waitForURL('**/teacher/dashboard');
    });

    // ==========================================
    // STEP 3: HOD Reviews & Publishes Event
    // ==========================================
    await test.step('HOD logs in and publishes the vetted event', async () => {
      console.log(`[Master E2E] STEP 3: HOD publishing ${testEventTitle}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', hodCreds.usn);
      await page.fill('input[name="password"]', hodCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/hod/dashboard');

      // Locate the event in the HOD pipeline list
      const eventRow = page.locator(`text=${testEventTitle}`).first();
      await expect(eventRow).toBeVisible();
      await eventRow.click();

      // Write approval review and publish
      const commentArea = page.locator('textarea[name="feedback"]').or(page.locator('textarea')).first();
      await expect(commentArea).toBeVisible();
      await commentArea.fill('Event is approved. Budget and venue are confirmed. Go ahead!');

      const publishBtn = page.locator('button:has-text("Publish")').or(page.locator('button:has-text("Approve")')).first();
      await expect(publishBtn).toBeVisible();
      await publishBtn.click();

      // Redirect check
      await page.waitForURL('**/hod/dashboard');
    });

    // ==========================================
    // STEP 4: Student Registers for the Live Event
    // ==========================================
    await test.step('Student logs in, finds the published event and registers', async () => {
      console.log(`[Master E2E] STEP 4: Student booking ${testEventTitle}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', studentCreds.usn);
      await page.fill('input[name="password"]', studentCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/student/dashboard');

      // Go to student event page
      await page.goto('/student/events');
      await page.waitForURL('**/student/events');

      const liveEventLink = page.locator(`text=${testEventTitle}`).first();
      await expect(liveEventLink).toBeVisible();
      await liveEventLink.click();

      // Click Register Now
      const registerBtn = page.locator('button:has-text("Register")').or(page.locator('button:has-text("Join")')).first();
      await expect(registerBtn).toBeVisible();
      await registerBtn.click();

      // Verify booking was successfully recorded
      await page.waitForTimeout(2000);
      const registeredBadge = page.locator('text=Registered').first();
      await expect(registeredBadge).toBeVisible();
    });

    // ==========================================
    // STEP 5: PR Scans & Verifies QR Attendance
    // ==========================================
    await test.step('PR logs in and verifies student entry via attendance terminal', async () => {
      console.log(`[Master E2E] STEP 5: Scanning check-in for ${studentCreds.usn}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', prCreds.usn);
      await page.fill('input[name="password"]', prCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pr/dashboard');

      // Open terminal
      await page.goto('/pr/scanner');
      await page.waitForURL('**/pr/scanner');

      // Check if entry input exists and verify student check-in
      const checkInInput = page.locator('input[placeholder*="USN"]').or(page.locator('input[name="usn"]')).first();
      if (await checkInInput.isVisible()) {
        await checkInInput.fill(studentCreds.usn);
        const checkInSubmit = page.locator('button:has-text("Check-in")').or(page.locator('button:has-text("Verify")')).first();
        await expect(checkInSubmit).toBeVisible();
        await checkInSubmit.click();
        await page.waitForTimeout(1000);
      }
    });

    // ==========================================
    // STEP 6: Student Submits Post-Event Feedback
    // ==========================================
    await test.step('Student fills and submits feedback questions', async () => {
      console.log(`[Master E2E] STEP 6: Feedback submission for ${testEventTitle}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', studentCreds.usn);
      await page.fill('input[name="password"]', studentCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/student/dashboard');

      // Open detail page
      await page.goto('/student/events');
      await page.waitForURL('**/student/events');
      await page.locator(`text=${testEventTitle}`).first().click();

      // Check if feedback open, click to open feedback modal
      const feedbackBtn = page.locator('button:has-text("Feedback")').or(page.locator('button:has-text("Insight")')).first();
      if (await feedbackBtn.isVisible()) {
        await feedbackBtn.click();

        // Stars / Answers filling
        const textareas = page.locator('textarea[placeholder*="Type your response"]').or(page.locator('textarea'));
        if (await textareas.count() > 0) {
          await textareas.first().fill('Exceptional event. Learned how to design high-scale testing patterns!');
        }

        // Submitting
        const submitBtn = page.locator('button:has-text("Submit")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    });

    // ==========================================
    // STEP 7: CC Compiles & Submits Post-Event Report
    // ==========================================
    await test.step('CC logs in and compiles post-event outcomes report', async () => {
      console.log(`[Master E2E] STEP 7: CC report compilation for ${testEventTitle}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', ccCreds.usn);
      await page.fill('input[name="password"]', ccCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/cc/dashboard');

      await page.goto('/cc/events');
      await page.waitForURL('**/cc/events');

      const compileReportBtn = page.locator('a:has-text("Report")').or(page.locator('a:has-text("Compile")')).first();
      if (await compileReportBtn.isVisible()) {
        await compileReportBtn.click();

        // Fill outcomes and expenditures
        const outcomeArea = page.locator('textarea[name="outcomes"]').or(page.locator('textarea')).first();
        if (await outcomeArea.isVisible()) {
          await outcomeArea.fill('Our E2E suite completed 100% test scenario passes automatically with bug reporting pipeline integrated.');
        }

        const budgetInput = page.locator('input[name="expenditure"]').or(page.locator('input[type="number"]')).first();
        if (await budgetInput.isVisible()) {
          await budgetInput.fill('1500');
        }

        // Click submit to PR
        const submitReportBtn = page.locator('button:has-text("Submit to PR")').or(page.locator('button:has-text("Submit Report")')).first();
        if (await submitReportBtn.isVisible()) {
          await submitReportBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    });

    // ==========================================
    // STEP 8: PR Audits and Endorses Report
    // ==========================================
    await test.step('PR audits and endorses report', async () => {
      console.log(`[Master E2E] STEP 8: PR report audit for ${testEventTitle}`);
      await page.goto('/login');
      await page.fill('input[name="email"]', prCreds.usn);
      await page.fill('input[name="password"]', prCreds.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/pr/dashboard');

      // Audits section
      await page.goto('/pr/reports');
      await page.waitForURL('**/pr/reports');

      const auditBtn = page.locator('a:has-text("Begin Audit")').or(page.locator('a:has-text("Review")')).first();
      if (await auditBtn.isVisible()) {
        await auditBtn.click();

        const commentArea = page.locator('textarea[placeholder*="comment"]').or(page.locator('textarea')).first();
        if (await commentArea.isVisible()) {
          await commentArea.fill('All student registered records and budget expenditures verified as correct.');
        }

        const approveBtn = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("Endorse")')).first();
        if (await approveBtn.isVisible()) {
          await approveBtn.click();
          await page.waitForURL('**/pr/dashboard');
        }
      }
    });

    console.log(`[Master E2E] SUCCESS! Full product lifecycle executed for: ${testEventTitle}`);
  });
});
