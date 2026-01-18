import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:8081';
const SCREENSHOTS_DIR = '/tmp/tribe-screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page: Page, name: string) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot: ${filePath}`);
  return filePath;
}

async function runTest() {
  console.log('Starting Playwright test v2...\n');

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('Console error:', msg.text().substring(0, 200));
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('Page error:', err.message.substring(0, 200));
  });

  try {
    // Step 1: Load app
    console.log('=== Loading app ===');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for app to fully load
    console.log('Waiting for app to initialize...');
    await delay(8000);
    await takeScreenshot(page, 'v2-01-initial');

    // Check page content
    const content = await page.content();
    console.log('\nPage has login form:', content.includes('email') || content.includes('Email'));
    console.log('Page has loading indicator:', content.includes('ActivityIndicator') || content.includes('loading'));

    // Wait more and check again
    console.log('\nWaiting more...');
    await delay(5000);
    await takeScreenshot(page, 'v2-02-after-wait');

    // Try navigating directly to login
    console.log('\n=== Trying direct navigation to login ===');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(5000);
    await takeScreenshot(page, 'v2-03-login-direct');

    // Check for inputs
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);

    // Try to find any interactive elements
    const buttons = await page.locator('button, [role="button"]').all();
    console.log(`Found ${buttons.length} buttons`);

    // Get all text content
    const allText = await page.locator('body').textContent();
    console.log('\nPage text content:', allText?.substring(0, 500));

    // Final screenshot
    await takeScreenshot(page, 'v2-04-final');

    // Print errors summary
    if (errors.length > 0) {
      console.log('\n=== Console Errors ===');
      errors.slice(0, 10).forEach(e => console.log('- ' + e.substring(0, 300)));
    }

    console.log('\n=== Test completed ===');

  } catch (error) {
    console.error('Test error:', error);
    await takeScreenshot(page, 'v2-error');
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
