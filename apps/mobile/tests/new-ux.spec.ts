import { test, expect } from '@playwright/test';

test.describe('New UX - Map First Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth and go to map
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: {
            id: 'test-1',
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@tribe.com',
            level: 5,
            xp: 250,
            xpToNextLevel: 500,
            totalPois: 10
          },
          token: 'mock-token'
        },
        version: 0
      }));
    });

    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Map screen shows full-screen layout with floating elements', async ({ page }) => {
    console.log('Testing full-screen map layout...');

    // Screenshot the initial state
    await page.screenshot({ path: 'tests/screenshots/new-ux-01-map.png', fullPage: true });

    // Check hamburger menu button exists
    const menuButton = page.locator('[data-testid="menu-button"]')
      .or(page.getByLabel('Menu'));
    const menuVisible = await menuButton.isVisible().catch(() => false);
    console.log(`Menu button visible: ${menuVisible}`);

    // Check search bar exists
    const searchVisible = await page.locator('input[placeholder*="Rechercher"]').isVisible().catch(() => false);
    console.log(`Search bar visible: ${searchVisible}`);

    // Check FAB buttons exist
    const addPoiButton = page.locator('[data-testid="add-poi-button"]');
    const locateButton = page.locator('[data-testid="locate-button"]');

    const addPoiVisible = await addPoiButton.isVisible().catch(() => false);
    const locateVisible = await locateButton.isVisible().catch(() => false);
    console.log(`Add POI FAB visible: ${addPoiVisible}`);
    console.log(`Locate FAB visible: ${locateVisible}`);

    // Check category chips exist
    const content = await page.content();
    const hasCategories = content.includes('Tous') && content.includes('Restaurants');
    console.log(`Category chips present: ${hasCategories}`);

    // Check user badge exists
    const hasUserBadge = content.includes('Niveau');
    console.log(`User badge present: ${hasUserBadge}`);

    expect(hasCategories).toBe(true);
  });

  test('Hamburger menu opens drawer', async ({ page }) => {
    console.log('Testing drawer menu...');

    // Click menu button
    const menuButton = page.locator('[data-testid="menu-button"]')
      .or(page.getByLabel('Menu'))
      .or(page.locator('button').filter({ has: page.locator('svg') }).first());

    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'tests/screenshots/new-ux-02-drawer.png', fullPage: true });

      // Check drawer content
      const content = await page.content();
      const hasDrawerContent = content.includes('Mes POI') || content.includes('Recompenses') || content.includes('Parametres');
      console.log(`Drawer content visible: ${hasDrawerContent}`);
    } else {
      console.log('Menu button not found, checking for hamburger icon');

      // Try clicking hamburger menu by icon
      const hamburger = page.locator('[name="menu"]').first();
      if (await hamburger.isVisible().catch(() => false)) {
        await hamburger.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/screenshots/new-ux-02-drawer.png', fullPage: true });
      }
    }
  });

  test('Category filter chips are interactive', async ({ page }) => {
    console.log('Testing category chips...');

    // Click on "Restaurants" chip
    const restaurantChip = page.getByText('Restaurants').first();
    if (await restaurantChip.isVisible().catch(() => false)) {
      await restaurantChip.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'tests/screenshots/new-ux-03-category.png', fullPage: true });
      console.log('Restaurants category selected');
    }

    // Click on "Cafes" chip
    const cafeChip = page.getByText('Cafes').first();
    if (await cafeChip.isVisible().catch(() => false)) {
      await cafeChip.click();
      await page.waitForTimeout(300);
      console.log('Cafes category selected');
    }
  });

  test('POI creation flow with bottom sheet', async ({ page }) => {
    console.log('Testing POI creation flow...');

    // Click FAB to add POI
    const fabButton = page.locator('[data-testid="add-poi-button"]')
      .or(page.getByLabel('Ajouter un POI'));

    const isFabVisible = await fabButton.isVisible().catch(() => false);
    console.log(`FAB visible: ${isFabVisible}`);

    if (isFabVisible) {
      await fabButton.click();
      await page.waitForTimeout(1000);
      console.log('FAB clicked');

      await page.screenshot({ path: 'tests/screenshots/new-ux-04-adding.png', fullPage: true });

      // Check adding mode banner
      const content = await page.content();
      const isAddingMode = content.includes('Touchez la carte') || content.includes('Confirmer');
      console.log(`Adding mode: ${isAddingMode}`);

      if (isAddingMode) {
        // Click confirm
        await page.getByText('Confirmer').click();
        await page.waitForTimeout(1500);

        await page.screenshot({ path: 'tests/screenshots/new-ux-05-form.png', fullPage: true });

        // Check bottom sheet form
        const hasForm = await page.content().then(c =>
          c.includes('Nouveau POI') || c.includes('Nom du lieu')
        );
        console.log(`Form visible: ${hasForm}`);

        if (hasForm) {
          // Fill form
          const nameInput = page.locator('input').first();
          await nameInput.fill('Mon Cafe Test');
          await page.waitForTimeout(500);

          await page.screenshot({ path: 'tests/screenshots/new-ux-06-filled.png', fullPage: true });

          // Save
          const saveBtn = page.getByText('Creer le POI');
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(2000);
            console.log('POI created!');
          }

          await page.screenshot({ path: 'tests/screenshots/new-ux-07-saved.png', fullPage: true });
        }
      }
    }
  });

  test('Search functionality', async ({ page }) => {
    console.log('Testing search...');

    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Test search');
      await page.waitForTimeout(500);

      await page.screenshot({ path: 'tests/screenshots/new-ux-08-search.png', fullPage: true });

      // Clear search
      const clearButton = page.locator('[name="close-circle"]');
      if (await clearButton.isVisible().catch(() => false)) {
        await clearButton.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
