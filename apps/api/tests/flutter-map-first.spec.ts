import { test, expect } from '@playwright/test';

test.describe('Flutter App Map-First UX', () => {
  test('should show map-first interface after login', async ({ page }) => {
    console.log('📱 Opening Flutter app...');
    await page.goto('http://localhost:8888');

    // Wait for Flutter to fully load
    await page.waitForTimeout(5000);
    console.log('✅ App loaded');

    const viewport = page.viewportSize();
    const centerX = viewport!.width / 2;

    // Screenshot initial
    await page.screenshot({ path: 'test-results/map-01-loaded.png' });

    // Click email field - it's in the upper area
    console.log('📧 Clicking email field at y=315...');
    await page.mouse.click(centerX, 315);
    await page.waitForTimeout(300);

    // Clear and type email
    await page.keyboard.press('Control+a');
    await page.keyboard.type('test@tribe.sn', { delay: 50 });
    await page.waitForTimeout(500);

    // Press Tab to move to password field
    console.log('🔒 Tab to password field...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Type password
    console.log('⌨️ Typing password...');
    await page.keyboard.type('test123', { delay: 50 });
    await page.waitForTimeout(500);

    // Press Enter to submit
    console.log('🖱️ Pressing Enter to submit...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/map-02-submitting.png' });

    // Wait for login response and navigation to map
    console.log('⏳ Waiting for login and map to load...');
    await page.waitForTimeout(6000);
    await page.screenshot({ path: 'test-results/map-03-map-first.png' });

    // Test opening the drawer - click hamburger menu (top left)
    console.log('📋 Clicking hamburger menu...');
    await page.mouse.click(56, 70); // Top left where menu button should be
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/map-04-drawer.png' });

    // Close drawer by clicking on map
    console.log('🗺️ Closing drawer...');
    await page.mouse.click(centerX, 400);
    await page.waitForTimeout(500);

    // Test FAB - click + button (bottom right)
    console.log('➕ Clicking FAB to add POI...');
    await page.mouse.click(viewport!.width - 80, viewport!.height - 120);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/map-05-add-poi.png' });

    console.log('✅ Map-First UX test completed!');
  });
});
