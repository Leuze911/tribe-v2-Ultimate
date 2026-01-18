/**
 * T004 - Login Screen Displayed
 * Verifies all login screen elements are present
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8082';
const SCREENSHOT_PATH = 'test-evidence/screenshots/T004-login-screen.png';

async function testLoginScreen() {
  console.log('\n========================================');
  console.log('  T004 - Login Screen Displayed');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const results: { element: string; found: boolean }[] = [];

  try {
    console.log('1. Loading login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    console.log('   ✓ Page loaded\n');

    console.log('2. Verifying login screen elements...\n');

    // Check each required element
    const elementsToCheck = [
      { name: 'Email input', selector: '[data-testid="email-input"]' },
      { name: 'Password input', selector: '[data-testid="password-input"]' },
      { name: 'Login button', selector: '[data-testid="login-button"]' },
      { name: 'Google login button', selector: '[data-testid="google-login-button"]' },
      { name: 'Register link', selector: '[data-testid="register-link"]' },
    ];

    for (const el of elementsToCheck) {
      const found = await page.$(el.selector);
      const status = found ? '✅' : '❌';
      console.log(`   ${status} ${el.name}`);
      results.push({ element: el.name, found: !!found });
    }

    // Also check for visible text
    console.log('\n3. Verifying visible text...\n');
    const textChecks = [
      { name: 'Tribe branding', text: 'Tribe' },
      { name: 'Email label', text: 'Email' },
      { name: 'Password label', text: 'Mot de passe' },
      { name: 'Login button text', text: 'Se connecter' },
      { name: 'Register prompt', text: 'inscrire' },
    ];

    for (const tc of textChecks) {
      const found = await page.locator(`text=${tc.text}`).count() > 0;
      const status = found ? '✅' : '❌';
      console.log(`   ${status} "${tc.text}" visible`);
      results.push({ element: tc.name, found });
    }

    // Take screenshot
    console.log('\n4. Taking screenshot...');
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log(`   ✓ Screenshot saved: ${SCREENSHOT_PATH}`);

  } catch (e: any) {
    console.log(`\n❌ Error: ${e.message}`);
  }

  await browser.close();

  // Calculate pass/fail
  const allPassed = results.every(r => r.found);
  const passCount = results.filter(r => r.found).length;

  console.log('\n========================================');
  console.log(`  RESULT: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Elements found: ${passCount}/${results.length}`);
  console.log('========================================\n');

  return allPassed;
}

testLoginScreen().then(success => {
  process.exit(success ? 0 : 1);
});
