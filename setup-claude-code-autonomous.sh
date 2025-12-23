#!/bin/bash
# ============================================
# TRIBE v2 - Configuration Claude Code Autonome
# Bonnes pratiques Anthropic - Décembre 2025
# ============================================

set -e

TRIBE_DIR="${1:-$HOME/tribe-v2-ultimate}"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Configuration Claude Code Autonome pour TRIBE v2${NC}"
echo "=================================================="
echo ""

# Vérifier que le dossier existe
if [ ! -d "$TRIBE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Dossier $TRIBE_DIR non trouvé. Création...${NC}"
    mkdir -p "$TRIBE_DIR"
fi

cd "$TRIBE_DIR"
echo -e "${GREEN}📁 Dossier : $TRIBE_DIR${NC}"
echo ""

# ============================================
# 1. Structure des dossiers
# ============================================
echo -e "${BLUE}1️⃣  Création de la structure .claude/${NC}"

mkdir -p .claude/agents
mkdir -p .claude/commands
mkdir -p .claude/skills/tribe-conventions

echo "   ✅ .claude/agents/"
echo "   ✅ .claude/commands/"
echo "   ✅ .claude/skills/"
echo ""

# ============================================
# 2. CLAUDE.md principal
# ============================================
echo -e "${BLUE}2️⃣  Création de CLAUDE.md${NC}"

cat > CLAUDE.md << 'CLAUDEMD'
# TRIBE v2 - Application de Collecte de POI au Sénégal

## 🎯 Mission
Développer une application mobile pour collecter des Points d'Intérêt (POI) au Sénégal, avec gamification et récompenses pour les collecteurs.

## 🏗️ Architecture

### Stack Technique
| Composant | Technologie |
|-----------|-------------|
| Backend | NestJS + TypeScript |
| Mobile | React Native + Expo SDK 54 |
| Admin | Next.js 14 |
| Database | PostgreSQL 15 + PostGIS |
| Cache | Redis 7 |
| Queue | RabbitMQ 3.12 |
| Storage | MinIO (S3) |
| Maps | OpenStreetMap (PAS Google) |

### Services Docker

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | postgres / tribe_super_secret_2024 / tribe |
| Redis | 6379 | - |
| RabbitMQ | 5672, 15672 | tribe / tribe_rabbit_2024 |
| MinIO | 9000, 9001 | tribe_minio_access / tribe_minio_secret_2024 |
| API NestJS | 4000 | JWT Bearer |
| Admin Next.js | 3001 | - |
| Mobile Expo | 8081 | - |
| Grafana | 3030 | admin / tribe_grafana_2024 |
| Prometheus | 9090 | - |
| Traefik | 80, 8080 | - |

### Structure Monorepo
```
apps/
├── api/          # Backend NestJS
├── mobile/       # App React Native Expo  
└── admin/        # Dashboard Next.js
packages/
└── types/        # Types TypeScript partagés
infra/
├── prometheus/   # Config monitoring
├── grafana/      # Dashboards
└── loki/         # Logs
```

## 🛠️ Commandes

```bash
# Infrastructure
docker compose up -d              # Démarrer tous les services
docker compose ps                 # Status des services
docker compose logs -f [service]  # Logs en temps réel

# API
cd apps/api && npm run start:dev

# Mobile  
cd apps/mobile && npx expo start --tunnel

# Admin
cd apps/admin && npm run dev

# Tests
npm test                          # Tous les tests
cd apps/api && npm test           # Tests API
cd apps/mobile && npm test        # Tests Mobile

# Base de données
docker exec -it tribe-postgres psql -U postgres -d tribe
```

## 📝 Conventions de Code

### TypeScript
- Mode strict activé
- Pas de `any` → utiliser `unknown`
- Interfaces pour les objets, types pour les unions
- PascalCase classes, camelCase variables/fonctions

### API NestJS
- Un module par domaine : `modules/{domain}/`
- DTOs avec class-validator pour validation
- Swagger sur tous les endpoints publics
- Guards pour authentication JWT
- Interceptors pour logging et metrics

### React Native
- Composants fonctionnels uniquement
- Hooks dans `hooks/`
- Zustand pour state global
- TanStack Query pour appels API
- NativeWind pour styles (Tailwind CSS)

### Git
- Commits conventionnels : `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Branches : `feature/*`, `bugfix/*`, `hotfix/*`
- Pull Request obligatoire pour merge dans `main`

## 🗺️ UX Mobile - Carte First

L'app mobile doit être centrée sur la carte comme Google Maps/Waze :
- Carte OpenStreetMap 100% plein écran
- Barre de recherche flottante en haut
- Chips de filtres catégories scrollables
- FAB "+" vert pour ajouter POI
- Bouton "Ma position" flottant
- Bottom sheet pour détails POI
- Drawer menu pour navigation (Profil, Mes POI, Récompenses)

## ✅ Fonctionnalités Implémentées

- [x] Infrastructure Docker complète
- [x] API NestJS avec CRUD locations
- [x] Authentication JWT
- [x] Dashboard Admin basique
- [x] App Mobile React Native structure
- [x] OpenStreetMap intégré

## 📋 Fonctionnalités À Faire

- [ ] UX carte-first complète
- [ ] Mise à jour Expo SDK 54
- [ ] Chat IA Claude intégré
- [ ] Notifications push
- [ ] Mode offline avec cache
- [ ] Leaderboard
- [ ] Système de récompenses complet
- [ ] Export données admin

## 🔄 Workflow Développement

1. **Comprendre** : Analyser la demande, poser des questions
2. **Explorer** : Utiliser Grep/Glob pour comprendre le code existant
3. **Planifier** : Lister les changements nécessaires
4. **Implémenter** : Petits commits itératifs
5. **Tester** : Lancer les tests appropriés
6. **Review** : Utiliser le subagent code-reviewer
7. **Documenter** : Mettre à jour ce fichier si besoin

## 🔐 Sécurité

- Ne jamais commiter de secrets
- Variables sensibles dans `.env` (gitignored)
- JWT pour toutes les routes protégées
- Validation stricte des entrées
- Rate limiting sur l'API
CLAUDEMD

echo "   ✅ CLAUDE.md créé"
echo ""

# ============================================
# 3. settings.json avec permissions autonomes
# ============================================
echo -e "${BLUE}3️⃣  Création de .claude/settings.json${NC}"

cat > .claude/settings.json << 'SETTINGSJSON'
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Grep",
      "Glob",
      "LS",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(pnpm *)",
      "Bash(yarn *)",
      "Bash(node *)",
      "Bash(git *)",
      "Bash(docker *)",
      "Bash(docker compose *)",
      "Bash(docker-compose *)",
      "Bash(cd *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(rm *)",
      "Bash(cat *)",
      "Bash(echo *)",
      "Bash(printf *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(which *)",
      "Bash(whereis *)",
      "Bash(ls *)",
      "Bash(pwd)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(grep *)",
      "Bash(find *)",
      "Bash(sed *)",
      "Bash(awk *)",
      "Bash(sort *)",
      "Bash(uniq *)",
      "Bash(wc *)",
      "Bash(diff *)",
      "Bash(expo *)",
      "Bash(flutter *)",
      "Bash(psql *)",
      "Bash(redis-cli *)",
      "Bash(sleep *)",
      "Bash(touch *)",
      "Bash(chmod *)",
      "Bash(chown *)",
      "Bash(tar *)",
      "Bash(zip *)",
      "Bash(unzip *)",
      "Bash(env)",
      "Bash(export *)",
      "Bash(source *)",
      "Bash(. *)",
      "Bash(test *)",
      "Bash([ *)",
      "Bash([[ *)",
      "Bash(true)",
      "Bash(false)",
      "Bash(tee *)",
      "Bash(xargs *)",
      "Bash(kill *)",
      "Bash(pkill *)",
      "Bash(pgrep *)",
      "Bash(ps *)",
      "Bash(lsof *)",
      "Bash(netstat *)",
      "Bash(ss *)",
      "WebFetch"
    ],
    "deny": [
      "Read(.env.production)",
      "Read(**/.env.production)",
      "Read(**/secrets/**)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Write(.env.production)",
      "Write(**/.env.production)",
      "Write(**/secrets/**)",
      "Bash(rm -rf /)",
      "Bash(rm -rf /*)",
      "Bash(sudo *)",
      "Bash(su *)",
      "Bash(passwd *)",
      "Bash(shutdown *)",
      "Bash(reboot *)",
      "Bash(init *)",
      "Bash(mkfs *)",
      "Bash(dd if=/dev/*)",
      "Bash(:(){ :|:& };:)",
      "Bash(chmod 777 /)",
      "Bash(chown -R * /)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.ts)",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      },
      {
        "matcher": "Write(*.tsx)",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      },
      {
        "matcher": "Write(*.js)",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      },
      {
        "matcher": "Write(*.jsx)",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      },
      {
        "matcher": "Write(*.json)",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "echo '🚀 TRIBE v2 - Claude Code session démarrée'"
          }
        ]
      }
    ]
  },
  "env": {
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "16384",
    "BASH_DEFAULT_TIMEOUT_MS": "120000",
    "NODE_ENV": "development"
  }
}
SETTINGSJSON

