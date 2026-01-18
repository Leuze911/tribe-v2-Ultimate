import { chromium } from 'playwright';

async function testDirectAPI() {
  console.log('Testing direct API call from browser...\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  try {
    await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));

    // Try calling the API directly from browser
    console.log('\n--- Testing direct fetch call ---');

    const result = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:4000/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@tribe.sn', password: 'password123' }),
        });

        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          data: data,
        };
      } catch (e: any) {
        return { error: e.message };
      }
    });

    console.log('Direct API result:', JSON.stringify(result, null, 2));

    if (result.ok && result.data?.accessToken) {
      console.log('\n✅ Direct API call works!');
      console.log('Token:', result.data.accessToken.substring(0, 30) + '...');

      // Now let's check if React's login function can be called
      console.log('\n--- Testing React login function ---');

      const reactResult = await page.evaluate(async () => {
        // Try to find and call the login function from React state
        // This is hacky but let's see if it works
        try {
          // Manually trigger a click and see what happens
          const emailInput = document.querySelector('[data-testid="email-input"]') as HTMLInputElement;
          const passwordInput = document.querySelector('[data-testid="password-input"]') as HTMLInputElement;
          const button = document.querySelector('[data-testid="login-button"]') as HTMLElement;

          if (emailInput && passwordInput && button) {
            // Set values using React's synthetic events
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

            nativeInputValueSetter?.call(emailInput, 'test@tribe.sn');
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));

            nativeInputValueSetter?.call(passwordInput, 'password123');
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Wait a bit
            await new Promise(r => setTimeout(r, 500));

            // Check if values are set
            return {
              emailValue: emailInput.value,
              passwordValue: passwordInput.value ? '****' : 'empty',
              buttonText: button.textContent,
            };
          }
          return { error: 'Elements not found' };
        } catch (e: any) {
          return { error: e.message };
        }
      });

      console.log('React state test:', JSON.stringify(reactResult, null, 2));
    } else {
      console.log('\n❌ Direct API call failed');
    }

  } catch (e: any) {
    console.log('Error:', e.message);
  }

  await browser.close();
}

testDirectAPI();
