import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8082';
const API_URL = 'http://localhost:4000/api/v1';
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
  console.log('  TRIBE LOGIN TEST');
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
    const data = await response.json() as any;
    console.log(`  API Status: ${response.status}`);
    if (response.ok) {
      console.log('  ✅ API login works');
      console.log(`  User: ${data.user?.email}`);
    } else {
      console.log(`  ❌ API Error: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.log(`  ❌ API Error: ${e}`);
    return;
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

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔐') || text.includes('📤') || text.includes('📥') || text.includes('error') || text.includes('Error')) {
      console.log(`  [Browser] ${text.substring(0, 200)}`);
    }
  });

  // Track network
  page.on('response', res => {
    if (res.url().includes('4000')) {
      console.log(`  [Network] ${res.status()} ${res.url().split('/').pop()}`);
    }
  });

  try {
    console.log('\n[1] Load Login Page');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(3000);
    await screenshot(page, 'login-page');

    // Check for JS errors
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    console.log('\n[2] Fill Form');
    console.log('-'.repeat(50));

    // Wait for inputs
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
    await page.locator('[data-testid="email-input"]').fill(TEST_EMAIL);
    await page.locator('[data-testid="password-input"]').fill(TEST_PASSWORD);
    console.log(`  Filled: ${TEST_EMAIL} / ********`);
    await screenshot(page, 'form-filled');

    console.log('\n[3] Click Login Button');
    console.log('-'.repeat(50));

    const button = page.locator('[data-testid="login-button"]');
    const btnText = await button.textContent();
    console.log(`  Button: "${btnText}"`);

    // Click and wait
    await button.click();
    console.log('  Clicked!');

    // Wait for response or navigation
    await delay(5000);
    await screenshot(page, 'after-click');

    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (pageErrors.length > 0) {
      console.log('\n  ⚠️ Page errors:');
      pageErrors.forEach(e => console.log(`    - ${e.substring(0, 100)}`));
    }

    if (currentUrl.includes('map')) {
      console.log('\n  ✅ SUCCESS - Redirected to map!');
      await delay(2000);
      await screenshot(page, 'map-success');
    } else {
      console.log('\n  ❌ STILL ON LOGIN PAGE');

      // Check page content for errors
      const content = await page.content();
      if (content.includes('Erreur')) {
        console.log('  Found error message');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('  SCREENSHOTS:');
    const shots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    shots.forEach(s => console.log(`  /tmp/tribe-screenshots/${s}`));
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n[ERROR]', error);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
