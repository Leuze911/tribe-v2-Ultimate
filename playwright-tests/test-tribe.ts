import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page: Page, name: string) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);
  return filePath;
}

async function runTest() {
  console.log('Starting Playwright test...');

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    // Step 1: Go to app
    console.log('\n=== Step 1: Opening app ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await takeScreenshot(page, '01-app-loaded');

    // Step 2: Check if we're on login page or need to navigate
    console.log('\n=== Step 2: Looking for login page ===');
    await delay(2000);

    // Look for email input
    const emailInput = await page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();

    if (await emailInput.isVisible().catch(() => false)) {
      console.log('Found login form');
      await takeScreenshot(page, '02-login-page');

      // Try to find register link/button
      const registerLink = await page.locator('text=inscription, text=register, text=créer un compte, text=sign up').first();

      if (await registerLink.isVisible().catch(() => false)) {
        console.log('\n=== Step 3: Going to register ===');
        await registerLink.click();
        await delay(2000);
        await takeScreenshot(page, '03-register-page');
      }
    }

    // Step 3: Try to register a new user
    console.log('\n=== Step 3: Attempting registration ===');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@tribe.test`;
    const testPassword = 'Test123!@#';
    const testName = `Test User ${timestamp}`;

    // Fill registration form if visible
    const nameInput = await page.locator('input[placeholder*="nom"], input[placeholder*="name"], input[placeholder*="Nom"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(testName);
      console.log('Filled name');
    }

    const regEmailInput = await page.locator('input[type="email"], input[placeholder*="email"]').first();
    if (await regEmailInput.isVisible().catch(() => false)) {
      await regEmailInput.fill(testEmail);
      console.log('Filled email');
    }

    const passwordInput = await page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(testPassword);
      console.log('Filled password');
    }

    // Look for second password field (confirm)
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 1) {
      await passwordInputs[1].fill(testPassword);
      console.log('Filled confirm password');
    }

    await takeScreenshot(page, '04-form-filled');

    // Submit form
    const submitBtn = await page.locator('button[type="submit"], button:has-text("inscription"), button:has-text("register"), button:has-text("créer"), button:has-text("sign up"), button:has-text("connexion"), button:has-text("login")').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      console.log('Clicking submit button');
      await submitBtn.click();
      await delay(3000);
      await takeScreenshot(page, '05-after-submit');
    }

    // Step 4: If registration failed, try login with existing user
    console.log('\n=== Step 4: Checking login status ===');
    await delay(2000);

    // Check if we need to login with existing credentials
    const loginEmailInput = await page.locator('input[type="email"]').first();
    if (await loginEmailInput.isVisible().catch(() => false)) {
      console.log('Still on login page, trying default credentials');
      await loginEmailInput.fill('test@example.com');

      const loginPasswordInput = await page.locator('input[type="password"]').first();
      if (await loginPasswordInput.isVisible().catch(() => false)) {
        await loginPasswordInput.fill('password123');
      }

      await takeScreenshot(page, '06-login-filled');

      const loginBtn = await page.locator('button[type="submit"], button:has-text("connexion"), button:has-text("login"), button:has-text("se connecter")').first();
      if (await loginBtn.isVisible().catch(() => false)) {
        await loginBtn.click();
        await delay(3000);
      }
    }

    await takeScreenshot(page, '07-after-login');

    // Step 5: Navigate to map and create POI
    console.log('\n=== Step 5: Looking for map/POI creation ===');
    await delay(2000);

    // Look for FAB or add button
    const addButton = await page.locator('[testID="fab-add-poi"], button:has-text("+"), [aria-label*="add"], [aria-label*="ajouter"]').first();
    if (await addButton.isVisible().catch(() => false)) {
      console.log('Found add POI button');
      await addButton.click();
      await delay(2000);
      await takeScreenshot(page, '08-add-poi-form');

      // Fill POI form
      const poiNameInput = await page.locator('input[placeholder*="nom"], input[placeholder*="name"]').first();
      if (await poiNameInput.isVisible().catch(() => false)) {
        await poiNameInput.fill('Test POI Playwright');
        console.log('Filled POI name');
      }

      const poiDescInput = await page.locator('textarea, input[placeholder*="description"]').first();
      if (await poiDescInput.isVisible().catch(() => false)) {
        await poiDescInput.fill('POI created by Playwright automated test');
        console.log('Filled POI description');
      }

      await takeScreenshot(page, '09-poi-form-filled');

      // Submit POI
      const createPoiBtn = await page.locator('button:has-text("créer"), button:has-text("create"), button:has-text("ajouter"), button:has-text("save")').first();
      if (await createPoiBtn.isVisible().catch(() => false)) {
        await createPoiBtn.click();
        await delay(3000);
        await takeScreenshot(page, '10-poi-created');
      }
    }

    // Step 6: Final screenshot of the app state
    console.log('\n=== Step 6: Final state ===');
    await takeScreenshot(page, '11-final-state');

    console.log('\n=== Test completed! ===');
    console.log(`Screenshots saved in: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('Test error:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