echo "   ✅ .claude/settings.json créé"
echo ""

# ============================================
# 4. Subagents
# ============================================
echo -e "${BLUE}4️⃣  Création des Subagents${NC}"

# API Developer
cat > .claude/agents/api-developer.md << 'AGENT1'
---
name: api-developer
description: Expert NestJS pour l'API TRIBE. Utiliser pour créer/modifier endpoints, services, modules, DTOs, migrations.
tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

Tu es un expert NestJS senior. Tu développes l'API backend TRIBE dans `apps/api/`.

## Stack Technique
- NestJS avec TypeScript strict
- TypeORM pour PostgreSQL
- Redis pour cache et sessions
- RabbitMQ pour events asynchrones
- MinIO pour stockage fichiers
- Swagger pour documentation API
- JWT pour authentification

## Structure
```
apps/api/src/
├── modules/
│   ├── auth/
│   ├── locations/
│   ├── users/
│   ├── rewards/
│   └── notifications/
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── decorators/
└── config/
```

## Conventions
- Un module par domaine fonctionnel
- DTOs avec class-validator pour validation entrée
- Entities TypeORM avec relations
- Services injectables (@Injectable)
- Controllers avec décorateurs Swagger
- Guards pour authentification/autorisation

## Workflow
1. Analyser la demande
2. Vérifier le code existant (Grep/Glob)
3. Créer/modifier les fichiers nécessaires
4. Ajouter les validations DTO
5. Documenter avec Swagger
6. Écrire les tests unitaires

