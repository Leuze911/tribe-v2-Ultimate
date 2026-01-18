/**
 * T006 - Login Email/Password Error
 * Verifies error handling with invalid credentials
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOT_PATH = 'test-evidence/screenshots/T006-login-error.png';

async function testLoginError() {
  console.log('\n========================================');
  console.log('  T006 - Login Email/Password Error');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let apiCallFailed = false;
  let stayedOnLogin = false;
  let noTokenStored = false;

  // Track API calls
  page.on('response', res => {
    if (res.url().includes('/auth/login')) {
      apiCallFailed = res.status() === 401 || res.status() === 400;
      console.log(`  📡 API Response: ${res.status()}`);
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔐') || text.includes('Error') || text.includes('error')) {
      console.log(`  ${text}`);
    }
  });

  try {
    // Step 1: Load login page
    console.log('1. Loading login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   ✓ Page loaded\n');

    // Step 2: Fill WRONG credentials
    console.log('2. Filling WRONG credentials...');
    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    console.log('   ✓ Wrong credentials filled\n');

    // Step 3: Click login button
    console.log('3. Clicking login button...');
    await page.click('[data-testid="login-button"]');
    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✓ Button clicked\n');

    // Step 4: Verify still on login page
    console.log('4. Verifying stayed on login page...');
    const currentUrl = page.url();
    stayedOnLogin = currentUrl.includes('login');
    console.log(`   Current URL: ${currentUrl}`);
    console.log(`   Stayed on login: ${stayedOnLogin ? '✓' : '✗'}`);

    // Step 5: Verify no token stored
    console.log('\n5. Verifying no token stored...');
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    noTokenStored = !token;
    console.log(`   Token stored: ${token ? 'Yes (WRONG!)' : 'No (correct)'}`);

    // Take screenshot
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`\n   📸 Screenshot: ${SCREENSHOT_PATH}`);

  } catch (e: any) {
    console.log(`\n❌ Error: ${e.message}`);
  }

  await browser.close();

  // Determine pass/fail - for error case, we WANT the login to fail
  const passed = apiCallFailed && stayedOnLogin && noTokenStored;

  console.log('\n========================================');
  console.log('  VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`  API rejected (401/400): ${apiCallFailed ? '✅' : '❌'}`);
  console.log(`  Stayed on login:        ${stayedOnLogin ? '✅' : '❌'}`);
  console.log(`  No token stored:        ${noTokenStored ? '✅' : '❌'}`);
  console.log('========================================');
  console.log(`  RESULT: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('========================================\n');

  return passed;
}

testLoginError().then(success => {
  process.exit(success ? 0 : 1);
});
