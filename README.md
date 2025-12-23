# 🚀 TRIBE v2 ULTIMATE

**Infrastructure complète de collecte de Points d'Intérêt au Sénégal**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red?logo=nestjs)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org)

---

## ✨ Fonctionnalités

| Composant | Technologie | Description |
|-----------|-------------|-------------|
| 🚀 **API Gateway** | Traefik | Load balancing, rate limiting, SSL |
| 🔌 **Backend** | NestJS | API REST avec Swagger |
| 🖥️ **Admin** | Next.js 14 | Dashboard de gestion |
| 🌐 **Landing** | Next.js 14 | Site vitrine |
| 📱 **Mobile** | Flutter | App iOS/Android |
| 🗄️ **Database** | PostgreSQL 15 | + PostGIS pour géolocalisation |
| 🔐 **Auth** | Supabase Auth | JWT, OAuth, Magic Links |
| 💾 **Storage** | MinIO (S3) | Stockage des photos |
| 🔴 **Cache** | Redis | Cache + Sessions + Pub/Sub |
| 🐰 **Queue** | RabbitMQ | Message broker asynchrone |
| 📊 **Monitoring** | Prometheus + Grafana | Métriques et alertes |
| 📝 **Logs** | Loki + Promtail | Logs centralisés |
| ⚡ **Realtime** | Supabase Realtime | WebSocket |

---

## 🏁 Installation (1 commande)

```bash
# Cloner et installer
git clone https://github.com/tribe-sn/tribe-v2-ultimate.git
cd tribe-v2-ultimate
make install
```

C'est tout ! L'installation est **100% automatique**.

---

## 📍 URLs des Services

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 Landing | http://localhost | Site public |
| 🖥️ Admin | http://admin.localhost | Backoffice |
| 🔌 API | http://api.localhost/api | REST API |
| 📚 Swagger | http://api.localhost/api/docs | Documentation API |
| ⚡ Traefik | http://traefik.localhost | Dashboard Gateway |
| 📊 Grafana | http://grafana.localhost | Monitoring |
| 📈 Prometheus | http://prometheus.localhost | Métriques |
| 🐰 RabbitMQ | http://rabbitmq.localhost | Message Queue |
| 💾 MinIO | http://localhost:9001 | Stockage S3 |

---

## 📋 Commandes Principales

```bash
make install      # Installation complète
make dev          # Mode développement
make prod         # Mode production
make status       # État des services
make logs         # Voir les logs
make stop         # Arrêter tout
make clean        # Nettoyer
make help         # Voir toutes les commandes
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│         Mobile (Flutter)  •  Admin (Next.js)  •  Web (Next.js)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         🚀 TRAEFIK (API Gateway)                        │
│         Rate Limiting  •  Load Balancing  •  SSL/TLS  •  Routing       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Supabase Auth │      │    API NestJS   │      │  Supabase       │
│   (JWT + OAuth) │      │  (Business API) │      │  Realtime       │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    ▼                             ▼                             ▼
┌─────────┐               ┌─────────────┐               ┌─────────────┐
│  Redis  │               │ PostgreSQL  │               │   RabbitMQ  │
│ (Cache) │               │    (Data)   │               │   (Events)  │
└─────────┘               └─────────────┘               └─────────────┘
                                  │
                                  ▼
                          ┌─────────────┐
                          │    MinIO    │
                          │  (Storage)  │
                          └─────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           📊 OBSERVABILITÉ                              │
│     Prometheus (Metrics)  •  Grafana (Dashboards)  •  Loki (Logs)      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du Projet

```
tribe-v2-ultimate/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── locations/
│   │   │   │   ├── rewards/
│   │   │   │   ├── chat/
│   │   │   │   └── notifications/
│   │   │   ├── common/      # Shared utilities
│   │   │   └── main.ts
│   │   └── Dockerfile
│   ├── admin/               # Next.js Admin Dashboard
│   ├── web/                 # Next.js Landing Page
│   └── mobile/              # Flutter App
├── packages/
│   ├── types/               # TypeScript types
│   ├── ui/                  # Shared React components
│   └── config/              # Shared configs
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── functions/           # Edge Functions
├── infra/
│   ├── traefik/             # API Gateway config
│   ├── prometheus/          # Metrics config
│   ├── grafana/             # Dashboards
│   ├── loki/                # Logs config
│   ├── redis/               # Cache config
│   └── rabbitmq/            # Queue config
├── docker-compose.yml       # Infrastructure
├── Makefile                 # Commandes
└── install.sh               # Installation auto
```

---

## 🔧 Configuration

### Variables d'Environnement

Le fichier `.env` est généré automatiquement avec des secrets sécurisés.

Pour personnaliser :

```bash
# Éditer .env
nano .env

# Redémarrer
make restart
```

### Secrets Importants

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_SECRET` | Secret pour les tokens JWT |
| `ANTHROPIC_API_KEY` | Clé API Claude (pour le chat IA) |
| `RABBITMQ_PASS` | Mot de passe RabbitMQ |
| `GRAFANA_PASSWORD` | Mot de passe Grafana |

---

## 📊 Monitoring

### Grafana

Accès : http://grafana.localhost

Dashboards pré-configurés :
- **TRIBE Overview** : Vue d'ensemble
- **API Performance** : Latence, erreurs, throughput
- **Infrastructure** : CPU, RAM, disque
- **Business Metrics** : POI, utilisateurs, récompenses

### Alertes

Alertes configurées dans Prometheus :
- 🔴 Service down
- 🔴 Haute latence (> 1s)
- 🔴 Taux d'erreur élevé (> 5%)
- 🟡 CPU > 80%
- 🟡 Mémoire > 85%
- 🟡 Disque > 85%

---

## 🐰 Events (RabbitMQ)

### Exchanges

| Exchange | Type | Description |
|----------|------|-------------|
| `tribe.events` | topic | Événements métier |
| `tribe.commands` | direct | Commandes synchrones |
| `dlx.locations` | direct | Dead letter queue |

### Événements Principaux

```
location.created     → Nouveau POI soumis
location.validated   → POI validé
location.rejected    → POI rejeté
user.registered      → Nouvel utilisateur
reward.claimed       → Récompense réclamée
notification.send    → Envoyer une notification
```

---

## 🧪 Tests

```bash
# Tests unitaires
make test

# Tests E2E
make test-e2e

# Couverture
cd apps/api && pnpm test:cov
```

---

## 🚀 Déploiement Production

### Prérequis
- Serveur avec Docker
- Domaine configuré (DNS)
- Certificats SSL (Let's Encrypt via Traefik)

### Étapes

```bash
# 1. Configurer le domaine dans .env
SITE_URL=https://tribe.sn
API_EXTERNAL_URL=https://api.tribe.sn

# 2. Déployer
make deploy-prod
```

---

## 💰 Coûts Estimés

| Service | Dev (local) | Production |
|---------|-------------|------------|
| Infrastructure | $0 | $50-100/mois |
| Domaine | - | $15/an |
| SSL | - | Gratuit (Let's Encrypt) |
| Claude API | ~$10/mois | ~$30-50/mois |
| **Total** | **$10/mois** | **$65-165/mois** |

---

## 🆘 Support

**Questions ?** Ouvre une issue ou contacte-nous.

**Bugs ?** Utilise le template de bug report.

**Features ?** Propose une feature request.

---

## 📄 Licence

Propriétaire - TRIBE Senegal © 2025

---

*Développé avec ❤️ au Sénégal*
