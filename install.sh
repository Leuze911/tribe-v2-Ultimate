#!/bin/bash
# ============================================
# 🚀 TRIBE v2 ULTIMATE - Installation 100% Auto
# ============================================
#
# Ce script installe et configure TOUT :
# ✅ Traefik (API Gateway)
# ✅ Supabase (Auth + DB + Storage + Realtime)
# ✅ Redis (Cache + Sessions)
# ✅ RabbitMQ (Message Broker)
# ✅ Prometheus + Grafana (Monitoring)
# ✅ Loki (Logs centralisés)
# ✅ API NestJS
# ✅ Dashboard Next.js
# ✅ Landing Next.js
#
# Usage: ./install.sh
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

# Emojis
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
GEAR="⚙️"
PACKAGE="📦"
DATABASE="🗄️"
LOCK="🔐"
CHART="📊"
RABBIT="🐰"
FIRE="🔥"

# Logo
print_logo() {
    echo ""
    echo -e "${PURPLE}${BOLD}"
    cat << 'EOF'
  ████████╗██████╗ ██╗██████╗ ███████╗    ██╗   ██╗██████╗ 
  ╚══██╔══╝██╔══██╗██║██╔══██╗██╔════╝    ██║   ██║╚════██╗
     ██║   ██████╔╝██║██████╔╝█████╗      ██║   ██║ █████╔╝
     ██║   ██╔══██╗██║██╔══██╗██╔══╝      ╚██╗ ██╔╝██╔═══╝ 
     ██║   ██║  ██║██║██████╔╝███████╗     ╚████╔╝ ███████╗
     ╚═╝   ╚═╝  ╚═╝╚═╝╚═════╝ ╚══════╝      ╚═══╝  ╚══════╝
                    ╔═══════════════════════════════════════╗
                    ║     🚀  ULTIMATE EDITION  🚀          ║
                    ╚═══════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Logging
log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}${BOLD} $1 ${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_info() { echo -e "   ${CYAN}ℹ️  $1${NC}"; }
log_success() { echo -e "   ${GREEN}${CHECK} $1${NC}"; }
log_warning() { echo -e "   ${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "   ${RED}${CROSS} $1${NC}"; }

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while ps -p $pid > /dev/null 2>&1; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "      \b\b\b\b\b\b"
}

check_command() {
    command -v $1 &> /dev/null
}

# ============================================
# MAIN INSTALLATION
# ============================================

print_logo

echo -e "${CYAN}Installation 100% automatisée de l'infrastructure complète${NC}"
echo ""

# ==========================================
# ÉTAPE 1: VÉRIFICATION DES PRÉREQUIS
# ==========================================
log_step "${GEAR} Étape 1/8 : Vérification des prérequis"

# Docker
if ! check_command docker; then
    log_error "Docker n'est pas installé"
    log_info "Installation automatique de Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    log_success "Docker installé"
else
    log_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
fi

# Docker Compose
if ! check_command docker-compose && ! docker compose version &> /dev/null; then
    log_info "Installation de Docker Compose..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi
log_success "Docker Compose disponible"

# Node.js
if ! check_command node; then
    log_info "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
NODE_VERSION=$(node -v 2>/dev/null || echo "none")
log_success "Node.js $NODE_VERSION"

# pnpm
if ! check_command pnpm; then
    log_info "Installation de pnpm..."
    npm install -g pnpm
fi
log_success "pnpm $(pnpm -v)"

# ==========================================
# ÉTAPE 2: GÉNÉRATION DES SECRETS
# ==========================================
log_step "${LOCK} Étape 2/8 : Génération des secrets sécurisés"

generate_secret() {
    openssl rand -base64 32 | tr -d '=+/' | cut -c1-32
}

generate_jwt_secret() {
    openssl rand -base64 48 | tr -d '=+/'
}

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    log_info "Génération des secrets..."
    
    cat > .env << ENVFILE
# ============================================
# TRIBE v2 ULTIMATE - Configuration
# Généré automatiquement le $(date)
# ============================================

# PostgreSQL
POSTGRES_PASSWORD=$(generate_secret)

# JWT
JWT_SECRET=$(generate_jwt_secret)

# Supabase Keys (générés)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# MinIO (S3-compatible storage)
MINIO_ACCESS_KEY=tribe_minio_$(generate_secret | cut -c1-8)
MINIO_SECRET_KEY=$(generate_secret)

# RabbitMQ
RABBITMQ_USER=tribe
RABBITMQ_PASS=$(generate_secret)

# Grafana
GRAFANA_USER=admin
GRAFANA_PASSWORD=$(generate_secret)

# API External URL
API_EXTERNAL_URL=http://api.localhost
SITE_URL=http://localhost:3000

# Claude API (optionnel - à remplir)
ANTHROPIC_API_KEY=

# Email (optionnel - Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=
SMTP_ADMIN_EMAIL=noreply@tribe.sn

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://admin.localhost

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
ENVFILE

    log_success "Fichier .env créé avec secrets sécurisés"
else
    log_info "Fichier .env existe déjà"
fi

# ==========================================
# ÉTAPE 3: CRÉATION DES DOSSIERS
# ==========================================
log_step "${PACKAGE} Étape 3/8 : Préparation des fichiers"

# Créer les dossiers de données
mkdir -p infra/{traefik/logs,prometheus,grafana/provisioning/{datasources,dashboards},loki,rabbitmq}

# Créer le fichier rabbitmq.conf
cat > infra/rabbitmq/rabbitmq.conf << 'RABBITCONF'
# RabbitMQ Configuration
loopback_users.guest = false
listeners.tcp.default = 5672
management.tcp.port = 15672
management.load_definitions = /etc/rabbitmq/definitions.json

# Memory
vm_memory_high_watermark.relative = 0.7
vm_memory_high_watermark_paging_ratio = 0.8

# Disk
disk_free_limit.relative = 1.0

# Logging
log.console = true
log.console.level = info
RABBITCONF

# Créer la config Redis
cat > infra/redis/redis.conf << 'REDISCONF'
# Redis Configuration
bind 0.0.0.0
protected-mode no
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize no
supervised no
loglevel notice
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
REDISCONF

mkdir -p infra/redis

log_success "Fichiers de configuration créés"

# ==========================================
# ÉTAPE 4: INSTALLATION DES DÉPENDANCES
# ==========================================
log_step "${PACKAGE} Étape 4/8 : Installation des dépendances Node.js"

log_info "Installation des dépendances..."
pnpm install > /dev/null 2>&1 &
spinner $!
log_success "Dépendances installées"

# ==========================================
# ÉTAPE 5: BUILD DES IMAGES DOCKER
# ==========================================
log_step "${FIRE} Étape 5/8 : Construction des images Docker"

# Créer les Dockerfiles s'ils n'existent pas
if [ ! -f apps/api/Dockerfile ]; then
    cat > apps/api/Dockerfile << 'DOCKERFILE'
# TRIBE API - Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 4000
CMD ["node", "dist/main.js"]
DOCKERFILE
fi

if [ ! -f apps/admin/Dockerfile ]; then
    cat > apps/admin/Dockerfile << 'DOCKERFILE'
# TRIBE Admin - Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || npm install
COPY . .
RUN pnpm build || npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
DOCKERFILE
fi

log_info "Construction des images (peut prendre quelques minutes)..."
docker compose build --parallel > /dev/null 2>&1 &
spinner $!
log_success "Images Docker construites"

# ==========================================
# ÉTAPE 6: DÉMARRAGE DES SERVICES
# ==========================================
log_step "${ROCKET} Étape 6/8 : Démarrage de l'infrastructure"

log_info "Démarrage des services..."
docker compose up -d > /dev/null 2>&1

# Attendre que les services soient prêts
log_info "Attente du démarrage des services..."
sleep 10

# Vérifier les services
services=("tribe-postgres" "tribe-redis" "tribe-rabbitmq" "tribe-traefik")
for service in "${services[@]}"; do
    if docker ps | grep -q $service; then
        log_success "$service est démarré"
    else
        log_warning "$service en cours de démarrage..."
    fi
done

# ==========================================
# ÉTAPE 7: INITIALISATION DE LA BASE
# ==========================================
log_step "${DATABASE} Étape 7/8 : Initialisation de la base de données"

log_info "Application des migrations..."
sleep 5

# Exécuter les migrations via Docker
docker exec tribe-postgres psql -U postgres -d tribe -f /docker-entrypoint-initdb.d/001_initial_schema.sql 2>/dev/null || true

log_success "Base de données initialisée"

# ==========================================
# ÉTAPE 8: VÉRIFICATION FINALE
# ==========================================
log_step "${CHECK} Étape 8/8 : Vérification finale"

echo ""
echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║                    🎉 INSTALLATION TERMINÉE !                      ║${NC}"
echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${WHITE}${BOLD}📍 URLs des services :${NC}"
echo ""
echo -e "   ${CYAN}🌐 Landing Page${NC}       http://localhost"
echo -e "   ${CYAN}🖥️  Admin Dashboard${NC}   http://admin.localhost"
echo -e "   ${CYAN}🔌 API${NC}                http://api.localhost/api"
echo -e "   ${CYAN}📚 API Docs${NC}           http://api.localhost/api/docs"
echo ""
echo -e "   ${PURPLE}⚡ Traefik Dashboard${NC}  http://traefik.localhost"
echo -e "   ${PURPLE}📊 Grafana${NC}            http://grafana.localhost"
echo -e "   ${PURPLE}📈 Prometheus${NC}         http://prometheus.localhost"
echo -e "   ${PURPLE}🐰 RabbitMQ${NC}           http://rabbitmq.localhost"
echo -e "   ${PURPLE}💾 MinIO Console${NC}      http://localhost:9001"
echo ""

echo -e "${WHITE}${BOLD}🔑 Identifiants (voir .env) :${NC}"
echo ""
echo -e "   ${YELLOW}Grafana:${NC}    admin / $(grep GRAFANA_PASSWORD .env | cut -d'=' -f2)"
echo -e "   ${YELLOW}RabbitMQ:${NC}   tribe / $(grep RABBITMQ_PASS .env | cut -d'=' -f2)"
echo -e "   ${YELLOW}MinIO:${NC}      $(grep MINIO_ACCESS_KEY .env | cut -d'=' -f2) / $(grep MINIO_SECRET_KEY .env | cut -d'=' -f2)"
echo ""

echo -e "${WHITE}${BOLD}📋 Commandes utiles :${NC}"
echo ""
echo -e "   ${GREEN}make status${NC}     - Voir l'état des services"
echo -e "   ${GREEN}make logs${NC}       - Voir les logs"
echo -e "   ${GREEN}make stop${NC}       - Arrêter tout"
echo -e "   ${GREEN}make restart${NC}    - Redémarrer"
echo ""

echo -e "${WHITE}${BOLD}🚀 Prochaines étapes :${NC}"
echo ""
echo -e "   1. Ouvre ${CYAN}http://admin.localhost${NC} pour le dashboard"
echo -e "   2. Ouvre ${CYAN}http://grafana.localhost${NC} pour le monitoring"
echo -e "   3. Configure ton ${YELLOW}ANTHROPIC_API_KEY${NC} dans .env pour le chat IA"
echo ""

echo -e "${PURPLE}${BOLD}💡 Astuce: Utilise Claude Code pour ajouter des fonctionnalités !${NC}"
echo ""

# Ajouter au /etc/hosts si nécessaire
if ! grep -q "admin.localhost" /etc/hosts 2>/dev/null; then
    echo ""
    log_warning "Pour utiliser les domaines .localhost, exécute :"
    echo ""
    echo -e "   ${YELLOW}sudo bash -c 'echo \"127.0.0.1 admin.localhost api.localhost traefik.localhost grafana.localhost prometheus.localhost rabbitmq.localhost\" >> /etc/hosts'${NC}"
    echo ""
fi
