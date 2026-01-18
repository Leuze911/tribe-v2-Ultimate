/**
 * TRIBE Login Proof Test
 *
 * This test proves that the login functionality works by:
 * 1. Filling in credentials
 * 2. Clicking the login button
 * 3. Verifying the API call succeeds
 * 4. Verifying the token is stored in localStorage
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOT_PATH = '/tmp/tribe-login-proof.png';

async function testLoginProof() {
  console.log('\n========================================');
  console.log('  TRIBE LOGIN PROOF TEST');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  let apiCallSuccess = false;
  let tokenStored = false;
  let loginLogs: string[] = [];

  // Capture login-related logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔐') || text.includes('login') || text.includes('Login') || text.includes('API')) {
      loginLogs.push(text);
      console.log(`  📝 ${text}`);
    }
  });

  // Capture API response
  page.on('response', res => {
    if (res.url().includes('/auth/login')) {
      apiCallSuccess = res.status() === 200;
      console.log(`  📡 API Response: ${res.status()}`);
    }
  });

  try {
    // Load login page
    console.log('1. Loading login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   ✓ Page loaded\n');

    // Fill credentials
    console.log('2. Filling credentials...');
    await page.fill('[data-testid="email-input"]', 'test@tribe.sn');
    await page.fill('[data-testid="password-input"]', 'password123');
    console.log('   ✓ Credentials filled\n');

    // Click login button
    console.log('3. Clicking login button...');
    await page.click('[data-testid="login-button"]');
    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✓ Button clicked\n');

    // Check for token in localStorage
    console.log('4. Checking localStorage for token...');
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    tokenStored = !!token;
    if (token) {
      console.log(`   ✓ Token found: ${token.substring(0, 40)}...\n`);
    } else {
      console.log('   ✗ No token found\n');
    }

    // Take screenshot
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`5. Screenshot saved: ${SCREENSHOT_PATH}\n`);

  } catch (e: any) {
    console.log(`\n❌ Error: ${e.message}`);
  }

  await browser.close();

  // Print summary
  console.log('========================================');
  console.log('  SUMMARY');
  console.log('========================================');
  console.log(`  API Call Success: ${apiCallSuccess ? '✅ YES' : '❌ NO'}`);
  console.log(`  Token Stored:     ${tokenStored ? '✅ YES' : '❌ NO'}`);
  console.log('========================================\n');

  if (apiCallSuccess && tokenStored) {
    console.log('🎉 LOGIN IS WORKING! 🎉\n');
    console.log('The login flow is functional:');
    console.log('1. User enters credentials ✓');
    console.log('2. API call to /auth/login succeeds ✓');
    console.log('3. Token is stored in localStorage ✓');
    console.log('\nNote: Navigation to /map fails due to BottomSheet using');
    console.log('react-native-reanimated which is not web-compatible.');
    console.log('This is a separate issue from authentication.\n');
    return true;
  } else {
    console.log('❌ LOGIN NOT WORKING\n');
    return false;
  }
}

testLoginProof().then(success => {
  process.exit(success ? 0 : 1);
});
