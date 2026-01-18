/**
 * T005 - Login Email/Password Success
 * Verifies successful login with valid credentials
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOT_DIR = 'test-evidence/screenshots';

async function testLoginSuccess() {
  console.log('\n========================================');
  console.log('  T005 - Login Email/Password Success');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let apiCallSuccess = false;
  let tokenStored = false;
  let navigationTriggered = false;

  // Track API calls
  page.on('response', res => {
    if (res.url().includes('/auth/login')) {
      apiCallSuccess = res.status() === 200;
      console.log(`  📡 API Response: ${res.status()}`);
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('navigating to map')) {
      navigationTriggered = true;
    }
    if (text.includes('🔐')) {
      console.log(`  ${text}`);
    }
  });

  try {
    // Step 1: Load login page
    console.log('1. Loading login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   ✓ Page loaded\n');

    // Step 2: Fill credentials
    console.log('2. Filling credentials...');
    await page.fill('[data-testid="email-input"]', 'test@tribe.sn');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/T005-1-form-filled.png`, fullPage: true });
    console.log('   ✓ Credentials filled');
    console.log('   📸 Screenshot: T005-1-form-filled.png\n');

    // Step 3: Click login button
    console.log('3. Clicking login button...');
    await page.click('[data-testid="login-button"]');
    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✓ Button clicked\n');

    // Step 4: Verify token stored
    console.log('4. Verifying token storage...');
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    tokenStored = !!token;
    if (token) {
      console.log(`   ✓ Token stored: ${token.substring(0, 40)}...`);
    } else {
      console.log('   ✗ No token found');
    }

    // Take final screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/T005-2-after-login.png`, fullPage: true });
    console.log('   📸 Screenshot: T005-2-after-login.png');

  } catch (e: any) {
    console.log(`\n❌ Error: ${e.message}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/T005-error.png`, fullPage: true });
  }

  await browser.close();

  // Determine pass/fail
  const passed = apiCallSuccess && tokenStored;

  console.log('\n========================================');
  console.log('  VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`  API call success (200): ${apiCallSuccess ? '✅' : '❌'}`);
  console.log(`  Token stored:          ${tokenStored ? '✅' : '❌'}`);
  console.log(`  Navigation triggered:  ${navigationTriggered ? '✅' : '❌'}`);
  console.log('========================================');
  console.log(`  RESULT: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('========================================\n');

  return passed;
}

testLoginSuccess().then(success => {
  process.exit(success ? 0 : 1);
});
