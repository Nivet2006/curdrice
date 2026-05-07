# Playwright End-to-End Testing Guide for Club-Eve

Playwright is a modern framework for reliable end-to-end (E2E) testing. It supports multi-browser testing (Chromium, Firefox, WebKit), runs fast, and provides powerful debugging tools.

This guide outlines how to install, configure, write, and execute Playwright tests inside the `TEST/Playwright` folder for your Next.js application.

---

## 🚀 1. Installation

To get started, install Playwright in the project root:

```bash
# Install Playwright test package as a devDependency
npm install -D @playwright/test

# Install the required browser binaries (Chromium, Firefox, WebKit)
npx playwright install
```

---

## ⚙️ 2. Configuration (`playwright.config.ts`)

Create a `playwright.config.ts` in your project root to configure Playwright. This file is tailored to use `TEST/Playwright` as the test directory and run against your Next.js local development server.

Create a file named `playwright.config.ts` in your root folder with the following contents:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Point Playwright to look for tests in the Playwright folder
  testDir: './TEST/Playwright',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: 'html',
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying a failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
    
    // Capture screenshots on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## ✍️ 3. Writing Your First Test

Create your test files inside the `TEST/Playwright` directory. Playwright looks for files ending in `.spec.ts` or `.spec.js`.

For example, create `TEST/Playwright/auth.spec.ts` to test your login/authentication system:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('should load the login page and show credentials form', async ({ page }) => {
    // 1. Navigate to the login page (uses baseURL from configuration)
    await page.goto('/login');

    // 2. Assert page title or major text elements are present
    await expect(page).toHaveTitle(/Login/i);
    await expect(page.locator('h1')).toContainText(/Welcome/i);

    // 3. Check for the form inputs
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should display error message on wrong credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter wrong credentials
    await page.fill('input[type="email"]', 'wronguser@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    
    // Click login
    await page.click('button[type="submit"]');

    // Assert that error feedback / toasts or alert contains the expected error message
    // Note: Replace with actual selectors/text matching your application's error handling
    const errorMessage = page.locator('text=Invalid login credentials');
    await expect(errorMessage).toBeVisible();
  });
});
```

---

## 🏃‍♂️ 4. Running Your Tests

Once setup is complete, you can run tests using the following commands:

### Running in Headless Mode (Standard Terminal)
Runs all tests across Chromium, Firefox, and WebKit without opening a browser window:
```powershell
npx playwright test
```

### Running in Interactive UI Mode (highly recommended!)
Opens a rich, interactive graphical interface where you can see files, inspect selectors, step through tests, view console logs, and see visual highlights of what's happening:
```powershell
npx playwright test --ui
```

### Running on a Specific Browser
```powershell
npx playwright test --project=chromium
```

### Running a Specific Test File
```powershell
npx playwright test TEST/Playwright/auth.spec.ts
```

### Debugging Tests
Opens a browser inspector and lets you step through your test lines step-by-step:
```powershell
npx playwright test --debug
```

---

## 🎥 5. Generating Code (Codegen / Test Recording)

Playwright has an incredible code generator that allows you to click around your web application in a browser window while it records your actions and generates standard Playwright TS/JS code automatically!

Run this command to open the generator:
```powershell
# This opens two windows: a browser window and an inspector displaying the generated code
npx playwright codegen http://localhost:3000
```

Once you finish clicking around, copy the generated code and paste it into a file under `TEST/Playwright/`.

---

## 📊 6. Viewing Reports

If your tests run and any fail, Playwright will automatically generate an HTML report. You can open and read this interactive report at any time using:
```powershell
npx playwright show-report
```
This includes detailed logs, screenshot captures of failures, and traces of network/UI events.
