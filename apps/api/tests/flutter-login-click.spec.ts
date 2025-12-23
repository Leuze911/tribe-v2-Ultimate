import { test, expect } from '@playwright/test';

test.describe('Flutter App Login - Click Test', () => {
  test('should login by clicking on Flutter canvas', async ({ page }) => {
    console.log('📱 Opening Flutter app...');
    await page.goto('http://localhost:8888');

    // Wait for Flutter to fully load
    await page.waitForTimeout(4000);
    console.log('✅ App loaded');

    // Get viewport size
    const viewport = page.viewportSize();
    console.log('Viewport:', viewport);

    // Screenshot before interaction
    await page.screenshot({ path: 'test-results/login-01-loaded.png' });

    // Based on the screenshot, the email field is around y=298
    // Click on email field (center of screen, y ~300)
    const centerX = viewport!.width / 2;

    console.log('📧 Clicking email field...');
    await page.mouse.click(centerX, 300);
    await page.waitForTimeout(500);

    // Type email
    console.log('⌨️ Typing email...');
    await page.keyboard.type('test@tribe.sn');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/login-02-email.png' });

    // Click on password field (y ~390)
    console.log('🔒 Clicking password field...');
    await page.mouse.click(centerX, 390);
    await page.waitForTimeout(500);

    // Type password
    console.log('⌨️ Typing password...');
    await page.keyboard.type('test123');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/login-03-password.png' });

    // Click on "Se connecter" button (y ~510)
    console.log('🖱️ Clicking login button...');
    await page.mouse.click(centerX, 510);
    await page.screenshot({ path: 'test-results/login-04-clicking.png' });

    // Wait for response
    console.log('⏳ Waiting for login response...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/login-05-result.png' });

    console.log('✅ Login test completed!');
  });
});
