# TRIBE v2 - FEATURES GAP ANALYSIS

**Date**: 2026-01-16 21:00 UTC
**Progression**: 20/35 (57%)

---

## 🎯 LÉGENDE

- ✅ **DONE**: Implémenté et testé
- 🟡 **IN_PROGRESS**: En cours
- ⚠️ **PARTIAL**: Partiellement implémenté
- ❌ **TODO**: À faire
- 🔥 **CRITICAL**: Priorité P0

---

## 📱 MOBILE APP - ÉCRANS

### 🔐 Authentication
- ✅ Login (email/password + Google OAuth)
- ⚠️ Register (screen exists but not verified)
- ❌ Forgot Password
- ❌ Email Verification
- ❌ Phone OTP (optional)

### 🗺️ Map (Écran Principal)
- ✅ MapLibre OpenStreetMap full screen
- ✅ Floating search bar
- ✅ Category filter chips
- ✅ FAB "+" to add POI
- ✅ Add POI mode (tap to place)
- ✅ BottomSheet POI creation form
- ✅ BottomSheet POI details
- ✅ User location permission
- ✅ Load POIs from API
- ✅ Level badge display
- ❌ Search functionality (UI done, backend missing)
- ❌ Real-time POI updates
- ❌ POI clustering on zoom out
- ❌ Route to POI (directions)

### 👤 Profile
- ✅ Profile screen with stats
- ✅ XP progress bar
- ✅ Level display
- ✅ Avatar
- ⚠️ Settings screen (exists but not verified)
- ❌ Edit profile
- ❌ Upload avatar
- ❌ Change password
- ❌ Delete account

### 📍 My POIs
- ✅ UI layout complete
- ⚠️ Load user's POIs (service missing)
- ❌ Filter by status (pending/validated/rejected)
- ❌ Edit POI
- ❌ Delete POI
- ❌ Share POI

### 🏆 Rewards
- ✅ Rewards list
- ✅ XP progress display
- ✅ Badge system (Explorateur, Découvreur, etc.)
- ❌ Real badge data from API
- ❌ Claim rewards
- ❌ Reward notifications

### 📊 Leaderboard
- ✅ Global leaderboard with podium
- ✅ Period filters (all/month/week)
- ⚠️ Mock data (API endpoint missing)
- ❌ Real-time leaderboard updates
- ❌ User rank position
- ❌ Friends leaderboard

### 💬 Chat IA
- ✅ Chat interface
- ✅ Message history
- ✅ Suggested questions
- ⚠️ Claude API integration (service exists but API key needed)
- ❌ Context-aware responses
- ❌ Chat history persistence

---

## 🔧 SERVICES & FEATURES

### 🌐 API Integration
- ✅ Axios instance with interceptors
- ✅ JWT token management
- ✅ Token refresh logic
- ⚠️ POIs service (partial)
- ⚠️ Auth service (partial)
- ⚠️ Chat service (partial)
- ❌ Notifications service
- ❌ Offline service complete
- ❌ Analytics service

### 📶 Mode Offline (🔥 P0 - CRITICAL) ✅ DONE
- ✅ useOffline hook refactored
- ✅ Local SQLite database (expo-sqlite)
- ✅ Sync queue
- ✅ Conflict resolution
- ✅ Background sync (expo-background-fetch)
- ✅ Offline indicator UI (banner + pending count)
- ✅ Offline-first POI creation
- ❌ Cached map tiles (future enhancement)

### 🔔 Notifications
- ⚠️ useNotifications hook exists
- ❌ Push notifications setup
- ❌ Local notifications
- ❌ Notification preferences
- ❌ Badge count
- ❌ Deep linking from notifications

### 📸 Media
- ❌ Camera integration for POI photos
- ❌ Image picker
- ❌ Image upload to MinIO
- ❌ Image compression
- ❌ Multiple photos per POI
- ❌ Photo gallery view

### 🎮 Gamification
- ✅ XP system (UI)
- ✅ Level system (UI)
- ✅ Basic rewards (UI)
- ❌ Daily challenges
- ❌ Streaks
- ❌ Achievements
- ❌ Referral system

---

## 🧪 TESTS E2E (Maestro)

