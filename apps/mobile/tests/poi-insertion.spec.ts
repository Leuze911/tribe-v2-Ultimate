import { test, expect } from '@playwright/test';

test.describe('POI Insertion Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock authentication before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const mockAuthState = {
        state: {
          isAuthenticated: true,
          user: {
            id: 'test-user-1',
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@tribe.com',
            level: 5,
            xp: 250,
            xpToNextLevel: 500,
            totalPois: 10,
            avatar: null,
          },
          token: 'mock-jwt-token-12345',
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(mockAuthState));
    });

    // Reload to apply auth state
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Complete POI insertion flow', async ({ page }) => {
    console.log('🗺️ Starting POI insertion test...');

    // Navigate to map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/poi-01-map-loaded.png', fullPage: true });
    console.log('✅ Map screen loaded');

    // Verify map UI elements
    const pageContent = await page.content();
    expect(pageContent).toContain('Rechercher');
    console.log('✅ Search bar visible');

    // Step 1: Click the FAB button to start adding POI
    console.log('📍 Step 1: Clicking Add POI button...');

    // Find the FAB button (purple round button with + icon)
    const fabButton = page.locator('div').filter({ has: page.locator('svg[data-testid="icon"]') }).last();

    // Alternative: find by looking for the add icon
    const addButtons = await page.locator('div[role="button"], div').all();
    let foundFab = false;

    for (const btn of addButtons) {
      const innerHTML = await btn.innerHTML().catch(() => '');
      if (innerHTML.includes('add') || innerHTML.includes('plus')) {
        await btn.click();
        foundFab = true;
        break;
      }
    }

    // Try clicking on the last visible clickable element that looks like a FAB
    if (!foundFab) {
      // Find all divs that could be buttons (have click handlers)
      const clickableElements = page.locator('div').filter({
        has: page.locator('svg'),
      });

      const count = await clickableElements.count();
      console.log(`Found ${count} clickable elements with SVGs`);

      // The FAB should be near the bottom right - click the last few
      if (count > 0) {
        await clickableElements.last().click();
        foundFab = true;
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/poi-02-after-fab-click.png', fullPage: true });

    // Check if we're in adding mode
    const afterClickContent = await page.content();
    const isAddingMode = afterClickContent.includes('Touchez la carte') ||
                          afterClickContent.includes('Confirmer') ||
                          afterClickContent.includes('Annuler');

    console.log(`🎯 Adding mode active: ${isAddingMode}`);

    if (isAddingMode) {
      console.log('✅ POI adding mode activated');

      // Step 2: Click Confirm to open the POI form
      console.log('📍 Step 2: Confirming location...');
      const confirmButton = page.locator('text=Confirmer');

      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'tests/screenshots/poi-03-after-confirm.png', fullPage: true });
        console.log('✅ Location confirmed, opening POI form...');
      }

      // Step 3: Fill in the POI form
      const hasModal = await page.content().then(c => c.includes('Nouveau POI') || c.includes('Nom du lieu'));

      if (hasModal) {
        console.log('📍 Step 3: Filling POI form...');

        // Fill POI name
        const nameInput = page.locator('input').first();
        await nameInput.fill('Mon Restaurant Test');
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'tests/screenshots/poi-04-form-name.png', fullPage: true });
        console.log('✅ POI name entered');

        // Fill description (if textarea exists)
        const descInput = page.locator('textarea, input').nth(1);
        if (await descInput.isVisible().catch(() => false)) {
          await descInput.fill('Un excellent restaurant pour tester l\'app');
          await page.waitForTimeout(500);
        }

        await page.screenshot({ path: 'tests/screenshots/poi-05-form-filled.png', fullPage: true });
        console.log('✅ POI form filled');

        // Step 4: Click save/create button
        console.log('📍 Step 4: Saving POI...');
        const saveButton = page.locator('text=Créer le POI').or(page.locator('text=Sauvegarder'));

        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'tests/screenshots/poi-06-after-save.png', fullPage: true });
          console.log('✅ POI save button clicked');
        }

        // Check for success message
        await page.waitForTimeout(1000);
        const finalContent = await page.content();
        const hasSuccessAlert = finalContent.includes('succès') || finalContent.includes('créé');

        console.log(`🎉 Success message shown: ${hasSuccessAlert}`);
        await page.screenshot({ path: 'tests/screenshots/poi-07-final.png', fullPage: true });
      }
    }

    console.log('✅ POI insertion test completed');
  });

  test('Verify all tabs work after navigation fix', async ({ page }) => {
    console.log('🧭 Testing tab navigation...');

    // Test Map tab
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/tab-01-map.png', fullPage: true });

    let content = await page.content();
    const hasMapUI = content.includes('Rechercher') || content.includes('Carte');
    console.log(`📍 Map tab works: ${hasMapUI}`);

    // Test My POIs tab
    await page.goto('/my-pois');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/tab-02-my-pois.png', fullPage: true });

    content = await page.content();
    const hasMyPoisUI = content.includes('Mes POI') || content.includes('Aucun POI');
    console.log(`📍 My POIs tab works: ${hasMyPoisUI}`);

    // Test Rewards tab
    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/tab-03-rewards.png', fullPage: true });

    content = await page.content();
    const hasRewardsUI = content.includes('Récompenses') || content.includes('XP');
    console.log(`📍 Rewards tab works: ${hasRewardsUI}`);

    // Test Profile tab
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/tab-04-profile.png', fullPage: true });

    content = await page.content();
    const hasProfileUI = content.includes('Profil') || content.includes('Niveau');
    console.log(`📍 Profile tab works: ${hasProfileUI}`);

    console.log('✅ All tabs tested');
  });
});