## Checklist Fin de Tâche
- [ ] TypeScript compile sans erreur
- [ ] DTOs avec validations appropriées
- [ ] Swagger annotations complètes
- [ ] Tests unitaires ajoutés
- [ ] Pas de `any` dans le code
- [ ] Gestion des erreurs
AGENT1

echo "   ✅ api-developer.md"

# Mobile Developer
cat > .claude/agents/mobile-developer.md << 'AGENT2'
---
name: mobile-developer
description: Expert React Native Expo pour l'app mobile TRIBE. Utiliser pour screens, components, navigation, state.
tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

Tu es un expert React Native + Expo. Tu développes l'application mobile TRIBE dans `apps/mobile/`.

## Stack Technique
- React Native avec Expo SDK 54
- TypeScript strict
- expo-router pour navigation
- Zustand pour state management
- TanStack Query pour API calls
- NativeWind (Tailwind CSS)
- react-native-maps avec OpenStreetMap
- @gorhom/bottom-sheet pour modales

## Structure
```
apps/mobile/
├── app/                 # expo-router pages
├── components/          # Composants réutilisables
├── hooks/              # Custom hooks
├── services/           # API calls
├── store/              # Zustand stores
├── types/              # TypeScript types
└── utils/              # Helpers
```

## UX Carte-First
L'application doit être centrée sur la carte :
- Carte OpenStreetMap 100% plein écran (pas de header/footer fixes)
- Barre de recherche flottante en haut avec ombre
- Chips de filtres catégories scrollables horizontalement
- FAB "+" vert (#10B981) en bas à droite pour ajouter POI
- Bouton "Ma position" flottant au-dessus du FAB
- Bottom sheet glissant pour détails POI
- Drawer menu pour navigation secondaire

## Conventions
- Composants fonctionnels uniquement
- Hooks pour logique réutilisable
- NativeWind pour tous les styles
- Animations avec react-native-reanimated

## Checklist
- [ ] TypeScript valide
- [ ] Composants fonctionnels
- [ ] Styles NativeWind
- [ ] Responsive (différentes tailles écran)
- [ ] Animations fluides
- [ ] Pas de `any`
AGENT2

echo "   ✅ mobile-developer.md"

# Code Reviewer
cat > .claude/agents/code-reviewer.md << 'AGENT3'
---
name: code-reviewer
description: Reviewer expert pour audit de code. Utiliser après développement pour review qualité, sécurité, performance.
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

Tu es un senior code reviewer avec expertise en sécurité et qualité logicielle.

## Mission
Auditer le code pour identifier les problèmes de qualité, sécurité et performance.

## Workflow
1. Lancer `git diff HEAD~5` pour voir les changements récents
2. Analyser chaque fichier modifié
3. Vérifier les points de la checklist
4. Produire un rapport structuré

## Checklist Sécurité
- [ ] Pas de secrets/credentials hardcodés
- [ ] Validation de toutes les entrées utilisateur
- [ ] Protection contre injection SQL
- [ ] Auth/authz correctement implémentés
- [ ] CORS configuré correctement
- [ ] Rate limiting en place

## Checklist Qualité
- [ ] TypeScript strict mode respecté
- [ ] Pas de `any`
- [ ] Pas de code dupliqué
- [ ] Fonctions < 50 lignes
- [ ] Nommage explicite et cohérent
- [ ] Gestion des erreurs appropriée
- [ ] Comments pour code complexe

## Checklist Performance
- [ ] Pas de N+1 queries
- [ ] Indexes DB appropriés
- [ ] Mémoization/caching si nécessaire
- [ ] Lazy loading où pertinent
- [ ] Pas de re-renders inutiles (React)

## Format du Rapport
```
## 📊 Code Review - [Date]

### Résumé
[Bref résumé des changements]

### 🔴 Issues Critiques
[Liste des problèmes bloquants]

### 🟡 Suggestions
[Améliorations recommandées]

### 🟢 Points Positifs
[Ce qui est bien fait]

### Verdict
[APPROVED / CHANGES_REQUESTED]
```
AGENT3

echo "   ✅ code-reviewer.md"

# Tester
cat > .claude/agents/tester.md << 'AGENT4'
---
name: tester
description: Expert en tests. Utiliser pour écrire tests unitaires, intégration, E2E.
tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

Tu es un expert QA et testing. Tu écris et maintiens les tests pour TRIBE.

## Stack Tests
- Jest pour tests unitaires
- Supertest pour tests API
- Playwright pour tests E2E
- Testing Library pour tests React

## Types de Tests

### Tests Unitaires
- Tester une fonction/méthode isolée
- Mocker les dépendances
- Coverage > 80%

### Tests Intégration
- Tester les interactions entre modules
- Base de données de test
- API endpoints complets

### Tests E2E
- Parcours utilisateur complet
- Browser automation
- Scénarios critiques

## Conventions
- Un fichier test par fichier source : `file.spec.ts`
- Describe/it pour structure
- Given/When/Then pour clarté
- Setup/Teardown appropriés

## Workflow
1. Identifier le code à tester
2. Lister les cas de test
3. Écrire les tests
4. Vérifier le coverage
5. Corriger si tests échouent
AGENT4

echo "   ✅ tester.md"
echo ""

# ============================================
# 5. Commandes personnalisées
# ============================================
echo -e "${BLUE}5️⃣  Création des Commandes personnalisées${NC}"

# Feature
cat > .claude/commands/feature.md << 'CMD1'
Implémente la feature "$ARGUMENTS" pour TRIBE v2.

## Workflow Automatique
1. Crée une branche `feature/$ARGUMENTS` depuis main
2. Analyse la demande et pose des questions si nécessaire
3. Planifie les changements (liste les fichiers à modifier/créer)
4. Implémente par petits commits atomiques
5. Lance les tests appropriés
6. Utilise le subagent code-reviewer pour audit
7. Résume les changements effectués

Commence maintenant.
CMD1

echo "   ✅ feature.md"

# Test
cat > .claude/commands/test.md << 'CMD2'
Lance les tests pour $ARGUMENTS.

## Comportement
- Si vide : lance tous les tests du projet
- "api" : `cd apps/api && npm test`
- "mobile" : `cd apps/mobile && npm test`
- "admin" : `cd apps/admin && npm test`
- "e2e" : tests end-to-end Playwright
- "coverage" : tests avec rapport de couverture

Affiche un résumé clair des résultats avec les éventuelles erreurs.
CMD2

echo "   ✅ test.md"

# Status
cat > .claude/commands/status.md << 'CMD3'
Affiche le status complet de l'environnement TRIBE v2.

## Vérifications
1. Services Docker : `docker compose ps`
2. Santé API : `curl -s localhost:4000/health || echo "API down"`
3. Santé Admin : `curl -s localhost:3001 || echo "Admin down"`
4. PostgreSQL : `docker exec tribe-postgres pg_isready`
5. Redis : `docker exec tribe-redis redis-cli ping`
6. Git status : `git status --short`
7. Derniers commits : `git log --oneline -5`

Formate en tableau clair.
CMD3

echo "   ✅ status.md"

# Deploy
cat > .claude/commands/deploy.md << 'CMD4'
Prépare le déploiement pour $ARGUMENTS (staging/production).

## Étapes
1. Vérifier que tous les tests passent
2. Vérifier qu'il n'y a pas de changements non commités
3. Créer un tag de release
4. Build les images Docker
5. Afficher les instructions de déploiement

⚠️ Ne pas déployer en production sans confirmation explicite.
CMD4

echo "   ✅ deploy.md"

# Fix
cat > .claude/commands/fix.md << 'CMD5'
Corrige le bug/issue "$ARGUMENTS".

## Workflow
1. Analyser le problème décrit
2. Rechercher dans le code (Grep) les fichiers concernés
3. Identifier la cause racine
4. Implémenter le fix minimal
5. Ajouter un test de régression
6. Commit avec message `fix: $ARGUMENTS`

Commence maintenant.
CMD5

echo "   ✅ fix.md"

# Refactor
cat > .claude/commands/refactor.md << 'CMD6'
Refactoriser $ARGUMENTS.

## Principes
- Pas de changement de comportement (même inputs → mêmes outputs)
- Améliorer la lisibilité et maintenabilité
- Réduire la duplication
- Respecter les conventions du projet

## Workflow
1. Comprendre le code actuel
2. Identifier les améliorations
3. Refactoriser par petits commits
4. Vérifier que les tests passent toujours
5. Review avec code-reviewer

Commence maintenant.
CMD6

echo "   ✅ refactor.md"
echo ""

# ============================================
# 6. Skill TRIBE
# ============================================
echo -e "${BLUE}6️⃣  Création du Skill TRIBE${NC}"

cat > .claude/skills/tribe-conventions/SKILL.md << 'SKILL'
---
name: tribe-conventions
description: Conventions et patterns spécifiques au projet TRIBE. Utilisé automatiquement lors du développement.
---

# TRIBE Conventions

## Couleurs
- Primary : #10B981 (vert)
- Secondary : #3B82F6 (bleu)
- Error : #EF4444 (rouge)
- Warning : #F59E0B (orange)
- Background : #F9FAFB (gris clair)
- Dark Background : #111827

## Catégories de POI
```typescript
enum LocationCategory {
  RESTAURANT = 'restaurant',
  HOTEL = 'hotel',
  PHARMACY = 'pharmacy',
  HOSPITAL = 'hospital',
  BANK = 'bank',
  SCHOOL = 'school',
  MOSQUE = 'mosque',
  CHURCH = 'church',
  SHOP = 'shop',
  GAS_STATION = 'gas_station',
  MARKET = 'market',
  TRANSPORT = 'transport',
  GOVERNMENT = 'government',
  OTHER = 'other'
}
```

## Status de POI
```typescript
enum LocationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected'
}
```

## Système de Points
- Base par POI validé : 10 points
- Bonus par photo : +2 points
- Bonus description > 50 chars : +5 points
- Bonus adresse complète : +3 points
- Maximum par POI : 50 points

## Niveaux
| Niveau | Nom | Points Min | Points Max |
|--------|-----|------------|------------|
| 1 | Débutant | 0 | 99 |
| 2 | Explorateur | 100 | 499 |
| 3 | Cartographe | 500 | 1499 |
| 4 | Expert | 1500 | 3999 |
| 5 | Maître | 4000 | 9999 |
| 6 | Ambassadeur | 10000 | ∞ |

## API Endpoints Pattern
```
GET    /api/v1/{resource}          # Liste
GET    /api/v1/{resource}/:id      # Détail
POST   /api/v1/{resource}          # Création
PUT    /api/v1/{resource}/:id      # Mise à jour complète
PATCH  /api/v1/{resource}/:id      # Mise à jour partielle
DELETE /api/v1/{resource}/:id      # Suppression
```

## Réponse API Standard
```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```
SKILL

echo "   ✅ tribe-conventions/SKILL.md"
echo ""

# ============================================
# 7. Fichier .gitignore pour .claude
# ============================================
echo -e "${BLUE}7️⃣  Mise à jour .gitignore${NC}"

if [ -f .gitignore ]; then
    if ! grep -q ".claude/settings.local.json" .gitignore; then
        echo "" >> .gitignore
        echo "# Claude Code local settings" >> .gitignore
        echo ".claude/settings.local.json" >> .gitignore
    fi
else
    cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/
.expo/

# Environment
.env
.env.local
.env.production
*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Claude Code local settings
.claude/settings.local.json

# Test
coverage/

# Docker
*.pid
GITIGNORE
fi

echo "   ✅ .gitignore mis à jour"
echo ""

# ============================================
# 8. Résumé final
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Configuration Claude Code Autonome terminée !${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Fichiers créés :"
echo "  📄 CLAUDE.md"
echo "  📁 .claude/"
echo "     ├── settings.json"
echo "     ├── agents/"
echo "     │   ├── api-developer.md"
echo "     │   ├── mobile-developer.md"
echo "     │   ├── code-reviewer.md"
echo "     │   └── tester.md"
echo "     ├── commands/"
echo "     │   ├── feature.md"
echo "     │   ├── test.md"
echo "     │   ├── status.md"
echo "     │   ├── deploy.md"
echo "     │   ├── fix.md"
echo "     │   └── refactor.md"
echo "     └── skills/"
echo "         └── tribe-conventions/"
echo "             └── SKILL.md"
echo ""
echo -e "${BLUE}🚀 Pour démarrer Claude Code :${NC}"
echo ""
echo "   cd $TRIBE_DIR"
echo "   claude"
echo ""
echo -e "${YELLOW}💡 Commandes utiles :${NC}"
echo "   /feature [nom]     - Développer une feature"
echo "   /test [scope]      - Lancer les tests"
echo "   /status            - Status de l'environnement"
echo "   /fix [description] - Corriger un bug"
echo ""
echo -e "${YELLOW}💡 Subagents disponibles :${NC}"
echo "   \"Use api-developer to...\"     - Dev API NestJS"
echo "   \"Use mobile-developer to...\"  - Dev Mobile React Native"
echo "   \"Use code-reviewer to...\"     - Review de code"
echo "   \"Use tester to...\"            - Écrire des tests"
echo ""
