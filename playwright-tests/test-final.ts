import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

// Test credentials
const TEST_EMAIL = 'test@tribe.com';
const TEST_PASSWORD = 'Test123456';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Clear old screenshots
fs.readdirSync(SCREENSHOTS_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOTS_DIR, f)));

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let counter = 1;
async function screenshot(page: Page, name: string) {
  const filePath = path.join(SCREENSHOTS_DIR, `${String(counter++).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Screenshot: ${name}`);
  return filePath;
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('    TRIBE - Test E2E avec Playwright');
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

  try {
    // ====== ETAPE 1: LOGIN ======
    console.log('\n[ETAPE 1] Connexion');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await screenshot(page, 'login-page');

    // Fill login form
    const emailInput = page.locator('input').first();
    await emailInput.fill(TEST_EMAIL);
    console.log(`  Email: ${TEST_EMAIL}`);

    const pwdInput = page.locator('input[type="password"]').first();
    await pwdInput.fill(TEST_PASSWORD);
    console.log('  Password: ********');

    await screenshot(page, 'login-filled');

    // Click login button or press Enter
    await page.keyboard.press('Enter');
    console.log('  Envoi du formulaire...');
    await delay(5000);
    await screenshot(page, 'after-login');

    // Check if login succeeded
    const currentUrl = page.url();
    console.log(`  URL: ${currentUrl}`);

    if (currentUrl.includes('login')) {
      // Still on login, try clicking the button directly
      console.log('  Tentative avec click direct...');
      const submitBtn = page.locator('[type="submit"], button').filter({ hasText: /connexion|login|se connecter/i }).first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await delay(5000);
      }
    }

    await screenshot(page, 'post-login-check');

    // ====== ETAPE 2: MAP PAGE ======
    console.log('\n[ETAPE 2] Page Map');
    console.log('-'.repeat(40));

    // Navigate to map if needed
    const mapUrl = `${BASE_URL}/(app)/map`;
    if (!page.url().includes('map')) {
      await page.goto(mapUrl, { waitUntil: 'domcontentloaded' });
      await delay(3000);
    }

    await screenshot(page, 'map-page');
    console.log(`  URL: ${page.url()}`);

    // ====== ETAPE 3: CREATION POI ======
    console.log('\n[ETAPE 3] Création d\'un POI');
    console.log('-'.repeat(40));

    // Look for FAB button
    const fabSelector = 'button:has-text("+"), [data-testid="fab-add-poi"], [aria-label*="add"]';
    const fabBtn = page.locator(fabSelector).first();

    if (await fabBtn.isVisible().catch(() => false)) {
      console.log('  Bouton FAB trouvé, click...');
      await fabBtn.click();
      await delay(2000);
      await screenshot(page, 'poi-form-open');

      // Fill POI form
      const poiInputs = page.locator('input');
      if (await poiInputs.count() > 0) {
        await poiInputs.first().fill('POI Playwright Test');
        console.log('  Nom du POI rempli');
      }

      const textArea = page.locator('textarea').first();
      if (await textArea.isVisible().catch(() => false)) {
        await textArea.fill('POI créé automatiquement par le test Playwright');
        console.log('  Description remplie');
      }

      await screenshot(page, 'poi-form-filled');
    } else {
      console.log('  FAB non visible, navigation vers my-pois...');
      await page.goto(`${BASE_URL}/(app)/my-pois`, { waitUntil: 'domcontentloaded' });
      await delay(3000);
      await screenshot(page, 'my-pois-page');
    }

    // ====== ETAPE 4: VERIFICATION ======
    console.log('\n[ETAPE 4] Vérification');
    console.log('-'.repeat(40));

    await screenshot(page, 'final-state');

    // Get page content summary
    const pageText = await page.locator('body').textContent();
    const textPreview = pageText?.replace(/\s+/g, ' ').substring(0, 200);
    console.log(`  Contenu: ${textPreview}...`);

    // ====== SUMMARY ======
    console.log('\n' + '='.repeat(60));
    console.log('    TEST TERMINE');
    console.log('='.repeat(60));

    const shots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\nScreenshots (${shots.length} fichiers):`);
    shots.forEach(s => console.log(`  /tmp/tribe-screenshots/${s}`));

  } catch (error) {
    console.error('\nERREUR:', error);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
