# TRIBE v2 - Plan de Test Complet

## Table des Matieres

1. [Vue d'ensemble](#vue-densemble)
2. [Tests Unitaires API](#1-tests-unitaires-api)
3. [Tests Unitaires Mobile](#2-tests-unitaires-mobile)
4. [Tests E2E](#3-tests-e2e)
5. [Ameliorations Admin](#4-ameliorations-admin)
6. [Plan d'Execution](#5-plan-dexecution)

---

## Vue d'ensemble

### Etat Actuel des Tests

| Composant | Tests Existants | Coverage Estime |
|-----------|-----------------|-----------------|
| API NestJS | auth.spec.ts (Playwright) | ~15% |
| Mobile | 5 fichiers spec (Playwright) | ~10% |
| Admin | Aucun | 0% |

### Objectifs

- **Coverage API** : > 80%
- **Coverage Mobile** : > 70%
- **Coverage Admin** : > 60%
- **Tests E2E** : Parcours utilisateur complets

---

## 1. Tests Unitaires API

### 1.1 Module Auth (`apps/api/src/modules/auth/`)

#### Fichier: `auth.service.spec.ts`

```typescript
// Tests a implementer
describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with hashed password')
    it('should throw ConflictException for duplicate email')
    it('should return JWT token after registration')
    it('should assign default role "collector"')
    it('should initialize points to 0')
  })

  describe('login', () => {
    it('should return JWT token for valid credentials')
    it('should throw UnauthorizedException for invalid email')
    it('should throw UnauthorizedException for invalid password')
    it('should update lastLoginAt timestamp')
  })

  describe('validateUser', () => {
    it('should return user without password for valid credentials')
    it('should return null for invalid credentials')
  })

  describe('getProfile', () => {
    it('should return user profile by id')
    it('should throw NotFoundException for non-existent user')
  })
})
```

#### Fichier: `auth.controller.spec.ts`

```typescript
describe('AuthController', () => {
  describe('POST /auth/register', () => {
    it('should validate RegisterDto fields')
    it('should reject invalid email format')
    it('should reject password < 6 characters')
    it('should return 201 with user and token')
  })

  describe('POST /auth/login', () => {
    it('should validate LoginDto fields')
    it('should return 200 with user and token')
    it('should return 401 for invalid credentials')
  })

  describe('GET /auth/me', () => {
    it('should require JWT authentication')
    it('should return current user profile')
    it('should return 401 without token')
  })
})
```

### 1.2 Module Locations (`apps/api/src/modules/locations/`)

#### Fichier: `locations.service.spec.ts`

```typescript
describe('LocationsService', () => {
  describe('create', () => {
    it('should create location with valid data')
    it('should set default status to "pending"')
    it('should associate location with creator user')
    it('should validate latitude range (-90 to 90)')
    it('should validate longitude range (-180 to 180)')
    it('should generate unique slug from name')
  })

  describe('findAll', () => {
    it('should return paginated results')
    it('should filter by status')
    it('should filter by category')
    it('should filter by userId (creator)')
    it('should support geographic bounding box query')
    it('should sort by createdAt desc by default')
  })

  describe('findOne', () => {
    it('should return location by id')
    it('should include creator user info')
    it('should throw NotFoundException for non-existent id')
  })

  describe('update', () => {
    it('should update location fields')
    it('should only allow owner or admin to update')
    it('should reset status to pending after edit')
  })

  describe('validate', () => {
    it('should set status to validated')
    it('should add points to creator')
    it('should record validator and timestamp')
    it('should trigger notification to creator')
  })

  describe('reject', () => {
    it('should set status to rejected')
    it('should store rejection reason')
    it('should trigger notification to creator')
  })

  describe('remove', () => {
    it('should soft delete location')
    it('should only allow owner or admin to delete')
  })

  describe('getStats', () => {
    it('should return count by status')
    it('should return count by category')
    it('should calculate total points distributed')
  })
})
```

#### Fichier: `locations.controller.spec.ts`

```typescript
describe('LocationsController', () => {
  describe('POST /locations', () => {
    it('should require authentication')
    it('should validate CreateLocationDto')
    it('should return 201 with created location')
  })

  describe('GET /locations', () => {
    it('should return paginated locations')
    it('should accept query filters')
    it('should be public (no auth required)')
  })

  describe('GET /locations/:id', () => {
    it('should return location by id')
    it('should return 404 for non-existent id')
  })

  describe('PATCH /locations/:id', () => {
    it('should require authentication')
    it('should validate UpdateLocationDto')
    it('should return 403 if not owner')
  })

  describe('POST /locations/:id/validate', () => {
    it('should require admin role')
    it('should accept points to award')
    it('should return updated location')
  })

  describe('POST /locations/:id/reject', () => {
    it('should require admin role')
    it('should require rejection reason')
  })

  describe('DELETE /locations/:id', () => {
    it('should require authentication')
    it('should return 403 if not owner/admin')
    it('should return 204 on success')
  })
})
```

### 1.3 Module Chat (`apps/api/src/modules/chat/`)

#### Fichier: `chat.service.spec.ts`

```typescript
describe('ChatService', () => {
  describe('chat', () => {
    it('should return demo response when API key not configured')
    it('should call Anthropic API when key is configured')
    it('should include conversation history in API call')
    it('should handle API errors gracefully')
    it('should respect rate limiting')
  })

  describe('getDemoResponse', () => {
    it('should return contextual response for POI questions')
    it('should return contextual response for navigation questions')
    it('should return generic response for unknown topics')
  })
})
```

### 1.4 Module Users (`apps/api/src/modules/users/`)

#### Fichier: `users.service.spec.ts` (a creer)

```typescript
describe('UsersService', () => {
  describe('findAll', () => {
    it('should return paginated users')
    it('should filter by role')
    it('should sort by points desc for leaderboard')
  })

  describe('findOne', () => {
    it('should return user by id')
    it('should exclude password from response')
  })

  describe('updatePushToken', () => {
    it('should update user push token')
  })

  describe('addPoints', () => {
    it('should add points to user')
    it('should update level if threshold reached')
    it('should trigger level up notification')
  })

  describe('getLeaderboard', () => {
    it('should return top users by points')
    it('should filter by time period (week/month/all)')
    it('should include rank position')
  })
})
```

### 1.5 Guards et Interceptors

#### Fichier: `jwt-auth.guard.spec.ts`

```typescript
describe('JwtAuthGuard', () => {
  it('should allow request with valid JWT')
  it('should reject request without token')
  it('should reject request with expired token')
  it('should reject request with invalid signature')
})
```

#### Fichier: `roles.guard.spec.ts`

```typescript
describe('RolesGuard', () => {
  it('should allow admin to access admin routes')
  it('should reject collector from admin routes')
  it('should allow any authenticated user to non-role routes')
})
```

---

## 2. Tests Unitaires Mobile

### 2.1 Services

#### Fichier: `api.test.ts`

```typescript
describe('API Service', () => {
  describe('getApiUrl', () => {
    it('should return localhost URL in development')
    it('should detect Expo host IP')
    it('should use 10.0.2.2 for Android emulator')
    it('should return production URL in release')
  })

  describe('request interceptors', () => {
    it('should add Authorization header with token')
    it('should handle 401 by clearing auth state')
  })
})
```

#### Fichier: `offline.test.ts`

```typescript
describe('OfflineService', () => {
  describe('cachePOIs', () => {
    it('should store POIs in AsyncStorage')
    it('should update last sync timestamp')
  })

  describe('getCachedPOIs', () => {
    it('should return cached POIs')
    it('should return empty array if no cache')
  })

  describe('addPendingPOI', () => {
    it('should queue POI for sync')
    it('should generate unique pending ID')
  })

  describe('syncPendingChanges', () => {
    it('should sync all pending POIs when online')
    it('should remove successfully synced items')
    it('should keep failed items for retry')
    it('should return success/failed counts')
  })

  describe('network listener', () => {
    it('should detect online/offline state changes')
    it('should trigger sync when coming online')
  })
})
```

#### Fichier: `notifications.test.ts`

```typescript
describe('NotificationService', () => {
  describe('registerForPushNotifications', () => {
    it('should request permissions')
    it('should return null on simulator')
    it('should register token with backend')
    it('should configure Android channel')
  })

  describe('scheduleLocalNotification', () => {
    it('should schedule immediate notification')
    it('should include notification data')
  })

  describe('notification templates', () => {
    it('should format POI validated notification')
    it('should format level up notification')
    it('should format reward earned notification')
  })
})
```

#### Fichier: `chat.test.ts`

```typescript
describe('ChatService', () => {
  describe('sendMessage', () => {
    it('should send message to API')
    it('should include conversation history')
    it('should handle network errors')
  })
})
```

### 2.2 Hooks

#### Fichier: `useOffline.test.ts`

```typescript
describe('useOffline', () => {
  it('should provide online status')
  it('should provide pending count')
  it('should trigger sync manually')
  it('should update pending count after operations')
})
```

#### Fichier: `useNotifications.test.ts`

```typescript
describe('useNotifications', () => {
  it('should register for notifications on mount')
  it('should handle notification responses')
  it('should navigate based on notification type')
  it('should cleanup listeners on unmount')
})
```

#### Fichier: `usePOIs.test.ts`

```typescript
describe('usePOIs', () => {
  it('should fetch POIs on mount')
  it('should filter POIs by category')
  it('should handle loading state')
  it('should handle error state')
  it('should refresh POIs')
})
```

### 2.3 Components

#### Fichier: `MapView.test.tsx`

```typescript
describe('MapView', () => {
  it('should render map container')
  it('should display POI markers')
  it('should center on user location')
  it('should call onPOIPress when marker tapped')
  it('should call onMapPress for new POI')
})
```

#### Fichier: `POIBottomSheet.test.tsx`

```typescript
describe('POIBottomSheet', () => {
  it('should display POI details')
  it('should show category icon')
  it('should show creator info')
  it('should show validation status')
  it('should handle close gesture')
})
```

#### Fichier: `AddPOIBottomSheet.test.tsx`

```typescript
describe('AddPOIBottomSheet', () => {
  it('should display form fields')
  it('should validate required fields')
  it('should show location coordinates')
  it('should submit POI to API')
  it('should queue POI when offline')
})
```

#### Fichier: `CategoryChips.test.tsx`

```typescript
describe('CategoryChips', () => {
  it('should render all categories')
  it('should highlight selected category')
  it('should call onSelect when tapped')
  it('should scroll horizontally')
})
```

#### Fichier: `DrawerContent.test.tsx`

```typescript
describe('DrawerContent', () => {
  it('should display user info')
  it('should render all menu items')
  it('should navigate on item press')
  it('should show offline indicator')
  it('should show pending sync count')
})
```

---

## 3. Tests E2E

### 3.1 Configuration Playwright

#### Fichier: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 2,
  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
    },
    {
      name: 'admin',
      testMatch: /.*\.admin\.spec\.ts/,
      use: { baseURL: 'http://localhost:3001' },
    },
    {
      name: 'mobile',
      testMatch: /.*\.mobile\.spec\.ts/,
      // Maestro or Detox configuration
    },
  ],
})
```

### 3.2 Tests E2E API

#### Fichier: `auth-flow.api.spec.ts`

```typescript
describe('Authentication Flow E2E', () => {
  test('Complete registration flow', async ({ request }) => {
    // 1. Register new user
    // 2. Verify email format validation
    // 3. Verify JWT token returned
    // 4. Use token to access protected route
    // 5. Verify user in database
  })

  test('Login and session management', async ({ request }) => {
    // 1. Login with valid credentials
    // 2. Access protected routes
    // 3. Token expiration handling
    // 4. Refresh token flow (if implemented)
  })
})
```

#### Fichier: `poi-lifecycle.api.spec.ts`

```typescript
describe('POI Lifecycle E2E', () => {
  test('Complete POI creation to validation', async ({ request }) => {
    // 1. Login as collector
    // 2. Create new POI
    // 3. Verify POI status is pending
    // 4. Login as admin
    // 5. Validate POI
    // 6. Verify collector received points
    // 7. Verify notification sent
  })

  test('POI rejection flow', async ({ request }) => {
    // 1. Create POI
    // 2. Admin rejects with reason
    // 3. Verify rejection reason stored
    // 4. Verify collector notified
  })

  test('POI update and re-validation', async ({ request }) => {
    // 1. Create and validate POI
    // 2. Update POI as owner
    // 3. Verify status reset to pending
    // 4. Re-validate
  })
})
```

#### Fichier: `leaderboard.api.spec.ts`

```typescript
describe('Leaderboard E2E', () => {
  test('Points accumulation and ranking', async ({ request }) => {
    // 1. Create multiple users
    // 2. Have them create POIs
    // 3. Validate POIs with different points
    // 4. Verify leaderboard ordering
    // 5. Test time-based filtering
  })
})
```

### 3.3 Tests E2E Admin

#### Fichier: `admin-auth.admin.spec.ts`

```typescript
describe('Admin Authentication E2E', () => {
  test('Admin login flow', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@tribe.sn')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('Non-admin rejected', async ({ page }) => {
    // Login with collector credentials
    // Verify access denied to admin routes
  })

  test('Session persistence', async ({ page }) => {
    // Login
    // Refresh page
    // Verify still logged in
  })
})
```

#### Fichier: `poi-management.admin.spec.ts`

```typescript
describe('POI Management E2E', () => {
  test('View and filter locations', async ({ page }) => {
    await page.goto('/dashboard/locations')

    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'pending')
    await expect(page.locator('.location-card')).toHaveCount(/* expected */)

    // Filter by category
    await page.selectOption('[data-testid="category-filter"]', 'restaurant')
    // Verify results
  })

  test('Validate POI workflow', async ({ page }) => {
    await page.goto('/dashboard/locations')
    await page.selectOption('[data-testid="status-filter"]', 'pending')

    // Click validate on first POI
    await page.click('.location-card:first-child [data-testid="validate-btn"]')

    // Fill modal
    await page.fill('[data-testid="points-input"]', '15')
    await page.click('[data-testid="confirm-btn"]')

    // Verify POI status updated
    await expect(page.locator('.location-card:first-child .status-badge'))
      .toHaveText('Valide')
  })

  test('Reject POI with reason', async ({ page }) => {
    // Similar flow with rejection
  })

  test('Pagination', async ({ page }) => {
    await page.goto('/dashboard/locations')
    await page.click('[data-testid="next-page"]')
    // Verify page 2 loaded
  })
})
```

#### Fichier: `dashboard-stats.admin.spec.ts`

```typescript
describe('Dashboard Stats E2E', () => {
  test('Stats cards display correctly', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('[data-testid="total-pois"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-pois"]')).toBeVisible()
    await expect(page.locator('[data-testid="validated-pois"]')).toBeVisible()
    await expect(page.locator('[data-testid="rejected-pois"]')).toBeVisible()
  })

  test('Stats update after actions', async ({ page }) => {
    // Get initial stats
    // Validate a POI
    // Refresh dashboard
    // Verify stats changed
  })
})
```

### 3.4 Tests E2E Mobile (Maestro)

#### Fichier: `onboarding.yaml`

```yaml
appId: com.tribe.app
---
- launchApp
- assertVisible: "Bienvenue"
- tapOn: "Commencer"
- assertVisible: "Connexion"
```

#### Fichier: `auth-flow.yaml`

```yaml
appId: com.tribe.app
---
- launchApp
- tapOn: "Se connecter"
- tapOn:
    id: "email-input"
