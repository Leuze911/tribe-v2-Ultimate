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
  console.log('  TRIBE LOGIN TEST - COMPLETE FLOW');
  console.log('='.repeat(60));

  // Test API first
  console.log('\n[0] Test API');
  console.log('-'.repeat(50));
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    const data = await response.json();
    console.log(`  API Status: ${response.status}`);
    if (response.ok) {
      console.log('  ✅ API works');
    }
  } catch (e) {
    console.log(`  ❌ API Error: ${e}`);
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

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log(`  [Browser] ${text.substring(0, 150)}`);
  });

  // Intercept ALL requests to fix API URL
  await page.route('**/*', async (route) => {
    const url = route.request().url();

    // Redirect any IP:4000 to localhost:4000
    if (url.includes(':4000') && !url.includes('localhost:4000')) {
      const newUrl = url.replace(/https?:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:4000/, 'http://localhost:4000');
      console.log(`  [Route] ${url.substring(0, 60)} -> localhost:4000`);
      await route.continue({ url: newUrl });
    } else {
      await route.continue();
    }
  });

  // Also track network requests
  page.on('request', req => {
    if (req.url().includes('4000')) {
      console.log(`  [Request] ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', res => {
    if (res.url().includes('4000')) {
      console.log(`  [Response] ${res.status()} ${res.url()}`);
    }
  });

  try {
    console.log('\n[1] Load Login Page');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await screenshot(page, 'login-page');

    console.log('\n[2] Fill Form');
    console.log('-'.repeat(50));

    // Wait for inputs to be ready
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
    await page.locator('[data-testid="email-input"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="password-input"]').fill(TEST_PASSWORD);
    console.log(`  Filled: ${TEST_EMAIL} / ********`);
    await screenshot(page, 'form-filled');

    console.log('\n[3] Click Login');
    console.log('-'.repeat(50));

    // Get button state before click
    const btnText = await page.locator('[data-testid="login-button"]').textContent();
    console.log(`  Button text: "${btnText}"`);

    // Click and wait for navigation or network activity
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/auth/login'), { timeout: 10000 }).catch(() => null),
      page.locator('[data-testid="login-button"]').click(),
    ]);

    console.log('  Waiting for result...');
    await delay(5000);
    await screenshot(page, 'after-login');

    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (currentUrl.includes('map')) {
      console.log('\n  ✅ LOGIN SUCCESS - Redirected to map');

      console.log('\n[4] View Map');
      console.log('-'.repeat(50));
      await delay(2000);
      await screenshot(page, 'map-view');

      console.log('\n[5] Navigate to Profile');
      console.log('-'.repeat(50));
      await page.goto(`${BASE_URL}/(app)/profile`, { waitUntil: 'networkidle', timeout: 30000 });
      await delay(2000);
      await screenshot(page, 'profile-view');

    } else {
      console.log('\n  ❌ LOGIN FAILED - Still on login page');

      // Check for error messages
      const pageContent = await page.content();
      if (pageContent.includes('Erreur') || pageContent.includes('incorrect')) {
        console.log('  Found error message on page');
      }

      // Try to evaluate JavaScript to see the state
      try {
        const storeState = await page.evaluate(() => {
          // Try to access the React state
          return (window as any).__EXPO_ROUTER_STATE__ || 'not found';
        });
        console.log(`  Store state: ${JSON.stringify(storeState).substring(0, 100)}`);
      } catch {}
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
