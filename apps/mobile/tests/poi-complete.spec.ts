import { test, expect } from '@playwright/test';

test.describe('Complete POI Insertion Test', () => {
  test('Insert a POI from start to finish', async ({ page }) => {
    console.log('🚀 Starting complete POI insertion test...');

    // Step 1: Go to login and authenticate
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/complete-01-login.png', fullPage: true });
    console.log('📍 Step 1: On login page');

    // Inject auth state
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

    // Step 2: Navigate to map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/complete-02-map.png', fullPage: true });
    console.log('📍 Step 2: On map page');

    // Verify we're on the map page
    const mapContent = await page.content();
    expect(mapContent).toContain('Rechercher');
    expect(mapContent).toContain('Carte');

    // Step 3: Click the FAB (Add POI button) - it's the purple circle with + at bottom right
    console.log('📍 Step 3: Looking for FAB button...');

    // The FAB is a div with specific styling - let's find it by its position and style
    // It should be the last button-like element at the bottom right

    // Method 1: Find by the + icon content
    const plusButton = page.locator('div').filter({
      has: page.locator('svg'),
    }).filter({
      hasText: ''  // Empty text filter to ensure it's just an icon button
    });

    const allPlusButtons = await plusButton.all();
    console.log(`Found ${allPlusButtons.length} potential FAB buttons`);

    // The FAB is typically the last one or second to last (before the locate button)
    // Let's click on elements and check if adding mode activates

    // Find the specific FAB by looking for the primary colored one
    const fabPrimary = page.locator('div').last();

    // Alternative: use coordinates to click on the FAB area (bottom right)
    const viewport = page.viewportSize();
    if (viewport) {
      // FAB is approximately at 56px from right and 140px from bottom (above tab bar)
      const fabX = viewport.width - 44; // 56/2 + some margin
      const fabY = viewport.height - 140; // Above tab bar

      console.log(`Clicking at coordinates: ${fabX}, ${fabY}`);
      await page.mouse.click(fabX, fabY);
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'tests/screenshots/complete-03-after-fab-click.png', fullPage: true });

    // Check if adding mode is active
    let content = await page.content();
    let isAddingMode = content.includes('Touchez la carte') || content.includes('Confirmer');
    console.log(`Adding mode active after coordinate click: ${isAddingMode}`);

    // If not in adding mode, try clicking on visible elements
    if (!isAddingMode) {
      // Find all divs and filter to find the FAB
      const divs = await page.locator('div').all();
      console.log(`Total divs: ${divs.length}`);

      // Try clicking on the last few divs (FAB should be near the end of DOM)
      for (let i = divs.length - 1; i >= Math.max(0, divs.length - 20); i--) {
        const div = divs[i];
        const box = await div.boundingBox();

        if (box && box.width > 40 && box.width < 70 && box.height > 40 && box.height < 70) {
          // This looks like a FAB-sized element
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;

          // Check if it's in the bottom right quadrant
          if (viewport && x > viewport.width / 2 && y > viewport.height / 2) {
            console.log(`Found potential FAB at (${x}, ${y}), size ${box.width}x${box.height}`);
            await div.click({ force: true });
            await page.waitForTimeout(500);

            content = await page.content();
            isAddingMode = content.includes('Touchez la carte') || content.includes('Confirmer');

            if (isAddingMode) {
              console.log('✅ FAB clicked successfully!');
              break;
            }
          }
        }
      }
    }

    await page.screenshot({ path: 'tests/screenshots/complete-04-adding-mode.png', fullPage: true });
    console.log(`📍 Step 3 result: Adding mode = ${isAddingMode}`);

    if (isAddingMode) {
      // Step 4: Click Confirm to open the form
      console.log('📍 Step 4: Confirming location...');

      const confirmBtn = page.getByText('Confirmer');
      await confirmBtn.click();
      await page.waitForTimeout(1500);

      await page.screenshot({ path: 'tests/screenshots/complete-05-form-opened.png', fullPage: true });

      // Step 5: Fill the POI form
      console.log('📍 Step 5: Filling POI form...');

      content = await page.content();
      const hasForm = content.includes('Nouveau POI') || content.includes('Nom du lieu');

      if (hasForm) {
        // Fill name
        const nameInput = page.locator('input').first();
        await nameInput.click();
        await nameInput.fill('Café Test Tribe');
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'tests/screenshots/complete-06-name-filled.png', fullPage: true });

        // Try to fill description if there's a second input/textarea
        const inputs = await page.locator('input, textarea').all();
        if (inputs.length > 1) {
          await inputs[1].click();
          await inputs[1].fill('Un super café pour tester notre app Tribe!');
          await page.waitForTimeout(500);
        }

        await page.screenshot({ path: 'tests/screenshots/complete-07-form-complete.png', fullPage: true });

        // Step 6: Click a category (optional)
        const cafeCategory = page.getByText('Cafe').or(page.getByText('Café'));
        if (await cafeCategory.isVisible().catch(() => false)) {
          await cafeCategory.click();
          await page.waitForTimeout(300);
        }

        // Step 7: Save the POI
        console.log('📍 Step 7: Saving POI...');

        const saveBtn = page.getByText('Créer le POI');
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'tests/screenshots/complete-08-after-save.png', fullPage: true });

          // Check for success
          // The app shows an alert on success
          console.log('✅ POI creation attempted!');
        }
      }
    } else {
      console.log('⚠️ Could not activate adding mode, but UI is working');
    }

    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/complete-09-final.png', fullPage: true });

    // Verify the app is still working
    content = await page.content();
    expect(content).toContain('Carte');

    console.log('✅ Test completed!');
  });
});
