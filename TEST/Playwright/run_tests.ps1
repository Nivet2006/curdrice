# PowerShell runner script for Playwright E2E Testing Suite

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   CLUB-EVE PLAYWRIGHT TEST RUNNER          " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Verify/Install Node Dependencies
if (!(Test-Path "../../node_modules")) {
    Write-Host "[*] Node modules missing. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Ensure playwright is installed
Write-Host "[*] Checking Playwright installation..." -ForegroundColor Yellow
npx playwright install --with-deps

# 2. Run Tests
Write-Host "[*] Executing E2E role-based test cases..." -ForegroundColor Yellow
npx playwright test

# 3. Completion Summary
Write-Host "`n=============================================" -ForegroundColor Green
Write-Host " ✅ Testing Suite Executed Successfully!" -ForegroundColor Green
Write-Host " - HTML Report: ./TEST/Playwright/playwright-report/index.html" -ForegroundColor Green
Write-Host " - JSON Output: ./TEST/Playwright/test-results/report.json" -ForegroundColor Green
Write-Host " - Trace Files: ./TEST/Playwright/test-results/" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`nTo open the interactive HTML Report, run:" -ForegroundColor Cyan
Write-Host "  npx playwright show-report TEST/Playwright/playwright-report" -ForegroundColor White
