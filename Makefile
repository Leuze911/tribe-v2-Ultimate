# ============================================
# TRIBE v2 ULTIMATE - Makefile
# ============================================
# 
# Commandes principales:
#   make install   - Installation complète
#   make dev       - Mode développement
#   make prod      - Mode production
#   make status    - État des services
#
# ============================================

.PHONY: install dev prod build start stop restart status logs clean help
.DEFAULT_GOAL := help

# Couleurs
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m
BOLD := \033[1m

# ============================================
# INSTALLATION
# ============================================

install: ## 🚀 Installation complète (infrastructure + apps)
	@chmod +x install.sh
	@./install.sh

quick-start: ## ⚡ Démarrage rapide (Docker uniquement)
	@echo "$(CYAN)Démarrage rapide...$(NC)"
	@docker compose up -d
	@echo "$(GREEN)✅ Services démarrés$(NC)"

# ============================================
# DÉVELOPPEMENT
# ============================================

dev: ## 🔧 Mode développement (hot reload)
	@echo "$(CYAN)Démarrage en mode développement...$(NC)"
	@docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@pnpm dev

dev-api: ## 🔧 Développement API uniquement
	@cd apps/api && pnpm dev

dev-admin: ## 🔧 Développement Admin uniquement
	@cd apps/admin && pnpm dev

dev-web: ## 🔧 Développement Web uniquement
	@cd apps/web && pnpm dev

# ============================================
# PRODUCTION
# ============================================

prod: build ## 🏭 Déploiement production
	@echo "$(CYAN)Déploiement en production...$(NC)"
	@docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Production déployée$(NC)"

build: ## 🏗️ Build toutes les images
	@echo "$(CYAN)Construction des images...$(NC)"
	@docker compose build --parallel
	@echo "$(GREEN)✅ Images construites$(NC)"

build-api: ## 🏗️ Build API uniquement
	@docker compose build api

build-admin: ## 🏗️ Build Admin uniquement
	@docker compose build admin

# ============================================
# GESTION DES SERVICES
# ============================================

start: ## ▶️ Démarrer tous les services
	@docker compose up -d
	@echo "$(GREEN)✅ Services démarrés$(NC)"

stop: ## ⏹️ Arrêter tous les services
	@docker compose down
	@echo "$(YELLOW)Services arrêtés$(NC)"

restart: stop start ## 🔄 Redémarrer tous les services

status: ## 📊 État des services
	@echo ""
	@echo "$(CYAN)$(BOLD)═══════════════════════════════════════════════════════════$(NC)"
	@echo "$(CYAN)$(BOLD)                    ÉTAT DES SERVICES                       $(NC)"
	@echo "$(CYAN)$(BOLD)═══════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""

health: ## 💓 Vérifier la santé des services
	@echo "$(CYAN)Vérification de la santé...$(NC)"
	@curl -s http://localhost/api/health | jq . 2>/dev/null || echo "API: en attente..."
	@curl -s http://localhost:9090/-/healthy && echo "Prometheus: OK" || echo "Prometheus: en attente..."
	@curl -s http://localhost:3030/api/health && echo "Grafana: OK" || echo "Grafana: en attente..."

# ============================================
# LOGS
# ============================================

logs: ## 📜 Voir tous les logs
	@docker compose logs -f --tail=100

logs-api: ## 📜 Logs API
	@docker compose logs -f api --tail=100

logs-admin: ## 📜 Logs Admin
	@docker compose logs -f admin --tail=100

logs-traefik: ## 📜 Logs Traefik
	@docker compose logs -f traefik --tail=100

logs-db: ## 📜 Logs PostgreSQL
	@docker compose logs -f postgres --tail=100

# ============================================
# BASE DE DONNÉES
# ============================================

db-shell: ## 🗄️ Shell PostgreSQL
	@docker exec -it tribe-postgres psql -U postgres -d tribe

db-migrate: ## 📤 Appliquer les migrations
	@docker exec tribe-postgres psql -U postgres -d tribe -f /docker-entrypoint-initdb.d/001_initial_schema.sql

db-backup: ## 💾 Backup de la base
	@mkdir -p backups
	@docker exec tribe-postgres pg_dump -U postgres tribe > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup créé dans backups/$(NC)"

db-restore: ## 📥 Restaurer un backup (BACKUP=fichier.sql)
	@docker exec -i tribe-postgres psql -U postgres tribe < $(BACKUP)

# ============================================
# CACHE & QUEUES
# ============================================

redis-cli: ## 🔴 Shell Redis
	@docker exec -it tribe-redis redis-cli

redis-flush: ## 🧹 Vider le cache Redis
	@docker exec tribe-redis redis-cli FLUSHALL
	@echo "$(YELLOW)Cache Redis vidé$(NC)"

rabbitmq-status: ## 🐰 État RabbitMQ
	@docker exec tribe-rabbitmq rabbitmqctl status

# ============================================
# MONITORING
# ============================================

grafana-open: ## 📊 Ouvrir Grafana
	@xdg-open http://grafana.localhost 2>/dev/null || open http://grafana.localhost 2>/dev/null || echo "Ouvre http://grafana.localhost"

prometheus-open: ## 📈 Ouvrir Prometheus
	@xdg-open http://prometheus.localhost 2>/dev/null || open http://prometheus.localhost 2>/dev/null || echo "Ouvre http://prometheus.localhost"

traefik-open: ## ⚡ Ouvrir Traefik Dashboard
	@xdg-open http://traefik.localhost 2>/dev/null || open http://traefik.localhost 2>/dev/null || echo "Ouvre http://traefik.localhost"

# ============================================
# NETTOYAGE
# ============================================

clean: ## 🧹 Nettoyer les fichiers temporaires
	@echo "$(YELLOW)Nettoyage...$(NC)"
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@rm -rf apps/*/.next apps/*/dist apps/api/dist
	@docker system prune -f
	@echo "$(GREEN)✅ Nettoyé$(NC)"

clean-all: clean ## 🧹 Nettoyage complet (+ volumes Docker)
	@docker compose down -v
	@docker volume prune -f
	@echo "$(RED)⚠️ Volumes Docker supprimés$(NC)"

# ============================================
# TESTS
# ============================================

test: ## 🧪 Lancer tous les tests
	@pnpm test

test-api: ## 🧪 Tests API
	@cd apps/api && pnpm test

test-e2e: ## 🧪 Tests end-to-end
	@cd apps/api && pnpm test:e2e

# ============================================
# DÉPLOIEMENT
# ============================================

deploy-staging: ## 🚀 Déployer en staging
	@echo "$(CYAN)Déploiement staging...$(NC)"
	@docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build

deploy-prod: ## 🚀 Déployer en production
	@echo "$(RED)⚠️ Déploiement PRODUCTION$(NC)"
	@read -p "Confirmer ? (oui/non) " confirm && [ "$$confirm" = "oui" ] && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# ============================================
# AIDE
# ============================================

help: ## 📖 Afficher cette aide
	@echo ""
	@echo "$(CYAN)$(BOLD)╔════════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)$(BOLD)║                  🚀 TRIBE v2 ULTIMATE - Commandes                  ║$(NC)"
	@echo "$(CYAN)$(BOLD)╚════════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Exemple: make install$(NC)"
	@echo ""