### ❌ Test Files (CRITICAL - ALL MISSING)
- ❌ `e2e/flows/auth-login.yaml`
- ❌ `e2e/flows/auth-register.yaml`
- ❌ `e2e/flows/poi-create.yaml`
- ❌ `e2e/flows/poi-view.yaml`
- ❌ `e2e/flows/profile-view.yaml`
- ❌ `e2e/flows/rewards-view.yaml`
- ❌ `e2e/flows/leaderboard-view.yaml`
- ❌ `e2e/flows/chat-send.yaml`
- ❌ `e2e/flows/offline-sync.yaml`

---

## 🎨 UI/UX POLISH

### ✅ Done
- ✅ Theme system (colors, spacing, typography)
- ✅ Component library (SearchBar, CategoryChips, etc.)
- ✅ SafeAreaView handling
- ✅ Platform-specific shadows

### ❌ Missing
- ❌ Loading states everywhere
- ❌ Error boundary
- ❌ Empty states for all screens
- ❌ Skeleton loaders
- ❌ Toast notifications
- ❌ Pull-to-refresh everywhere
- ❌ Animations (Reanimated)
- ❌ Haptic feedback
- ❌ Dark mode support

---

## 🔙 BACKEND API

### ⚠️ Status: NEEDS VERIFICATION

**To verify:**
1. Is the NestJS API running?
2. Are all endpoints implemented?
3. Do endpoints match mobile expectations?

### Endpoints to check:
- ❌ `POST /auth/login`
- ❌ `POST /auth/register`
- ❌ `POST /auth/refresh`
- ❌ `GET /pois` (list POIs)
- ❌ `POST /pois` (create POI)
- ❌ `GET /pois/:id`
- ❌ `GET /pois/my`
- ❌ `GET /leaderboard`
- ❌ `GET /rewards`
- ❌ `POST /chat` (Claude integration)

---

## 📦 DEPENDENCIES TO ADD

### Critical
- ❌ `expo-sqlite` - for offline storage
- ❌ `@react-native-async-storage/async-storage` - already in devDeps, move to deps
- ❌ `react-native-mmkv` - faster storage alternative
- ❌ `expo-notifications` - push notifications
- ❌ `expo-task-manager` - background sync
- ❌ `expo-background-fetch` - periodic sync

### Nice to have
- ❌ `react-native-reanimated` (already installed, use it!)
- ❌ `react-native-haptic-feedback`
- ❌ `react-native-toast-message`
- ❌ `sentry-expo` - error tracking

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: P0 - CRITICAL (Mode Offline)
1. ❌ Setup expo-sqlite
2. ❌ Create offline schema
3. ❌ Implement sync queue
4. ❌ POI offline CRUD
5. ❌ Background sync worker
6. ❌ Conflict resolution
7. 🟡 Test E2E offline flow

### Phase 2: P1 - CORE (POI Complete)
1. ❌ Camera integration
2. ❌ Image upload to MinIO
3. ❌ Multiple photos per POI
4. ❌ Search backend integration
5. ❌ POI edit/delete
6. ❌ My POIs service implementation
7. 🟡 Test E2E POI lifecycle

### Phase 3: P2 - REWARDS
1. ❌ Backend rewards API
2. ❌ Claim rewards
3. ❌ Badge notifications
4. ❌ Daily challenges
5. ❌ Streaks system
6. 🟡 Test E2E rewards flow

### Phase 4: P3 - CHAT IA
1. ❌ Get ANTHROPIC_API_KEY
2. ❌ Backend chat endpoint
3. ❌ Context-aware chat (user stats, POIs)
4. ❌ Chat history persistence
5. 🟡 Test E2E chat

### Phase 5: P4 - POLISH
1. ❌ All loading states
2. ❌ All error states
3. ❌ Animations
4. ❌ Haptic feedback
5. ❌ Dark mode
6. ❌ A11y (accessibility)

---

## 🎯 NEXT ACTIONS (AUTO-PILOT MODE)

1. ✅ Generate this FEATURES_GAP.md
2. 🟡 Update CLAUDE.md with current context
3. 🟡 Verify backend API is running
4. 🟡 Install Maestro CLI
5. 🟡 Create first E2E test (auth-login.yaml)
6. 🟡 Start Phase 1: Offline Mode implementation

---

**Last Updated**: 2026-01-16 20:30 UTC
