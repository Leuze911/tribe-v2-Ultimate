import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:4000/api/v1';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

const TEST_EMAIL = 'test@tribe.com';
const TEST_PASSWORD = 'Test123456';

// Clear screenshots dir
if (fs.existsSync(SCREENSHOTS_DIR)) {
  fs.readdirSync(SCREENSHOTS_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOTS_DIR, f)));
} else {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let counter = 1;
async function screenshot(page: Page, name: string): Promise<string> {
  const filePath = path.join(SCREENSHOTS_DIR, `${String(counter++).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  📸 Screenshot: ${name}`);
  return filePath;
}

async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('  DEBUG TEST - TRIBE LOGIN');
  console.log('='.repeat(60));

  // First test API directly
  console.log('\n[0] Test API Direct');
  console.log('-'.repeat(50));

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    const data = await response.json();
    console.log(`  API Status: ${response.status}`);
    console.log(`  API Response: ${JSON.stringify(data).substring(0, 100)}...`);
    if (response.ok) {
      console.log('  ✅ API LOGIN WORKS');
    } else {
      console.log('  ❌ API LOGIN FAILED');
    }
  } catch (e) {
    console.log(`  ❌ API ERROR: ${e}`);
  }

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Collect all console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    // Only show important ones
    if (text.includes('🔐') || text.includes('📤') || text.includes('📥') ||
        text.includes('Error') || text.includes('error') ||
        text.includes('✅') || text.includes('❌') ||
        text.includes('API') || text.includes('login')) {
      console.log(`  [Console] ${text.substring(0, 120)}`);
    }
  });

  // Track network requests
  page.on('request', request => {
    if (request.url().includes('/auth/')) {
      console.log(`  [Request] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/auth/')) {
      console.log(`  [Response] ${response.status()} ${response.url()}`);
    }
  });

  // Intercept and fix API URL
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    // Replace any IP:4000 with localhost:4000
    if (url.includes(':4000') && !url.includes('localhost:4000')) {
      const newUrl = url.replace(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:4000/, 'localhost:4000');
      console.log(`  [Route] Redirecting to: ${newUrl.substring(0, 80)}...`);
      await route.continue({ url: newUrl });
    } else {
      await route.continue();
    }
  });

  try {
    console.log('\n[1] Loading login page');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('  Page loaded, waiting for initialization...');
    await delay(5000);
    await screenshot(page, '01-login-page');

    // Check if button is enabled
    const loginBtn = page.locator('[data-testid="login-button"]');
    const btnDisabled = await loginBtn.getAttribute('disabled');
    const btnVisible = await loginBtn.isVisible();
    console.log(`  Login button visible: ${btnVisible}`);
    console.log(`  Login button disabled: ${btnDisabled}`);

    // Get button text/state
    const btnText = await loginBtn.textContent();
    console.log(`  Login button text: "${btnText}"`);

    console.log('\n[2] Fill form');
    console.log('-'.repeat(50));

    // Use testID selectors
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');

    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passwordVisible = await passwordInput.isVisible().catch(() => false);
    console.log(`  Email input visible (testid): ${emailVisible}`);
    console.log(`  Password input visible (testid): ${passwordVisible}`);

    if (emailVisible && passwordVisible) {
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      console.log(`  Filled: ${TEST_EMAIL} / ********`);
    } else {
      // Fallback to generic selectors
      console.log('  Using fallback selectors...');
      const inputs = page.locator('input');
      const count = await inputs.count();
      console.log(`  Found ${count} inputs`);

      if (count >= 2) {
        await inputs.nth(0).fill(TEST_EMAIL);
        await inputs.nth(1).fill(TEST_PASSWORD);
        console.log(`  Filled via fallback: ${TEST_EMAIL} / ********`);
      }
    }

    await screenshot(page, '02-form-filled');

    console.log('\n[3] Click login');
    console.log('-'.repeat(50));

    // Check button state again
    const btnDisabledNow = await loginBtn.isDisabled().catch(() => null);
    console.log(`  Button disabled before click: ${btnDisabledNow}`);

    if (btnDisabledNow) {
      console.log('  ⚠️ Button is disabled, waiting more...');
      await delay(3000);
    }

    await loginBtn.click();
    console.log('  Clicked login button');

    // Wait for navigation or response
    console.log('  Waiting for response...');
    await delay(5000);

    await screenshot(page, '03-after-click');

    // Check current URL
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (currentUrl.includes('map')) {
      console.log('\n  ✅ LOGIN SUCCESS - redirected to map');
    } else if (currentUrl.includes('login')) {
      console.log('\n  ❌ LOGIN FAILED - still on login page');

      // Check for error messages
      const bodyText = await page.locator('body').textContent();
      if (bodyText?.toLowerCase().includes('erreur') || bodyText?.toLowerCase().includes('incorrect')) {
        console.log('  Error message found on page');
      }

      // Show last console logs
      console.log('\n  Last 20 console logs:');
      consoleLogs.slice(-20).forEach(log => {
        console.log(`    ${log.substring(0, 100)}`);
      });
    }

    // Also navigate to map directly to test
    console.log('\n[4] Direct navigation to map');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/map`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, '04-map-page');
    console.log(`  Map URL: ${page.url()}`);

    console.log('\n' + '='.repeat(60));
    console.log('  TEST COMPLETE');
    console.log('='.repeat(60));

    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\n  Screenshots saved: ${screenshots.length}`);
    screenshots.forEach(s => console.log(`    - ${s}`));
    console.log(`\n  Directory: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('\n[ERROR]', error);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
