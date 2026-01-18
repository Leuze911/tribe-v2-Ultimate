import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:4000/api/v1';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Clear old screenshots
fs.readdirSync(SCREENSHOTS_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOTS_DIR, f)));

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let screenshotCounter = 1;
async function screenshot(page: Page, name: string) {
  const filePath = path.join(SCREENSHOTS_DIR, `${String(screenshotCounter++).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  -> ${filePath}`);
  return filePath;
}

async function runTest() {
  console.log('='.repeat(50));
  console.log('TRIBE - Test Automatisé Complet');
  console.log('='.repeat(50));

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Capture errors
  page.on('pageerror', err => {
    if (!err.message.includes('import.meta')) {
      console.log('ERROR:', err.message.substring(0, 100));
    }
  });

  try {
    // ========== STEP 1: Page de Login ==========
    console.log('\n[1/6] Page de Login');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await screenshot(page, 'login-page');

    // ========== STEP 2: S'inscrire ==========
    console.log('\n[2/6] Inscription');

    // Click on S'inscrire link
    const registerLink = page.locator('text=S\'inscrire');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await delay(2000);
      await screenshot(page, 'register-page');
    }

    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `playwright${timestamp}@test.com`;
    const testPassword = 'Test123456!';
    const testName = 'Playwright Test';

    // Fill name
    const nameInput = page.locator('input').first();
    await nameInput.fill(testName);

    // Fill email
    const emailInput = page.locator('input[type="email"], input:nth-child(2)').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill(testEmail);
    } else {
      const inputs = page.locator('input');
      if (await inputs.count() >= 2) {
        await inputs.nth(1).fill(testEmail);
      }
    }

    // Fill password
    const passwordInputs = page.locator('input[type="password"]');
    if (await passwordInputs.count() >= 1) {
      await passwordInputs.first().fill(testPassword);
    }
    if (await passwordInputs.count() >= 2) {
      await passwordInputs.nth(1).fill(testPassword);
    }

    await screenshot(page, 'register-filled');
    console.log(`  Email: ${testEmail}`);

    // Submit registration
    const registerBtn = page.locator('button, [role="button"]').filter({ hasText: /inscrire|register|créer/i }).first();
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await delay(4000);
      await screenshot(page, 'after-register');
    }

    // ========== STEP 3: Se connecter ==========
    console.log('\n[3/6] Connexion');

    // Check if we need to login
    const loginPage = await page.locator('text=Email').isVisible();
    if (loginPage) {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
      await delay(2000);

      // Use existing test account or the one we just created
      const loginInputs = page.locator('input');
      await loginInputs.first().fill(testEmail);

      const pwdInput = page.locator('input[type="password"]').first();
      await pwdInput.fill(testPassword);

      await screenshot(page, 'login-filled');

      // Try to find and click login button by looking at the button
      await delay(500);
      await page.keyboard.press('Enter');
      await delay(5000);
      await screenshot(page, 'after-login');
    }

    // ========== STEP 4: Page principale (Map) ==========
    console.log('\n[4/6] Page Map');
    await delay(2000);
    await screenshot(page, 'map-page');

    // Check current URL
    const currentUrl = page.url();
    console.log(`  URL actuelle: ${currentUrl}`);

    // ========== STEP 5: Créer un POI ==========
    console.log('\n[5/6] Création POI');

    // Look for add button (FAB)
    const addBtn = page.locator('[data-testid*="add"], [aria-label*="add"], button:has-text("+")').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await delay(2000);
      await screenshot(page, 'poi-form');

      // Fill POI form
      const poiNameInput = page.locator('input').first();
      if (await poiNameInput.isVisible()) {
        await poiNameInput.fill('POI Test Playwright');

        const descInput = page.locator('textarea').first();
        if (await descInput.isVisible()) {
          await descInput.fill('POI créé automatiquement par Playwright');
        }

        await screenshot(page, 'poi-filled');
      }
    } else {
      console.log('  Bouton ajout POI non trouvé');
    }

    // ========== STEP 6: État final ==========
    console.log('\n[6/6] État final');
    await screenshot(page, 'final-state');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST TERMINÉ');
    console.log('='.repeat(50));
    console.log(`Screenshots: ${SCREENSHOTS_DIR}`);

    // List screenshots
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\nCaptures (${screenshots.length}):`);
    screenshots.forEach(s => console.log(`  - ${s}`));

  } catch (error) {
    console.error('\nERREUR:', error);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
