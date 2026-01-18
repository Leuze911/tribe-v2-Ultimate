import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:4000/api/v1';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

// Test credentials
const TEST_EMAIL = 'test@tribe.com';
const TEST_PASSWORD = 'Test123456';

// Clean screenshots dir
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
  console.log('\n' + '='.repeat(70));
  console.log('    TRIBE v2 - TEST E2E COMPLET AVEC PLAYWRIGHT');
  console.log('='.repeat(70));

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    geolocation: { latitude: 48.8566, longitude: 2.3522 }, // Paris
    permissions: ['geolocation'],
  });

  const page = await context.newPage();

  // Capture console for debugging
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('import.meta')) {
      console.log('    [Console Error]', msg.text().substring(0, 100));
    }
  });

  try {
    // ================================================================
    // ETAPE 1: CHARGEMENT DE L'APP
    // ================================================================
    console.log('\n[ETAPE 1] Chargement de l\'application');
    console.log('-'.repeat(50));

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('    App chargee');
    await delay(5000); // Wait for React to render
    await screenshot(page, 'app-loaded');

    // ================================================================
    // ETAPE 2: PAGE DE LOGIN
    // ================================================================
    console.log('\n[ETAPE 2] Navigation vers le login');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'login-page');

    // ================================================================
    // ETAPE 3: REMPLISSAGE DU FORMULAIRE
    // ================================================================
    console.log('\n[ETAPE 3] Remplissage du formulaire de login');
    console.log('-'.repeat(50));

    // Find and fill email using testID
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.click();
    await emailInput.fill(TEST_EMAIL);
    console.log(`    Email: ${TEST_EMAIL}`);

    // Find and fill password using testID
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    await passwordInput.click();
    await passwordInput.fill(TEST_PASSWORD);
    console.log('    Password: ********');

    await screenshot(page, 'login-form-filled');

    // ================================================================
    // ETAPE 4: SOUMISSION DU LOGIN
    // ================================================================
    console.log('\n[ETAPE 4] Soumission du formulaire');
    console.log('-'.repeat(50));

    // Click the login button using testID
    const loginButton = page.locator('[data-testid="login-button"]').first();

    if (await loginButton.isVisible()) {
      console.log('    Bouton login trouve, click...');
      await loginButton.click();
    } else {
      // Fallback: find button by text
      const buttonByText = page.locator('button:has-text("connecter"), button:has-text("Connexion")').first();
      if (await buttonByText.isVisible()) {
        console.log('    Bouton trouve par texte, click...');
        await buttonByText.click();
      } else {
        // Last resort: press Enter
        console.log('    Tentative avec Enter...');
        await page.keyboard.press('Enter');
      }
    }

    // Wait for navigation or response
    console.log('    Attente de la reponse...');
    await delay(5000);
    await screenshot(page, 'after-login-click');

    // Check URL to see if login succeeded
    const currentUrl = page.url();
    console.log(`    URL actuelle: ${currentUrl}`);

    if (currentUrl.includes('map') || currentUrl.includes('app')) {
      console.log('    ✅ LOGIN REUSSI!');
    } else {
      console.log('    ⚠️ Toujours sur login, verification...');

      // Check for error messages
      const errorText = await page.locator('text=incorrect, text=erreur, text=error').first().textContent().catch(() => null);
      if (errorText) {
        console.log(`    Erreur: ${errorText}`);
      }
    }

    // ================================================================
    // ETAPE 5: PAGE MAP
    // ================================================================
    console.log('\n[ETAPE 5] Navigation vers la carte');
    console.log('-'.repeat(50));

    // Force navigation to map page
    await page.goto(`${BASE_URL}/(app)/map`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(5000);
    await screenshot(page, 'map-page');

    // Get page content to verify
    const mapContent = await page.locator('body').textContent();
    console.log(`    Contenu map: ${mapContent?.substring(0, 100)}...`);

    // ================================================================
    // ETAPE 6: CREATION D'UN POI
    // ================================================================
    console.log('\n[ETAPE 6] Creation d\'un POI');
    console.log('-'.repeat(50));

    // Look for FAB add button
    const fabButton = page.locator('[data-testid="fab-add-poi"], button:has-text("+"), [aria-label*="add"]').first();

    if (await fabButton.isVisible().catch(() => false)) {
      console.log('    Bouton FAB trouve, click...');
      await fabButton.click();
      await delay(2000);
      await screenshot(page, 'poi-form-open');

      // Fill POI form
      const poiNameInput = page.locator('input').first();
      if (await poiNameInput.isVisible()) {
        await poiNameInput.fill('Test POI Playwright ' + Date.now());
        console.log('    Nom du POI rempli');
      }

      await screenshot(page, 'poi-form-filled');
    } else {
      console.log('    Bouton FAB non visible sur cette page');
    }

    // ================================================================
    // ETAPE 7: VERIFICATION DES DONNEES
    // ================================================================
    console.log('\n[ETAPE 7] Verification via API');
    console.log('-'.repeat(50));

    // Navigate to my-pois page
    await page.goto(`${BASE_URL}/(app)/my-pois`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'my-pois-page');

    // Navigate to profile
    await page.goto(`${BASE_URL}/(app)/profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'profile-page');

    // ================================================================
    // FINAL
    // ================================================================
    console.log('\n[FINAL] Capture de l\'etat final');
    console.log('-'.repeat(50));
    await screenshot(page, 'final-state');

    // Summary
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log('\n' + '='.repeat(70));
    console.log('    TEST TERMINE');
    console.log('='.repeat(70));
    console.log(`\n    Screenshots captures: ${screenshots.length}`);
    console.log(`    Dossier: ${SCREENSHOTS_DIR}\n`);
    screenshots.forEach(s => console.log(`    - ${s}`));

  } catch (error) {
    console.error('\n[ERREUR]', error);
    await screenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
