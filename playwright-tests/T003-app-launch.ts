/**
 * T003 - Mobile App Launches
 * Verifies the app loads successfully in the browser
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOT_PATH = 'test-evidence/screenshots/T003-app-launch.png';

async function testAppLaunch() {
  console.log('\n========================================');
  console.log('  T003 - Mobile App Launches');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let passed = false;
  let errorMessage = '';

  page.on('pageerror', err => {
    console.log(`  [Page Error] ${err.message}`);
  });

  try {
    console.log('1. Loading app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✓ Page loaded\n');

    // Check if any content is visible
    console.log('2. Checking for app content...');
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`   Content length: ${bodyContent} characters`);

    if (bodyContent > 50) {
      console.log('   ✓ App content is rendering\n');
    }

    // Check for specific app elements
    console.log('3. Checking for UI elements...');
    const hasRoot = await page.$('#root');
    const hasTribeText = await page.locator('text=Tribe').count();

    console.log(`   - Root element: ${hasRoot ? '✓' : '✗'}`);
    console.log(`   - Tribe branding: ${hasTribeText > 0 ? '✓' : '✗'}`);

    // Take screenshot
    console.log('\n4. Taking screenshot...');
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`   ✓ Screenshot saved: ${SCREENSHOT_PATH}`);

    passed = hasRoot !== null && bodyContent > 50;

  } catch (e: any) {
    errorMessage = e.message;
    console.log(`\n❌ Error: ${e.message}`);
    await page.screenshot({ path: SCREENSHOT_PATH.replace('.png', '-error.png'), fullPage: true });
  }

  await browser.close();

  // Result
  console.log('\n========================================');
  console.log(`  RESULT: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (errorMessage) {
    console.log(`  Error: ${errorMessage}`);
  }
  console.log('========================================\n');

  return passed;
}

testAppLaunch().then(success => {
  process.exit(success ? 0 : 1);
});
