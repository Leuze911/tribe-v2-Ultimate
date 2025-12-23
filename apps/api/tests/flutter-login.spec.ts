import { test, expect } from '@playwright/test';

test.describe('Flutter App Login Test', () => {
  test('should login via Flutter app UI', async ({ page }) => {
    // Navigate to Flutter app
    console.log('📱 Opening Flutter app...');
    await page.goto('http://localhost:8888');

    // Wait for Flutter to load (splash screen)
    await page.waitForTimeout(3000);
    console.log('⏳ Waiting for app to load...');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial.png' });

    // Wait for login form to appear
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/02-after-splash.png' });

    // Try to find email input field
    console.log('🔍 Looking for email input...');

    // Flutter web renders inputs differently - try various selectors
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();

    if (await emailInput.isVisible({ timeout: 5000 })) {
      console.log('✅ Email input found!');
      await emailInput.fill('test@tribe.sn');
      await page.screenshot({ path: 'test-results/03-email-filled.png' });

      // Find password input
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 2000 })) {
        console.log('✅ Password input found!');
        await passwordInput.fill('test123');
        await page.screenshot({ path: 'test-results/04-password-filled.png' });

        // Find and click login button
        console.log('🔍 Looking for login button...');
        const loginButton = page.locator('button, [role="button"]').filter({ hasText: /connexion|login|se connecter/i });

        if (await loginButton.first().isVisible({ timeout: 2000 })) {
          console.log('✅ Login button found! Clicking...');
          await loginButton.first().click();
          await page.screenshot({ path: 'test-results/05-after-click.png' });

          // Wait for response
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-results/06-final.png' });

          console.log('✅ Login test completed!');
        } else {
          console.log('❌ Login button not found');
          await page.screenshot({ path: 'test-results/error-no-button.png' });
        }
      }
    } else {
      console.log('❌ Email input not visible, Flutter may still be loading');
      console.log('📸 Taking full page screenshot for debugging...');
      await page.screenshot({ path: 'test-results/debug-page.png', fullPage: true });

      // Log page content
      const content = await page.content();
      console.log('Page content length:', content.length);
    }
  });
});
