import { test, expect } from '@playwright/test';

test.describe('Flutter App Login V2', () => {
  test('should login with correct coordinates', async ({ page }) => {
    console.log('📱 Opening Flutter app...');
    await page.goto('http://localhost:8888');

    // Wait for Flutter to fully load
    await page.waitForTimeout(5000);
    console.log('✅ App loaded');

    const viewport = page.viewportSize();
    const centerX = viewport!.width / 2;

    // Screenshot initial
    await page.screenshot({ path: 'test-results/v2-01-loaded.png' });

    // Click email field - it's in the upper area
    console.log('📧 Clicking email field at y=315...');
    await page.mouse.click(centerX, 315);
    await page.waitForTimeout(300);

    // Clear and type email
    await page.keyboard.press('Control+a');
    await page.keyboard.type('test@tribe.sn', { delay: 50 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/v2-02-email.png' });

    // Press Tab to move to password field
    console.log('🔒 Tab to password field...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Type password
    console.log('⌨️ Typing password...');
    await page.keyboard.type('test123', { delay: 50 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/v2-03-password.png' });

    // Press Enter or click button
    console.log('🖱️ Pressing Enter to submit...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/v2-04-submitting.png' });

    // Wait for response
    console.log('⏳ Waiting for login response...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/v2-05-result.png' });

    console.log('✅ Login test completed!');
  });
});
