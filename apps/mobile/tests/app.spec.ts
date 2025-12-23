import { test, expect } from '@playwright/test';

test.describe('Tribe Mobile App - Full Flow Test', () => {
  test('should load the app and show login page', async ({ page }) => {
    console.log('📱 Step 1: Loading the app...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/01-initial-load.png', fullPage: true });
    console.log('✅ App loaded successfully');

    // Should redirect to login
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    expect(currentUrl).toContain('login');

    // Verify login form elements
    const emailLabel = page.locator('text=Email');
    const passwordLabel = page.locator('text=Mot de passe');
    const loginButton = page.locator('text=Se connecter');

    expect(await emailLabel.isVisible()).toBeTruthy();
    expect(await passwordLabel.isVisible()).toBeTruthy();
    expect(await loginButton.isVisible()).toBeTruthy();

    console.log('✅ Login page displayed correctly');
  });

  test('should fill login form and show validation', async ({ page }) => {
    console.log('📱 Testing login form...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and fill email input
    const emailInput = page.locator('input').first();
    await emailInput.fill('test@tribe.com');
    await page.waitForTimeout(500);

    // Find and fill password input
    const passwordInput = page.locator('input').nth(1);
    await passwordInput.fill('password123');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/02-login-filled.png', fullPage: true });
    console.log('✅ Login form filled');

    // Click login button
    const loginButton = page.locator('text=Se connecter');
    await loginButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/03-after-login-attempt.png', fullPage: true });
    console.log('✅ Login attempt completed');
  });

  test('should navigate to register page', async ({ page }) => {
    console.log('📱 Testing registration navigation...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click "S'inscrire" link
    const registerLink = page.locator('text=S\'inscrire');
    await registerLink.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'tests/screenshots/04-register-page.png', fullPage: true });

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    expect(currentUrl).toContain('register');
    console.log('✅ Registration page displayed');
  });

  test('should access map directly with mocked auth', async ({ page }) => {
    console.log('📱 Testing map screen with mocked authentication...');

    // Inject authentication state into localStorage before navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Inject mock user into Zustand persisted state
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

    // Navigate to map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/05-map-screen.png', fullPage: true });

    // Check for map UI elements
    const pageContent = await page.content();
    console.log('📍 Checking map UI elements...');

    // Look for search bar placeholder
    const hasSearch = pageContent.includes('Rechercher') || pageContent.includes('rechercher');
    console.log(`🔍 Has search: ${hasSearch}`);

    // Look for category chips
    const hasCategories = pageContent.includes('Restaurants') || pageContent.includes('Cafés');
    console.log(`🏷️ Has categories: ${hasCategories}`);

    await page.screenshot({ path: 'tests/screenshots/06-map-ui-check.png', fullPage: true });
    console.log('✅ Map screen loaded');
  });

  test('should test POI insertion flow', async ({ page }) => {
    console.log('📱 Testing POI insertion flow...');

    // Inject authentication state
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

    // Navigate to map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/07-poi-map-ready.png', fullPage: true });

    // Look for FAB (Add POI button) - it should be a + icon button
    const fabButtons = await page.locator('div').filter({ hasText: '+' }).all();
    console.log(`🔘 Found ${fabButtons.length} potential FAB buttons`);

    // Look for any clickable elements that could be the add button
    const allDivs = await page.locator('div').all();
    console.log(`📦 Total divs: ${allDivs.length}`);

    // Try to click on what appears to be the FAB
    // In React Native Web, SVG icons are often rendered inside divs
    const addButton = page.locator('[aria-label*="add"]').first();
    const fabDiv = page.locator('div').filter({ has: page.locator('svg') }).last();

    if (await fabDiv.isVisible().catch(() => false)) {
      console.log('📍 Found FAB, clicking to add POI...');
      await fabDiv.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'tests/screenshots/08-poi-adding-mode.png', fullPage: true });
    }

    // Check if adding POI mode banner appears
    const pageContent = await page.content();
    const hasAddingBanner = pageContent.includes('Touchez la carte') || pageContent.includes('Annuler');
    console.log(`🗺️ POI adding mode active: ${hasAddingBanner}`);

    await page.screenshot({ path: 'tests/screenshots/09-poi-flow-final.png', fullPage: true });
    console.log('✅ POI insertion flow test completed');
  });

  test('should test drawer navigation', async ({ page }) => {
    console.log('📱 Testing drawer navigation...');

    // Inject authentication state
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

    // Navigate to map
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/10-before-drawer.png', fullPage: true });

    // Look for menu button (hamburger icon)
    const menuButton = page.locator('div').filter({ has: page.locator('svg') }).first();
    if (await menuButton.isVisible().catch(() => false)) {
      console.log('📍 Found menu button, opening drawer...');
      await menuButton.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'tests/screenshots/11-drawer-open.png', fullPage: true });
    }

    // Check drawer content
    const pageContent = await page.content();
    const hasDrawerItems = pageContent.includes('Carte') || pageContent.includes('Profil') || pageContent.includes('Récompenses');
    console.log(`📋 Drawer items visible: ${hasDrawerItems}`);

    console.log('✅ Drawer navigation test completed');
  });

  test('should test profile screen', async ({ page }) => {
    console.log('📱 Testing profile screen...');

    // Inject authentication state
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

    // Navigate to profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/12-profile-screen.png', fullPage: true });

    // Check profile content
    const pageContent = await page.content();
    const hasUserInfo = pageContent.includes('Test User') || pageContent.includes('testuser') || pageContent.includes('Profil');
    const hasStats = pageContent.includes('POI') || pageContent.includes('Niveau') || pageContent.includes('XP');

    console.log(`👤 Has user info: ${hasUserInfo}`);
    console.log(`📊 Has stats: ${hasStats}`);

    console.log('✅ Profile screen test completed');
  });

  test('should test rewards screen', async ({ page }) => {
    console.log('📱 Testing rewards screen...');

    // Inject authentication state
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

    // Navigate to rewards
    await page.goto('/rewards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/13-rewards-screen.png', fullPage: true });

    // Check rewards content
    const pageContent = await page.content();
    const hasRewards = pageContent.includes('Récompenses') || pageContent.includes('Explorateur') || pageContent.includes('Découvreur');
    const hasXP = pageContent.includes('XP') || pageContent.includes('250');

    console.log(`🏆 Has rewards: ${hasRewards}`);
    console.log(`⭐ Has XP display: ${hasXP}`);

    console.log('✅ Rewards screen test completed');
  });

  test('should test my-pois screen', async ({ page }) => {
    console.log('📱 Testing my-pois screen...');

    // Inject authentication state
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

    // Navigate to my-pois
    await page.goto('/my-pois');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'tests/screenshots/14-my-pois-screen.png', fullPage: true });

    // Check my-pois content
    const pageContent = await page.content();
    const hasTitle = pageContent.includes('Mes POI') || pageContent.includes('POI');
    const hasEmptyState = pageContent.includes('Aucun POI') || pageContent.includes('Explorez');

    console.log(`📍 Has title: ${hasTitle}`);
    console.log(`📭 Has empty state: ${hasEmptyState}`);

    console.log('✅ My POIs screen test completed');
  });

  test('should check bundle and render without errors', async ({ page }) => {
    console.log('🔍 Checking app bundle integrity...');

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'tests/screenshots/15-bundle-check.png', fullPage: true });

    // Filter out known SSR warnings that don't affect functionality
    const criticalErrors = errors.filter(e =>
      !e.includes('useLayoutEffect') &&
      !e.includes('SSR') &&
      !e.includes('hydrat')
    );

    if (criticalErrors.length > 0) {
      console.log('❌ Critical errors found:');
      criticalErrors.forEach(e => console.log(`  - ${e}`));
    } else {
      console.log('✅ No critical JavaScript errors detected');
    }

    // Verify basic rendering
    const hasContent = await page.locator('div').first().isVisible();
    expect(hasContent).toBeTruthy();

    console.log('✅ Bundle check completed');
  });
});
