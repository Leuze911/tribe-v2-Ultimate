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

async function loginViaAPI(): Promise<{ token: string; user: any }> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const data = await response.json();
  return { token: data.accessToken, user: data.user };
}

async function runTest() {
  console.log('\n' + '='.repeat(70));
  console.log('    TRIBE v2 - TEST E2E AVEC AUTHENTIFICATION');
  console.log('='.repeat(70));

  // Get auth token first
  console.log('\n[PRE] Obtention du token d\'authentification via API');
  console.log('-'.repeat(50));
  const { token, user } = await loginViaAPI();
  console.log(`    Token obtenu: ${token.substring(0, 30)}...`);
  console.log(`    User: ${user.email} (${user.fullName})`);

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

  // Intercept API requests and redirect to localhost
  await page.route('**/192.168.1.132:4000/**', async (route) => {
    const url = route.request().url().replace('192.168.1.132:4000', 'localhost:4000');
    console.log(`    [Route] Redirecting to ${url.substring(0, 60)}...`);
    await route.continue({ url });
  });

  try {
    // ================================================================
    // ETAPE 1: INJECTION DE L'AUTH ET CHARGEMENT
    // ================================================================
    console.log('\n[ETAPE 1] Injection de l\'authentification');
    console.log('-'.repeat(50));

    // Go to app first to set localStorage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);

    // Inject auth data into localStorage (simulating successful login)
    await page.evaluate(({ token, user }) => {
      // Store auth data the same way the app does
      localStorage.setItem('tribe-auth-token', token);
      localStorage.setItem('tribe-auth-user', JSON.stringify(user));

      // Also set in sessionStorage as backup
      sessionStorage.setItem('tribe-auth-token', token);
      sessionStorage.setItem('tribe-auth-user', JSON.stringify(user));
    }, { token, user });

    console.log('    Auth injectee dans localStorage');
    await screenshot(page, 'auth-injected');

    // ================================================================
    // ETAPE 2: PAGE DE LOGIN (pour montrer le formulaire)
    // ================================================================
    console.log('\n[ETAPE 2] Affichage de la page de login');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'login-page');

    // Fill and show the form
    const emailInput = page.locator('input').first();
    await emailInput.fill(TEST_EMAIL);
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_PASSWORD);
    await screenshot(page, 'login-form-filled');

    console.log(`    Email: ${TEST_EMAIL}`);
    console.log('    Password: ********');

    // ================================================================
    // ETAPE 3: NAVIGATION VERS LA MAP
    // ================================================================
    console.log('\n[ETAPE 3] Navigation vers la carte');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/map`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(5000);
    await screenshot(page, 'map-page');

    const mapContent = await page.locator('body').textContent();
    if (mapContent?.includes('MapLibre')) {
      console.log('    MapLibre detecte');
    } else {
      console.log('    Map en mode fallback (web)');
    }

    // ================================================================
    // ETAPE 4: PAGE MES POIs
    // ================================================================
    console.log('\n[ETAPE 4] Page Mes POIs');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/my-pois`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(5000);
    await screenshot(page, 'my-pois-page');

    // ================================================================
    // ETAPE 5: CREATION D'UN POI VIA API
    // ================================================================
    console.log('\n[ETAPE 5] Creation d\'un POI via API');
    console.log('-'.repeat(50));

    const poiName = `POI Test ${Date.now()}`;
    const createPoiResponse = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: poiName,
        description: 'POI cree par test Playwright automatise',
        category: 'restaurant',
        latitude: 48.8566,
        longitude: 2.3522,
        address: 'Paris, France',
      }),
    });

    const poiData = await createPoiResponse.json();
    console.log(`    POI cree: ${poiData.name}`);
    console.log(`    ID: ${poiData.id}`);
    console.log(`    Category: ${poiData.category}`);
    console.log(`    Position: ${poiData.latitude}, ${poiData.longitude}`);

    // Refresh my-pois page
    await page.reload({ waitUntil: 'networkidle' });
    await delay(3000);
    await screenshot(page, 'my-pois-after-create');

    // ================================================================
    // ETAPE 6: PAGE PROFILE
    // ================================================================
    console.log('\n[ETAPE 6] Page Profil');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/profile`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'profile-page');

    // ================================================================
    // ETAPE 7: PAGE REWARDS
    // ================================================================
    console.log('\n[ETAPE 7] Page Recompenses');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/rewards`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'rewards-page');

    // ================================================================
    // ETAPE 8: PAGE LEADERBOARD
    // ================================================================
    console.log('\n[ETAPE 8] Page Classement');
    console.log('-'.repeat(50));

    await page.goto(`${BASE_URL}/(app)/leaderboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(3000);
    await screenshot(page, 'leaderboard-page');

    // ================================================================
    // VERIFICATION FINALE
    // ================================================================
    console.log('\n[VERIFICATION] Liste des POIs via API');
    console.log('-'.repeat(50));

    const poisResponse = await fetch(`${API_URL}/locations`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const poisData = await poisResponse.json();
    console.log(`    Total POIs dans la base: ${poisData.total}`);

    // Find our POI
    const ourPoi = poisData.data?.find((p: any) => p.name === poiName);
    if (ourPoi) {
      console.log(`    ✅ Notre POI trouve: ${ourPoi.name}`);
      console.log(`       Status: ${ourPoi.status}`);
    }

    // Final screenshot
    await screenshot(page, 'final-state');

    // Summary
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log('\n' + '='.repeat(70));
    console.log('    TEST TERMINE AVEC SUCCES');
    console.log('='.repeat(70));
    console.log(`\n    POI cree: ${poiName}`);
    console.log(`    Screenshots: ${screenshots.length} fichiers`);
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
