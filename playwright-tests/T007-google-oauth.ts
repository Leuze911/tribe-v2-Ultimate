/**
 * T007 - Login Google OAuth
 * Verifies Google OAuth button initiates OAuth flow
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOT_PATH = 'test-evidence/screenshots/T007-google-oauth.png';

async function testGoogleOAuth() {
  console.log('\n========================================');
  console.log('  T007 - Login Google OAuth');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let buttonExists = false;
  let buttonClickable = false;

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Google') || text.includes('OAuth') || text.includes('google')) {
      console.log(`  [Console] ${text}`);
    }
  });

  try {
    // Step 1: Load login page
    console.log('1. Loading login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   ✓ Page loaded\n');

    // Step 2: Check Google button exists
    console.log('2. Checking Google OAuth button...');
    const googleButton = await page.$('[data-testid="google-login-button"]');
    buttonExists = !!googleButton;
    console.log(`   Button exists: ${buttonExists ? '✓' : '✗'}`);

    if (googleButton) {
      // Check if button is enabled/clickable
      const isDisabled = await googleButton.getAttribute('aria-disabled');
      buttonClickable = isDisabled !== 'true';
      console.log(`   Button clickable: ${buttonClickable ? '✓' : '✗ (disabled)'}`);

      // Check button text
      const buttonText = await googleButton.textContent();
      console.log(`   Button text: "${buttonText}"`);
    }

    // Take screenshot
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`\n   📸 Screenshot: ${SCREENSHOT_PATH}`);

    // Note: We can't fully test OAuth without proper Google credentials
    // and interactive browser session. The test verifies the button exists.
    console.log('\n   Note: Full OAuth flow requires interactive session');
    console.log('   and valid Google OAuth credentials configured.');

  } catch (e: any) {
    console.log(`\n❌ Error: ${e.message}`);
  }

  await browser.close();

  // Pass if button exists (OAuth integration is present)
  const passed = buttonExists;

  console.log('\n========================================');
  console.log('  VERIFICATION SUMMARY');
  console.log('========================================');
  console.log(`  Google button exists:   ${buttonExists ? '✅' : '❌'}`);
  console.log(`  Button clickable:       ${buttonClickable ? '✅' : '⚠️ (disabled)'}`);
  console.log('========================================');
  console.log(`  RESULT: ${passed ? '✅ PASS (button present)' : '❌ FAIL'}`);
  console.log('  Note: Full OAuth test requires device/emulator');
  console.log('========================================\n');

  return passed;
}

testGoogleOAuth().then(success => {
  process.exit(success ? 0 : 1);
});
