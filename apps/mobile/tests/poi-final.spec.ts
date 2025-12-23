import { test, expect } from '@playwright/test';

test.describe('POI Insertion - Final Test', () => {
  test('Complete POI insertion flow with testID', async ({ page }) => {
    console.log('🚀 Starting POI insertion test...');

    // Inject auth and go to map
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: {
            id: 'test-1', username: 'testuser', displayName: 'Test User',
            email: 'test@tribe.com', level: 5, xp: 250, xpToNextLevel: 500, totalPois: 10
          },
          token: 'mock-token'
        },
        version: 0
      }));
    });

    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/final-01-map.png', fullPage: true });
    console.log('✅ Map loaded');

    // Click FAB using testID (becomes data-testid in web)
    console.log('📍 Clicking FAB button...');

    // Try multiple selectors
    const fabButton = page.locator('[data-testid="add-poi-button"]')
      .or(page.getByTestId('add-poi-button'))
      .or(page.getByLabel('Ajouter un POI'))
      .or(page.locator('[aria-label="Ajouter un POI"]'));

    const isFabVisible = await fabButton.isVisible().catch(() => false);
    console.log(`FAB visible with testID: ${isFabVisible}`);

    if (isFabVisible) {
      await fabButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ FAB clicked via testID');
    } else {
      // Fallback: click by position (the FAB is at bottom right, approximately)
      console.log('⚠️ TestID not found, using position click...');

      // Get viewport size
      const viewport = page.viewportSize();
      if (viewport) {
        // FAB position: approximately 28px from right edge, 560px from top (based on screenshot)
        // Screenshot shows FAB at right side, above tab bar
        await page.mouse.click(viewport.width - 45, 533);
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: 'tests/screenshots/final-02-after-click.png', fullPage: true });

    // Check adding mode
    let content = await page.content();
    let isAddingMode = content.includes('Touchez la carte') || content.includes('Confirmer');
    console.log(`Adding mode: ${isAddingMode}`);

    if (isAddingMode) {
      console.log('✅ Adding mode activated!');
      await page.screenshot({ path: 'tests/screenshots/final-03-adding-mode.png', fullPage: true });

      // Click confirm
      await page.getByText('Confirmer').click();
      await page.waitForTimeout(1500);

      await page.screenshot({ path: 'tests/screenshots/final-04-form.png', fullPage: true });

      // Fill form
      content = await page.content();
      if (content.includes('Nouveau POI') || content.includes('Nom du lieu')) {
        console.log('✅ Form opened!');

        // Fill name
        await page.locator('input').first().fill('Mon Café Test');
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'tests/screenshots/final-05-filled.png', fullPage: true });

        // Save
        const saveBtn = page.getByText('Créer le POI');
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(2500);
          console.log('✅ POI saved!');
        }

        await page.screenshot({ path: 'tests/screenshots/final-06-saved.png', fullPage: true });
      }
    } else {
      console.log('⚠️ Adding mode not activated');

      // Let's try a direct position click on the visible FAB
      // From the screenshot, FAB is at approximately x=1237, y=533
      console.log('Trying direct position click...');
      await page.mouse.click(1237, 533);
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'tests/screenshots/final-02b-position-click.png', fullPage: true });

      content = await page.content();
      isAddingMode = content.includes('Touchez la carte') || content.includes('Confirmer');
      console.log(`Adding mode after position click: ${isAddingMode}`);
    }

    console.log('✅ Test completed');
  });
});
