import { test, expect } from '@playwright/test';

test.describe('Real-time Peer-to-Peer Messaging and Chat Flow', () => {
  const studentCreds = { usn: '1GD24CS006', pass: '123456' };
  const ccCreds = { usn: '1GD24CS073', pass: '123456' };

  test('E2E-02: DM Invite, Acceptance, and Real-time Chatting between Student & CC', async ({ browser }) => {
    // -------------------------------------------------------------
    // CONTEXT 1: Student (User A)
    // -------------------------------------------------------------
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    console.log('[Messaging E2E] Logging in Student (User A)...');
    await studentPage.goto('/login');
    await studentPage.fill('input[name="email"]', studentCreds.usn);
    await studentPage.fill('input[name="password"]', studentCreds.pass);
    await studentPage.click('button[type="submit"]');
    await studentPage.waitForURL('**/student/dashboard');

    // Retrieve Student's full name from Navbar badge to use later in assertions
    const studentNameBadge = studentPage.locator('button:has(span.font-mono)').first();
    await expect(studentNameBadge).toBeVisible();
    const studentName = (await studentNameBadge.locator('span.font-mono').innerText()).trim();
    console.log(`[Messaging E2E] Student Full Name identified as: "${studentName}"`);

    // Open Student Messages Panel
    await studentNameBadge.click();
    await studentPage.waitForTimeout(1000);

    // Navigate to Inbox tab
    const inboxTab = studentPage.locator('button:has-text("Inbox")');
    await expect(inboxTab).toBeVisible();
    await inboxTab.click();

    // Click "New Message" button
    const newMsgBtn = studentPage.locator('button:has-text("New Message")');
    await expect(newMsgBtn).toBeVisible();
    await newMsgBtn.click();

    // Search for CC by USN
    const searchInput = studentPage.locator('input[placeholder*="Search by name or USN"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(ccCreds.usn);
    await studentPage.waitForTimeout(2000); // Wait for debounce and search query

    // Click DM button on search results to send invitation
    const dmInviteBtn = studentPage.locator('button:has-text("DM")').first();
    await expect(dmInviteBtn).toBeVisible();
    await dmInviteBtn.click();
    console.log('[Messaging E2E] DM Invite sent to CC.');
    await studentPage.waitForTimeout(2000); // Wait for invite transmission and drawer close

    // Close Student messages panel for now
    const closeBtn = studentPage.locator('button[data-testid="close-messages-btn"]');
    await closeBtn.scrollIntoViewIfNeeded();
    await closeBtn.click();
    await studentPage.waitForTimeout(1000);

    // -------------------------------------------------------------
    // CONTEXT 2: Club Coordinator (User B)
    // -------------------------------------------------------------
    const ccContext = await browser.newContext();
    const ccPage = await ccContext.newPage();

    console.log('[Messaging E2E] Logging in Club Coordinator (User B)...');
    await ccPage.goto('/login');
    await ccPage.fill('input[name="email"]', ccCreds.usn);
    await ccPage.fill('input[name="password"]', ccCreds.pass);
    await ccPage.click('button[type="submit"]');
    await ccPage.waitForURL('**/cc/dashboard');

    // Open CC Messages Panel
    const ccNameBadge = ccPage.locator('button:has(span.font-mono)').first();
    await expect(ccNameBadge).toBeVisible();
    await ccNameBadge.click();
    await ccPage.waitForTimeout(1000);

    // Verify Notification tab and accept the invitation
    const notificationsTab = ccPage.locator('button:has-text("Notifications")');
    await expect(notificationsTab).toBeVisible();
    await notificationsTab.click();

    // Locate "Accept" button and click it
    const acceptBtn = ccPage.locator('button:has-text("Accept")').first();
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();
    console.log('[Messaging E2E] CC accepted Student DM invitation.');
    await ccPage.waitForTimeout(1500);

    // Switch to Inbox
    await ccPage.locator('button:has-text("Inbox")').click();

    // Click on Student's conversation element in Inbox
    const convoBtn = ccPage.locator(`button:has-text("${studentName}")`).first();
    await expect(convoBtn).toBeVisible();
    await convoBtn.click();

    // Send a message to Student
    const chatInput = ccPage.locator('input[placeholder="Type a message..."]');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('Hello! I accepted your DM request. Welcome to our chat.');
    await ccPage.locator('button:has(.lucide-send)').first().click();
    console.log('[Messaging E2E] Message sent from CC to Student.');
    await ccPage.waitForTimeout(1000);

    // -------------------------------------------------------------
    // STUDENT (User A) receives and replies
    // -------------------------------------------------------------
    console.log('[Messaging E2E] Student verifying message receipt and replying...');
    await studentPage.locator('button:has(span.font-mono)').first().click();
    await studentPage.waitForTimeout(1000);
    await studentPage.locator('button:has-text("Inbox")').click();

    // Click conversation with CC (which should be at the top now)
    const studentConvoBtn = studentPage.locator('button:has(.lucide-message-square)').first();
    await expect(studentConvoBtn).toBeVisible();
    await studentConvoBtn.click();

    // Verify receipt of CC's message
    const receivedMessage = studentPage.locator('text=Hello! I accepted your DM request.').first();
    await expect(receivedMessage).toBeVisible();

    // Student replies
    const studentChatInput = studentPage.locator('input[placeholder="Type a message..."]');
    await expect(studentChatInput).toBeVisible();
    await studentChatInput.fill('Awesome! Yes, I can see your message in real-time. Works perfectly!');
    await studentPage.locator('button:has(.lucide-send)').first().click();
    await studentPage.waitForTimeout(1000);

    // Verify reply in CC's window
    const ccReceivedReply = ccPage.locator('text=Awesome! Yes, I can see your message in real-time.').first();
    await expect(ccReceivedReply).toBeVisible();
    console.log('[Messaging E2E] Bi-directional real-time chat validated successfully!');

    // Clean up contexts
    await studentContext.close();
    await ccContext.close();
  });
});
