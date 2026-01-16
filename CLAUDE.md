# TRIBE v2 - Context Claude

**Last Updated**: 2026-01-16 21:45 UTC
**Mission**: Développer l'app mobile React Native jusqu'à parité fonctionnelle complète

---

## 🎯 Mission Actuelle

**MODE**: Autonomie totale, zéro interruption
**Workflow**: TDD avec Maestro → Implémentation → Validation → Commit → Next

---

## 📊 État du Projet

### Stack Confirmée
- **Backend**: NestJS + PostgreSQL + PostGIS + Redis + RabbitMQ + MinIO
- **Mobile**: React Native + Expo SDK 54 ✅
- **Maps**: MapLibre (OpenStreetMap) ✅
- **State**: Zustand
- **API Client**: TanStack Query + Axios
- **Routing**: Expo Router (file-based)

### Progression Globale
- **18/35 features** (51%)
- **See**: FEATURES_GAP.md for detailed breakdown
- **P2 REWARDS**: Complete
- **P3 CHAT IA**: Complete

---

## ✅ Ce Qui Est FAIT

### Mobile Screens (UI Complete)
1. **Auth**
   - Login (email/password + Google OAuth) ✅
   - Register screen exists ✅

2. **Map** (main screen)
   - MapLibre full screen ✅
   - Search bar (UI only) ✅
   - Category filter chips ✅
   - FAB "+" add POI ✅
   - BottomSheet create POI ✅
   - BottomSheet POI details ✅
   - Location permission ✅
   - Load POIs from API ✅

3. **Profile**
   - Stats display (POIs, Level, XP) ✅
   - XP progress bar ✅
   - Logout ✅

4. **Rewards** ✅ P2 COMPLETE
   - Badge system with tiers (bronze/silver/gold/platinum) ✅
   - XP tracking ✅
   - Progress tracking per badge ✅
   - API-connected with real data ✅
   - Badge notifications on unlock ✅

5. **Leaderboard** ✅ P2 COMPLETE
   - Podium top 3 ✅
   - Full ranking list ✅
   - Period filters (global/monthly/weekly) ✅
   - API-connected with real data ✅
   - POI count per user ✅

6. **Challenges** ✅ P2 COMPLETE
   - Daily challenges ✅
   - Weekly challenges ✅
   - Challenge progress tracking ✅
   - Claim rewards ✅

7. **Chat** ✅ P3 COMPLETE
   - Full chat UI ✅
   - Message history ✅
   - Suggested questions ✅
   - Session persistence ✅
   - Context-aware AI responses ✅
   - Session history modal ✅
   - New chat/delete session ✅

8. **My POIs**
   - UI layout ✅
   - Empty state ✅

### Services & Infrastructure
- `src/services/api.ts` - Axios with JWT interceptors ✅
- `src/store/auth.ts` - Zustand auth store ✅
- `src/store/map.ts` - Zustand map store ✅
- `src/utils/theme.ts` - Design system ✅
- `src/components/*` - Reusable components ✅
- Docker infrastructure ✅

---

## ❌ Ce Qui MANQUE (Priorité)

### 🔥 P0 - CRITICAL: Mode Offline
**Status**: Hook exists (`useOffline.ts`) but NOT implemented
**Need**:
- expo-sqlite setup
- Local database schema
- Sync queue
- Background sync with expo-task-manager
- Conflict resolution
- Offline indicator UI

