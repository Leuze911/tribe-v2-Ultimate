import { chromium } from 'playwright';

async function traceError() {
  console.log('Tracing import.meta error...\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Capture detailed error with stack trace
  page.on('pageerror', err => {
    console.log('=== PAGE ERROR ===');
    console.log('Message:', err.message);
    console.log('Stack:', err.stack);
    console.log('==================\n');
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Console Error] ${msg.text()}`);
      // Try to get the location
      const location = msg.location();
      if (location.url) {
        console.log(`  at ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    }
  });

  try {
    await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));

    // Try to evaluate if React is working
    const reactWorking = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.length > 100 : false;
    });
    console.log('React rendered content:', reactWorking);

    // Check if button has click handler
    const hasClickHandler = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="login-button"]');
      if (!btn) return 'Button not found';

      // Try to manually trigger click
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      btn.dispatchEvent(event);
      return 'Click dispatched';
    });
    console.log('Click test:', hasClickHandler);

  } catch (e: any) {
    console.log('Error:', e.message);
  }

  await browser.close();
}

traceError();
