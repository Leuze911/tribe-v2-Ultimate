import { chromium } from 'playwright';
import * as fs from 'fs';

async function testKeyboardSubmit() {
  console.log('Testing form submission via keyboard...\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const allLogs: string[] = [];

  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    allLogs.push(text);
    if (msg.text().includes('🔐') || msg.text().includes('handleLogin') || msg.text().includes('Error') || msg.type() === 'error') {
      console.log(text);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  page.on('request', req => {
    if (req.url().includes('/auth/login')) {
      console.log(`[REQUEST] ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', res => {
    if (res.url().includes('/auth/login')) {
      console.log(`[RESPONSE] ${res.status()} ${res.url()}`);
    }
  });

  try {
    await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Page loaded');

    // Wait longer for React to fully initialize
    await new Promise(r => setTimeout(r, 5000));
    console.log('Waited 5s for React to initialize');

    // Fill form using standard Playwright methods
    await page.fill('[data-testid="email-input"]', 'test@tribe.sn');
    await page.fill('[data-testid="password-input"]', 'password123');
    console.log('Form filled');

    // Wait a moment
    await new Promise(r => setTimeout(r, 1000));

    // Get button state before click
    const buttonInfo = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="login-button"]') as HTMLElement;
      if (!btn) return { error: 'Button not found' };

      // Check if it has any event listeners
      const reactKey = Object.keys(btn).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
      const hasReactProps = Object.keys(btn).find(k => k.startsWith('__reactProps'));

      return {
        tagName: btn.tagName,
        hasOnClick: typeof (btn as any).onclick === 'function',
        hasReactFiber: !!reactKey,
        hasReactProps: !!hasReactProps,
        disabled: (btn as HTMLButtonElement).disabled || btn.getAttribute('aria-disabled') === 'true',
      };
    });
    console.log('Button info:', JSON.stringify(buttonInfo));

    // Try multiple click methods
    console.log('\nAttempt 1: Playwright click');
    await page.click('[data-testid="login-button"]');
    await new Promise(r => setTimeout(r, 3000));

    let url = page.url();
    console.log(`URL after click: ${url}`);

    if (!url.includes('map')) {
      console.log('\nAttempt 2: dispatchEvent click');
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="login-button"]');
        if (btn) {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
      });
      await new Promise(r => setTimeout(r, 3000));
      url = page.url();
      console.log(`URL after dispatchEvent: ${url}`);
    }

    if (!url.includes('map')) {
      console.log('\nAttempt 3: focus and keyboard navigation');
      await page.focus('[data-testid="login-button"]');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000));
      url = page.url();
      console.log(`URL after Enter key: ${url}`);
    }

    // Check final state
    console.log('\n--- Final State ---');
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    console.log(`Token in localStorage: ${token ? 'YES' : 'NO'}`);
    console.log(`Final URL: ${page.url()}`);

    if (url.includes('map') || token) {
      console.log('\n✅ SUCCESS!');
    } else {
      console.log('\n❌ FAILED');

      // Show all logs for debugging
      console.log('\n--- All Console Logs ---');
      allLogs.forEach(log => console.log(log));
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/tribe-screenshots-v2/keyboard-test.png', fullPage: true });
    console.log('\nScreenshot: /tmp/tribe-screenshots-v2/keyboard-test.png');

  } catch (e: any) {
    console.log('Error:', e.message);
  }

  await browser.close();
}

testKeyboardSubmit();
