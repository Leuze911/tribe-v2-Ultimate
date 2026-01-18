import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

const TEST_EMAIL = 'test@tribe.sn';
const TEST_PASSWORD = 'password123';

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
  console.log('  TRIBE LOGIN DEBUG TEST');
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

  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`  [Console ${msg.type()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`  [PAGE ERROR] ${err.message}`);
  });

  // Capture request failures
  page.on('requestfailed', req => {
    console.log(`  [Request Failed] ${req.url()} - ${req.failure()?.errorText}`);
  });

  try {
    console.log('\n[1] Load Page');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await screenshot(page, 'loaded');

    console.log('\n[2] Fill and Click');
    console.log('-'.repeat(50));

    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
    await page.locator('[data-testid="email-input"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="password-input"]').fill(TEST_PASSWORD);

    console.log('  Form filled');

    // Click with more detail
    const button = page.locator('[data-testid="login-button"]');

    // Check if button is disabled
    const isDisabled = await button.isDisabled();
    console.log(`  Button disabled: ${isDisabled}`);

    // Click and capture network
    console.log('  Clicking button...');

    const responsePromise = page.waitForResponse(
      res => res.url().includes('/auth/login'),
      { timeout: 10000 }
    ).catch(e => {
      console.log(`  No /auth/login request detected: ${e.message}`);
      return null;
    });

    await button.click();
    console.log('  Button clicked');

    const response = await responsePromise;
    if (response) {
      console.log(`  Got response: ${response.status()}`);
      const body = await response.json().catch(() => null);
      console.log(`  Response body: ${JSON.stringify(body).substring(0, 100)}`);
    }

    await delay(3000);
    await screenshot(page, 'after-click');

    const url = page.url();
    console.log(`  Final URL: ${url}`);

    if (url.includes('map')) {
      console.log('\n  ✅ SUCCESS!');
    } else {
      console.log('\n  ❌ FAILED - Still on login');

      // Try to evaluate localStorage
      const token = await page.evaluate(() => {
        return localStorage.getItem('accessToken');
      });
      console.log(`  Token in localStorage: ${token ? 'YES' : 'NO'}`);
    }

  } catch (error: any) {
    console.error('\n[ERROR]', error.message);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }

  console.log('\n' + '='.repeat(60));
  const shots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  shots.forEach(s => console.log(`  ${SCREENSHOTS_DIR}/${s}`));
}

runTest().catch(console.error);
