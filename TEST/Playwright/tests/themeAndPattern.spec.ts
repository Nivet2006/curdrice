import { test, expect } from '@playwright/test';

test.describe('Theme Changer and Pattern Picker UI E2E tests', () => {
  const testUser = { usn: '1GD24CS006', pass: '123456' };

  test('Theme & Background Pattern Toggling', async ({ page }) => {
    // 1. Visit Login and Sign In
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.usn);
    await page.fill('input[name="password"]', testUser.pass);
    await page.click('button[type="submit"]');

    // Wait for authentication and loader transition
    await page.waitForURL('**/student/dashboard');

    // 2. Theme Toggling Verification
    const themeToggler = page.locator('#theme-toggler');
    await expect(themeToggler).toBeVisible();

    // Check initial theme state (defaults to light or dark depending on system, let's toggle it)
    const initialTheme = await page.locator('html').getAttribute('data-theme');
    
    // Toggle theme once
    await themeToggler.click();
    
    // Wait for the circle-wipe transition delay (375ms for attribute change)
    await page.waitForTimeout(1000);
    
    const toggledTheme = await page.locator('html').getAttribute('data-theme');
    expect(toggledTheme).not.toBe(initialTheme);

    // Toggle back to the initial theme
    await themeToggler.click();
    await page.waitForTimeout(1000);
    const finalTheme = await page.locator('html').getAttribute('data-theme');
    expect(finalTheme).toBe(initialTheme);

    // 3. Pattern Picker Toggling Verification
    const patternPickerTrigger = page.locator('button[title="Change background pattern"]');
    await expect(patternPickerTrigger).toBeVisible();
    await patternPickerTrigger.click();

    // The dropdown panel should be open, verifying some option button
    const dotsPatternBtn = page.locator('button[title="Dots"]');
    await expect(dotsPatternBtn).toBeVisible();

    // Click on Dots pattern
    await dotsPatternBtn.click();
    
    // Dropdown should close and data-pattern attribute should be set on <html>
    await expect(page.locator('html')).toHaveAttribute('data-pattern', 'dots');

    // Open pattern picker again and switch back to Grid
    await patternPickerTrigger.click();
    const gridPatternBtn = page.locator('button[title="Grid"]');
    await expect(gridPatternBtn).toBeVisible();
    await gridPatternBtn.click();

    await expect(page.locator('html')).toHaveAttribute('data-pattern', 'grid');
  });
});
