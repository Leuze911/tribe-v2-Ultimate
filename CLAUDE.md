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