### 🔥 P1 - CORE: POI Features Complete
**Missing**:
- Camera/image picker integration
- Photo upload to MinIO
- Search backend integration
- POI edit/delete
- My POIs service (load user's POIs)

### ✅ P2 - REWARDS (COMPLETE)
**Implemented**:
- Backend API endpoints (`/rewards`, `/rewards/badges`, `/rewards/challenges`, `/rewards/leaderboard`)
- Badge entities with tier system (bronze/silver/gold/platinum)
- Challenge system (daily/weekly)
- Leaderboard with period filtering (global/monthly/weekly)
- Badge earning logic on POI creation/validation
- Real-time badge notifications
- Mobile screens connected to real API

### ✅ P3 - CHAT IA (COMPLETE)
**Implemented**:
- ChatSession and ChatMessage entities for persistence
- Session management endpoints (list, get, delete)
- User context integration (level, points, POIs count, recent POIs)
- useChat hook for session state management
- Session history modal with switching
- Graceful fallback to demo responses when ANTHROPIC_API_KEY missing
- Works with real Claude API when key is configured

### 🔥 P4 - TESTS E2E
**Status**: ZERO tests written
**Critical**: All Maestro test flows missing

---

## 🚀 Décisions Prises

### 2026-01-16 20:30 - Initial Audit Complete
- ✅ Confirmed no v1 codebase locally (tribemanager empty)
- ✅ v2 has solid foundation (12 features done)
- ✅ Prioritized Mode Offline as P0 (most critical)
- ✅ Will use TDD with Maestro for all new features

### Architecture Decisions
- **Storage**: Will use expo-sqlite for offline (not AsyncStorage - too slow)
- **Images**: Will use expo-image-picker + expo-file-system + MinIO upload
- **Sync**: Will use expo-background-fetch for periodic sync
- **Tests**: Maestro for E2E (easier than Detox, no native code)

---

## 🔐 Credentials Mockés (À Remplacer)

### Services Externes
| Service | Status | Mock Strategy |
|---------|--------|---------------|
| ANTHROPIC_API_KEY | ❌ Missing | Return hardcoded responses |
| STRIPE_KEY | ❌ Missing | Skip payment, return success |
| Google OAuth | ⚠️ Partial | Works but needs proper redirect URL |
| MinIO | ✅ Running | localhost:9000 |
| PostgreSQL | ✅ Running | localhost:5432 |
| Redis | ✅ Running | localhost:6379 |
| RabbitMQ | ✅ Running | localhost:5672 |

### Environment Variables (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:4000
POSTGRES_PASSWORD=tribe_super_secret_2024
JWT_SECRET=<generated>
ANTHROPIC_API_KEY=<NEEDED - will mock>
RABBITMQ_PASS=tribe_rabbit_2024
GRAFANA_PASSWORD=tribe_grafana_2024
```

---

## ⚠️ Erreurs à Éviter

### Known Issues
1. **BottomSheet**: Has issues in Expo Go → fallback to Modal implemented ✅
2. **MapLibre**: Requires custom native build (not working in Expo Go)
3. **Google OAuth**: Redirect URI must match expo scheme
4. **SecureStore**: Only works on physical devices (use AsyncStorage fallback for web)

### Code Quality
- ✅ No `any` types (use `unknown` or proper types)
- ✅ Strict TypeScript enabled
- ✅ Platform-specific code with Platform.select()
- ⚠️ TODO: Add loading states everywhere
- ⚠️ TODO: Add error boundaries
- ⚠️ TODO: Add proper error handling

---

## 📝 Conventions Suivies

### Git Commits
- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Add tests
- `refactor:` - Code refactor
- `docs:` - Documentation
- `chore:` - Maintenance

### File Structure
```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth group
│   ├── (app)/             # Authenticated screens
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities (theme, etc.)
├── e2e/                   # Maestro E2E tests
│   └── flows/             # Test flows
└── package.json
```

---

## 🧪 Test Strategy

### E2E Tests (Maestro)
**Format**: YAML flows
**Location**: `apps/mobile/e2e/flows/`
**Run**: `maestro test e2e/flows/{flow}.yaml`

**Test Coverage Target**:
- Auth flows (login, register)
- POI lifecycle (create, view, edit, delete)
- Offline mode (create POI offline, sync)
- Rewards (view, claim)
- Chat (send message, receive response)

### Unit Tests (Jest)
**Status**: Setup exists but no tests written
**TODO**: Add unit tests for:
- Services (api, pois, auth)
- Hooks (useOffline, usePOIs)
- Stores (auth, map)

---

## 🔄 Workflow de Développement

### Phase Actuelle: AUDIT → IMPLEMENTATION

1. ✅ **AUDIT** - Analyze v1 & v2, create FEATURES_GAP.md
2. 🟡 **VERIFY** - Check backend API is running
3. 🟡 **SETUP** - Install Maestro CLI
4. 🟡 **TDD** - Write first E2E test
5. 🟡 **IMPLEMENT** - Start P0 (Offline Mode)

### Boucle de Dev (pour chaque feature)
```
PLAN (2min) → TEST E2E (5min) → CODE (15min) → VALIDATE → COMMIT → NEXT
```

**Règles**:
- ✅ Pas de questions, décisions autonomes
- ✅ Mock services externes si credentials manquants
- ✅ Documenter dans CLAUDE.md
- ✅ Commits atomiques
- ✅ Tests before code (TDD)

---

## 📚 Documentation Utile

### External Docs
- Expo SDK 54: https://docs.expo.dev/
- MapLibre React Native: https://github.com/maplibre/maplibre-react-native
- Maestro: https://maestro.mobile.dev/
- Zustand: https://zustand.docs.pmnd.rs/
- TanStack Query: https://tanstack.com/query/latest

### Internal Docs
- README.md - Project overview
- MIGRATION.md - v1 to v2 migration (not relevant, no v1 data)
- FEATURES_GAP.md - Current features gap analysis
- PLAN_DE_TEST.md - Test plan (exists in root)

---

## 🎯 Next Steps (Auto-Execute)

1. 🟡 Verify backend API running (`docker ps` + test endpoints)
2. 🟡 Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
3. 🟡 Create `apps/mobile/e2e/flows/auth-login.yaml`
4. 🟡 Run test (expect fail)
5. 🟡 Fix implementation until test passes
6. 🟡 Commit: `test: add e2e for login flow`
7. 🟡 Move to next feature

---

**Status**: Ready to execute Phase 1 (Offline Mode) after verification and test setup.
