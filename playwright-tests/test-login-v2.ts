import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots-v2';
const TEST_EMAIL = 'test@tribe.sn';
const TEST_PASSWORD = 'password123';

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
  console.log('  TRIBE LOGIN DEBUG TEST v2');
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

  // Capture ALL console messages with more detail
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    // Show all console logs, especially for debugging
    if (type === 'error' || text.includes('🔐') || text.includes('API') || text.includes('Error')) {
      console.log(`  [${type.toUpperCase()}] ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log(`  [PAGE ERROR] ${err.message}`);
  });

  // Capture all network requests
  page.on('request', req => {
    if (req.url().includes('/api/') || req.url().includes('/auth')) {
      console.log(`  [REQUEST] ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', res => {
    if (res.url().includes('/api/') || res.url().includes('/auth')) {
      console.log(`  [RESPONSE] ${res.status()} ${res.url()}`);
    }
  });

  page.on('requestfailed', req => {
    console.log(`  [FAILED] ${req.url()} - ${req.failure()?.errorText}`);
  });

  try {
    console.log('\n[1] Load Page');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(2000);
    await screenshot(page, '01-loaded');

    // Check for JavaScript errors by evaluating
    const hasReactError = await page.evaluate(() => {
      const errorElement = document.querySelector('[data-testid="error-message"]');
      return errorElement ? errorElement.textContent : null;
    });
    if (hasReactError) {
      console.log(`  React Error: ${hasReactError}`);
    }

    console.log('\n[2] Fill Form');
    console.log('-'.repeat(50));

    // Wait for inputs
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
    console.log('  Found email input');

    // Fill email
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.click();
    await emailInput.fill(TEST_EMAIL);
    console.log('  Email filled');

    // Fill password
    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.click();
    await passwordInput.fill(TEST_PASSWORD);
    console.log('  Password filled');

    await screenshot(page, '02-form-filled');

    console.log('\n[3] Click Login Button');
    console.log('-'.repeat(50));

    const button = page.locator('[data-testid="login-button"]');

    // Get button state
    const isVisible = await button.isVisible();
    const isEnabled = await button.isEnabled();
    const buttonText = await button.textContent();
    console.log(`  Button visible: ${isVisible}`);
    console.log(`  Button enabled: ${isEnabled}`);
    console.log(`  Button text: ${buttonText}`);

    // Try to listen for click events
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="login-button"]');
      if (btn) {
        btn.addEventListener('click', () => {
          console.log('  [JS] Button click event fired!');
        });
      }
    });

    // Wait for any network activity after click
    console.log('  Clicking...');

    // Start monitoring network
    const networkPromise = page.waitForResponse(
      res => res.url().includes('/auth/login'),
      { timeout: 8000 }
    ).catch(() => null);

    // Click with force to ensure it works
    await button.click({ force: true });
    console.log('  Click sent');

    // Also try to trigger via keyboard (press Enter while focused on password)
    await delay(500);
    await passwordInput.focus();
    await page.keyboard.press('Enter');
    console.log('  Enter key pressed');

    // Wait for response
    const networkResponse = await networkPromise;
    if (networkResponse) {
      console.log(`  Got network response: ${networkResponse.status()}`);
      const body = await networkResponse.json().catch(() => 'parse failed');
      console.log(`  Response body: ${JSON.stringify(body).substring(0, 200)}`);
    } else {
      console.log('  No /auth/login network request detected');
    }

    await delay(3000);
    await screenshot(page, '03-after-click');

    console.log('\n[4] Check Result');
    console.log('-'.repeat(50));

    const finalUrl = page.url();
    console.log(`  Final URL: ${finalUrl}`);

    // Check token
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    console.log(`  Token in localStorage: ${token ? 'YES (' + token.substring(0, 20) + '...)' : 'NO'}`);

    // Check if there's an error message on screen
    const pageContent = await page.content();
    if (pageContent.includes('Erreur') || pageContent.includes('error')) {
      console.log('  Page contains error message');
    }

    if (finalUrl.includes('map') || finalUrl.includes('(app)')) {
      console.log('\n  ✅ SUCCESS - Redirected to map!');
    } else if (token) {
      console.log('\n  ⚠️  PARTIAL - Token saved but no redirect');
    } else {
      console.log('\n  ❌ FAILED - Still on login, no token');
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
