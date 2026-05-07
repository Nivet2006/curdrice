@echo off
echo =============================================
echo    CLUB-EVE PLAYWRIGHT TEST RUNNER (BATCH)
echo =============================================

echo [*] Installing dependencies if missing...
call npm install

echo [*] Installing Playwright browsers...
call npx playwright install --with-deps

echo [*] Executing E2E role-based test cases...
call npx playwright test

echo.
echo =============================================
echo  SUCCESS: Test execution complete.
echo  HTML Report: TEST/Playwright/playwright-report/index.html
echo =============================================
pause
