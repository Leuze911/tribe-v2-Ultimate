import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:4000/api/v1';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

const TEST_EMAIL = 'test@tribe.com';
const TEST_PASSWORD = 'Test123456';

// Clear screenshots
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
  console.log(`  📸 ${name}`);
  return filePath;
}

async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('  TRIBE JS DEBUG TEST');
  console.log('='.repeat(60));

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Capture ALL console output
  page.on('console', msg => {
    console.log(`  [Browser] ${msg.text().substring(0, 200)}`);
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`  [PageError] ${err.message.substring(0, 200)}`);
  });

  try {
    console.log('\n[1] Load Page');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await screenshot(page, 'initial');

    console.log('\n[2] Check Environment');
    console.log('-'.repeat(50));

    // Check the API URL in the browser context
    const apiUrl = await page.evaluate(() => {
      // Check process.env (may not work in browser)
      const env = (window as any).__EXPO_ENV_VARS__;
      return env || 'ENV not found';
    });
    console.log(`  Expo ENV: ${JSON.stringify(apiUrl).substring(0, 100)}`);

    console.log('\n[3] Fill Form via JS');
    console.log('-'.repeat(50));

    // Fill the form using JavaScript
    await page.evaluate(({ email, password }) => {
      // Find inputs by testID
      const emailInput = document.querySelector('[data-testid="email-input"]') as HTMLInputElement;
      const passwordInput = document.querySelector('[data-testid="password-input"]') as HTMLInputElement;

      if (emailInput) {
        emailInput.value = email;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Email input filled:', email);
      } else {
        console.log('Email input NOT FOUND');
      }

      if (passwordInput) {
        passwordInput.value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Password input filled');
      } else {
        console.log('Password input NOT FOUND');
      }
    }, { email: TEST_EMAIL, password: TEST_PASSWORD });

    await delay(1000);
    await screenshot(page, 'form-filled-js');

    console.log('\n[4] Try Direct API Call from Browser');
    console.log('-'.repeat(50));

    // Make a direct fetch call from the browser to test if API is reachable
    const apiTest = await page.evaluate(async ({ url, email, password }) => {
      try {
        console.log('Making direct API call to:', url);
        const response = await fetch(url + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data).substring(0, 100));
        return { status: response.status, data };
      } catch (error: any) {
        console.log('API Error:', error.message);
        return { error: error.message };
      }
    }, { url: API_URL, email: TEST_EMAIL, password: TEST_PASSWORD });

    console.log(`  API Test Result: ${JSON.stringify(apiTest).substring(0, 150)}`);

    console.log('\n[5] Click Button');
    console.log('-'.repeat(50));

    // Try clicking with force
    const loginBtn = page.locator('[data-testid="login-button"]');
    await loginBtn.click({ force: true });
    console.log('  Clicked login button');

    await delay(5000);
    await screenshot(page, 'after-click');

    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (currentUrl.includes('map')) {
      console.log('\n  ✅ LOGIN SUCCESS');
    } else {
      console.log('\n  ❌ LOGIN FAILED - Still on login page');
    }

    console.log('\n' + '='.repeat(60));
    console.log('  TEST COMPLETE');
    console.log('='.repeat(60));

    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\n  Screenshots: ${screenshots.length}`);
    screenshots.forEach(s => console.log(`    - ${s}`));

  } catch (error) {
    console.error('\n[ERROR]', error);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
