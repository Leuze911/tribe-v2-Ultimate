import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:4000/api/v1';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

const TEST_EMAIL = 'test@tribe.com';
const TEST_PASSWORD = 'Test123456';

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
  console.log(`    [Screenshot] ${name}`);
  return filePath;
}

async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('    TEST LOGIN FINAL - AVEC CORRECTIONS');
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

  // Intercept requests to redirect API calls
  await page.route('**/192.168.1.132:4000/**', async (route) => {
    const url = route.request().url().replace('192.168.1.132:4000', 'localhost:4000');
    console.log(`    [Redirect] ${url.substring(40, 80)}...`);
    await route.continue({ url });
  });

  // Log console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔐') || text.includes('📤') || text.includes('📥') || text.includes('Error')) {
      console.log(`    [Console] ${text.substring(0, 100)}`);
    }
  });

  try {
    console.log('\n[1] Chargement de la page login');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(5000);
    await screenshot(page, 'login-page');

    console.log('\n[2] Remplissage du formulaire');
    console.log('-'.repeat(50));

    // Fill email
    const emailInput = page.locator('input').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(TEST_EMAIL);
    console.log(`    Email: ${TEST_EMAIL}`);

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_PASSWORD);
    console.log('    Password: ********');

    await screenshot(page, 'form-filled');

    console.log('\n[3] Soumission du formulaire');
    console.log('-'.repeat(50));

    // Click login button
    const loginBtn = page.locator('[data-testid="login-button"]').first();
    if (await loginBtn.isVisible()) {
      console.log('    Click sur le bouton login...');
      await loginBtn.click();
    } else {
      console.log('    Bouton non trouve, tentative avec Enter...');
      await page.keyboard.press('Enter');
    }

    // Wait for response
    console.log('    Attente de la reponse API...');
    await delay(8000);
    await screenshot(page, 'after-login');

    // Check URL
    const currentUrl = page.url();
    console.log(`    URL: ${currentUrl}`);

    if (currentUrl.includes('map')) {
      console.log('    ✅ LOGIN REUSSI - Redirection vers map');
    } else if (currentUrl.includes('login')) {
      console.log('    ❌ ECHEC - Toujours sur login');

      // Check for error message
      const bodyText = await page.locator('body').textContent();
      if (bodyText?.includes('incorrect') || bodyText?.includes('Erreur')) {
        console.log('    Message d\'erreur detecte');
      }
    }

    console.log('\n[4] Navigation vers map');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/map`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'map-page');

    console.log('\n[5] Navigation vers profile');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'profile-page');

    // Final
    await screenshot(page, 'final');

    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log('\n' + '='.repeat(60));
    console.log('    TEST TERMINE');
    console.log('='.repeat(60));
    console.log(`    Screenshots: ${screenshots.length}`);
    screenshots.forEach(s => console.log(`    - ${s}`));

  } catch (error) {
    console.error('\n[ERREUR]', error);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