- inputText: "test@tribe.sn"
- tapOn:
    id: "password-input"
- inputText: "test123"
- tapOn: "Connexion"
- assertVisible: "Carte"
```

#### Fichier: `create-poi.yaml`

```yaml
appId: com.tribe.app
---
# Login first
- runFlow: auth-flow.yaml

# Create POI
- tapOn:
    id: "fab-add-poi"
- assertVisible: "Nouveau POI"
- tapOn:
    id: "poi-name-input"
- inputText: "Restaurant Test"
- tapOn: "Restaurant"  # Category
- tapOn:
    id: "poi-description-input"
- inputText: "Un excellent restaurant"
- tapOn: "Enregistrer"
- assertVisible: "POI cree"
```

#### Fichier: `map-interaction.yaml`

```yaml
appId: com.tribe.app
---
- runFlow: auth-flow.yaml
- assertVisible:
    id: "map-view"
- tapOn:
    id: "my-location-btn"
# Wait for location
- extendedWaitUntil:
    visible:
      id: "user-marker"
    timeout: 10000
- tapOn:
    id: "poi-marker-1"
- assertVisible: "Details POI"
```

---

## 4. Ameliorations Admin

### 4.1 Gestion des Utilisateurs

#### Nouvelle page: `/dashboard/users`

**Fonctionnalites:**
- Liste paginee des utilisateurs
- Filtres: role, status (actif/banni), niveau
- Recherche par nom/email
- Actions: voir profil, modifier role, bannir/debannir
- Stats par utilisateur: POIs crees, points, niveau

```typescript
// Structure de la page
interface UsersPageFeatures {
  list: {
    columns: ['avatar', 'fullName', 'email', 'role', 'points', 'level', 'poisCount', 'actions']
    sortable: ['points', 'level', 'poisCount', 'createdAt']
    filterable: ['role', 'status']
  }
  actions: {
    viewProfile: boolean
    editRole: boolean  // admin only
    banUser: boolean   // admin only
    resetPassword: boolean  // admin only
  }
}
```

#### Nouvelle page: `/dashboard/users/[id]`

**Fonctionnalites:**
- Profil detaille de l'utilisateur
- Historique des POIs crees
- Graphique d'activite
- Historique des points/recompenses
- Actions admin

### 4.2 Export de Donnees

#### Nouvelle page: `/dashboard/export`

**Fonctionnalites:**
- Export POIs en CSV/JSON/GeoJSON
- Filtres avant export (status, category, date range)
- Export utilisateurs (admin only)
- Export statistiques

```typescript
interface ExportOptions {
  format: 'csv' | 'json' | 'geojson'
  entity: 'locations' | 'users' | 'stats'
  filters: {
    status?: string[]
    category?: string[]
    dateFrom?: Date
    dateTo?: Date
    userId?: string
  }
  fields?: string[]  // Custom field selection
}
```

### 4.3 Carte Administrative

#### Nouvelle page: `/dashboard/map`

**Fonctionnalites:**
- Visualisation de tous les POIs sur carte
- Clustering pour performance
- Filtres par status/category
- Click sur POI pour voir details et valider
- Heatmap de densite des POIs
- Zones de couverture

### 4.4 Statistiques Avancees

#### Amelioration: `/dashboard` et `/dashboard/analytics`

**Nouvelles metriques:**
- POIs par jour/semaine/mois (graphique)
- Taux de validation/rejet
- Top collecteurs
- Categories les plus populaires
- Carte de chaleur geographique
- Temps moyen de validation

```typescript
interface AdvancedStats {
  timeline: {
    period: 'day' | 'week' | 'month'
    data: { date: string; created: number; validated: number; rejected: number }[]
  }
  topCollectors: {
    userId: string
    fullName: string
    poisCount: number
    validationRate: number
  }[]
  categoryBreakdown: {
    category: string
    count: number
    percentage: number
  }[]
  geographicDensity: {
    lat: number
    lng: number
    count: number
  }[]
}
```

### 4.5 Notifications Admin

#### Nouveau composant: `NotificationCenter`

**Fonctionnalites:**
- Badge avec nombre de POIs en attente
- Liste des actions recentes
- Alertes pour POIs en attente depuis longtemps
- Notifications push navigateur

### 4.6 Ameliorations UX Admin

**Liste des ameliorations:**
- [ ] Dark mode
- [ ] Responsive design ameliore (mobile admin)
- [ ] Raccourcis clavier (V pour valider, R pour rejeter)
- [ ] Bulk actions (valider/rejeter plusieurs POIs)
- [ ] Preview photo en grand
- [ ] Historique des actions admin
- [ ] Recherche globale

---

## 5. Plan d'Execution

### Phase 1: Tests Unitaires API (Priorite Haute)

| Tache | Effort | Fichiers |
|-------|--------|----------|
| Setup Jest + mocks | 2h | jest.config.ts, mocks/ |
| AuthService tests | 3h | auth.service.spec.ts |
| AuthController tests | 2h | auth.controller.spec.ts |
| LocationsService tests | 4h | locations.service.spec.ts |
| LocationsController tests | 3h | locations.controller.spec.ts |
| ChatService tests | 2h | chat.service.spec.ts |
| Guards tests | 2h | guards/*.spec.ts |

**Total Phase 1: ~18h**

### Phase 2: Tests Unitaires Mobile (Priorite Moyenne)

| Tache | Effort | Fichiers |
|-------|--------|----------|
| Setup Jest + RNTL | 2h | jest.config.js, setup.js |
| Services tests | 4h | services/*.test.ts |
| Hooks tests | 3h | hooks/*.test.ts |
| Components tests | 5h | components/*.test.tsx |

**Total Phase 2: ~14h**

### Phase 3: Tests E2E (Priorite Moyenne)

| Tache | Effort | Fichiers |
|-------|--------|----------|
| Config Playwright | 1h | playwright.config.ts |
| API E2E tests | 4h | tests/e2e/*.api.spec.ts |
| Admin E2E tests | 4h | tests/e2e/*.admin.spec.ts |
| Setup Maestro | 2h | maestro/ |
| Mobile E2E flows | 4h | maestro/*.yaml |

**Total Phase 3: ~15h**

### Phase 4: Ameliorations Admin (Priorite Basse)

| Tache | Effort | Fichiers |
|-------|--------|----------|
| Page Users | 6h | users/page.tsx, [id]/page.tsx |
| Page Export | 4h | export/page.tsx |
| Page Map | 5h | map/page.tsx |
| Analytics avances | 4h | dashboard/page.tsx, analytics/ |
| Notifications | 3h | components/NotificationCenter |
| UX improvements | 4h | Various |

**Total Phase 4: ~26h**

---

### Commandes pour Lancer les Tests

```bash
# Tests unitaires API
cd apps/api && npm test
cd apps/api && npm run test:cov  # avec coverage

# Tests unitaires Mobile
cd apps/mobile && npm test

# Tests E2E API
cd apps/api && npm run test:e2e

# Tests E2E Admin (Playwright)
npx playwright test --project=admin

# Tests E2E Mobile (Maestro)
maestro test maestro/
```

---

### Metriques de Succes

| Metrique | Objectif | Actuel |
|----------|----------|--------|
| Coverage API | > 80% | ~15% |
| Coverage Mobile | > 70% | ~10% |
| Coverage Admin | > 60% | 0% |
| Tests E2E passants | 100% | N/A |
| Temps CI/CD | < 10min | N/A |

---

*Document genere le 23 decembre 2025*
