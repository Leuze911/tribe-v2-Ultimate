# TRIBE v2 - Guide de Migration des Donnees

## Vue d'ensemble

Ce guide explique comment migrer les donnees de la version initiale de TRIBE vers TRIBE v2.

---

## Architecture TRIBE v1 (Source)

Basé sur l'audit de sécurité (`Audit_Complet_TRIBE_Securite.docx`), l'ancienne architecture TRIBE comprend:

| Service | Stack | Base de données | Données |
|---------|-------|-----------------|---------|
| tribe-user-service | Spring Boot 3.2 / Java 17 | Firebase Auth | Authentification |
| tribe-location-service | Spring Boot / MongoDB | **MongoDB Atlas** | POIs/Locations |
| tribe-admin-service | Spring Boot / MySQL | **MySQL Azure** | Utilisateurs admin |
| tribe-backoffice-service | Spring Boot / MySQL | **MySQL Azure** | Backoffice |
| tribe-chat-service | Django / Python | SQLite | Historique chat |
| TRIBE_New | Flutter / Dart | Local | App mobile |

### Credentials (COMPROMIS - À régénérer après migration)

| Service | Type | Valeur |
|---------|------|--------|
| MongoDB Atlas | Password | `SYQogeSN4aJCqY5n` |
| MySQL Azure | Password | `tribe2023!!` |

**IMPORTANT**: Ces credentials sont exposés dans le code source et doivent être considérés comme compromis. Régénérez-les immédiatement après la migration!

---

## Migration Automatisée TRIBE v1 -> v2

### Installation des scripts de migration

```bash
cd scripts/migration
npm install
cp .env.migration.example .env.migration
# Éditez .env.migration avec vos credentials
```

### Exécution de la migration complète

```bash
# Migration complète (MySQL puis MongoDB)
npm run migrate

# Ou séparément:
npm run migrate:mysql    # Users/Profiles depuis MySQL
npm run migrate:mongodb  # Locations/POIs depuis MongoDB

# Vérification
npm run verify

# Recalcul des points et niveaux
npm run recalculate
```

### Ordre de migration recommandé

1. **MySQL (Users)** → PostgreSQL (profiles)
   - Les utilisateurs doivent être migrés en premier pour avoir les IDs
   - Les mots de passe en clair seront hashés avec bcrypt

2. **MongoDB (Locations)** → PostgreSQL (locations)
   - Les locations sont liées aux users par collector_id
   - Les IDs MongoDB sont mappés vers les nouveaux UUIDs PostgreSQL

---

## Structure de la Base v2

### Table `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'collector',  -- collector, validator, admin
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `locations`
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  collector_id UUID REFERENCES profiles(id),
  name VARCHAR(255) NOT NULL,
  category location_category NOT NULL,  -- restaurant, shop, service, health, education, transport, tourism, culture, sport, other
  description TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  address TEXT,
  city VARCHAR(100) DEFAULT 'Dakar',
  photos TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  status location_status DEFAULT 'pending',  -- pending, validated, rejected
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Scenarios de Migration

### Scenario 1: Migration depuis Supabase Cloud

Si vos donnees sont dans un projet Supabase heberge:

#### Etape 1: Exporter les donnees de Supabase

```bash
# Via Supabase CLI
supabase db dump -f supabase_backup.sql --project-ref YOUR_PROJECT_REF

# Ou via pg_dump direct
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  --data-only \
  --table=public.profiles \
  --table=public.locations \
  > supabase_data.sql
```

#### Etape 2: Adapter le schema (si different)

```sql
-- Script de mapping si les colonnes sont differentes
-- Exemple: renommer des colonnes
ALTER TABLE profiles_old RENAME COLUMN user_name TO full_name;
```

#### Etape 3: Importer dans TRIBE v2

```bash
# Importer dans la base TRIBE v2
PGPASSWORD=tribe_super_secret_2024 psql \
  -h localhost -p 5433 -U postgres -d tribe \
  -f supabase_data.sql
```

---

### Scenario 2: Migration depuis PostgreSQL Local (port 5432)

#### Etape 1: Exporter les donnees

```bash
# Exporter les tables
pg_dump -h localhost -p 5432 -U postgres -d tribe_old \
  --data-only \
  --table=profiles \
  --table=locations \
  > old_data.sql
```

#### Etape 2: Importer dans v2

```bash
PGPASSWORD=tribe_super_secret_2024 psql \
  -h localhost -p 5433 -U postgres -d tribe \
  -f old_data.sql
```

---

### Scenario 3: Migration depuis CSV/JSON

#### Structure CSV attendue pour `profiles.csv`:

```csv
id,email,password_hash,full_name,phone,avatar_url,role,points,level,is_active,created_at
uuid-1,user@example.com,$2b$10$hash...,Jean Dupont,+221771234567,,collector,150,2,true,2024-01-15T10:30:00Z
```

#### Structure CSV attendue pour `locations.csv`:

```csv
id,collector_id,name,category,description,latitude,longitude,address,city,status,created_at
uuid-1,user-uuid,Restaurant Chez Ali,restaurant,Bon restaurant,14.6937,-17.4441,Rue 10,Dakar,validated,2024-01-20T14:00:00Z
```

#### Script d'import CSV:

```bash
# Import profiles
PGPASSWORD=tribe_super_secret_2024 psql -h localhost -p 5433 -U postgres -d tribe -c "
COPY profiles(id, email, password_hash, full_name, phone, avatar_url, role, points, level, is_active, created_at)
FROM '/path/to/profiles.csv'
WITH (FORMAT csv, HEADER true);
"

# Import locations
PGPASSWORD=tribe_super_secret_2024 psql -h localhost -p 5433 -U postgres -d tribe -c "
COPY locations(id, collector_id, name, category, description, latitude, longitude, address, city, status, created_at)
FROM '/path/to/locations.csv'
WITH (FORMAT csv, HEADER true);
"
```

---

### Scenario 4: Migration depuis MongoDB

Si vos donnees sont dans MongoDB:

#### Etape 1: Exporter en JSON

```bash
mongoexport --db tribe --collection users --out users.json
mongoexport --db tribe --collection pois --out pois.json
```

#### Etape 2: Transformer avec un script Node.js

```javascript
// scripts/migrate-mongo.js
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Lire les fichiers MongoDB
const users = JSON.parse(fs.readFileSync('users.json', 'utf8').split('\n').filter(l => l).map(JSON.parse));
const pois = JSON.parse(fs.readFileSync('pois.json', 'utf8').split('\n').filter(l => l).map(JSON.parse));

// Mapper les IDs MongoDB vers UUID
const idMapping = {};

// Transformer users -> profiles
const profiles = users.map(user => {
  const newId = uuidv4();
  idMapping[user._id.$oid || user._id] = newId;

  return {
    id: newId,
    email: user.email,
    password_hash: user.password || bcrypt.hashSync('changeme123', 10),
    full_name: user.name || user.fullName,
    phone: user.phone,
    role: user.role || 'collector',
    points: user.points || 0,
    level: user.level || 1,
    is_active: true,
    created_at: user.createdAt?.$date || new Date().toISOString()
  };
});

// Transformer pois -> locations
const locations = pois.map(poi => ({
  id: uuidv4(),
  collector_id: idMapping[poi.userId?.$oid || poi.userId] || null,
  name: poi.name,
  category: mapCategory(poi.category),
  description: poi.description,
  latitude: poi.location?.coordinates?.[1] || poi.lat,
  longitude: poi.location?.coordinates?.[0] || poi.lng,
  address: poi.address,
  city: poi.city || 'Dakar',
  photos: poi.photos || [],
  status: poi.validated ? 'validated' : 'pending',
  created_at: poi.createdAt?.$date || new Date().toISOString()
}));

function mapCategory(cat) {
  const mapping = {
    'food': 'restaurant',
    'store': 'shop',
    'hospital': 'health',
    'school': 'education'
  };
  return mapping[cat] || cat || 'other';
}

// Ecrire les fichiers SQL
fs.writeFileSync('profiles_insert.sql', generateInsertSQL('profiles', profiles));
fs.writeFileSync('locations_insert.sql', generateInsertSQL('locations', locations));
```

---

## Script de Migration Automatique

Voici un script complet pour automatiser la migration:

```bash
#!/bin/bash
# scripts/migrate.sh

set -e

# Configuration
SOURCE_DB_HOST="${SOURCE_DB_HOST:-localhost}"
SOURCE_DB_PORT="${SOURCE_DB_PORT:-5432}"
SOURCE_DB_USER="${SOURCE_DB_USER:-postgres}"
SOURCE_DB_NAME="${SOURCE_DB_NAME:-tribe_old}"
SOURCE_DB_PASSWORD="${SOURCE_DB_PASSWORD:-}"

TARGET_DB_HOST="localhost"
TARGET_DB_PORT="5433"
TARGET_DB_USER="postgres"
TARGET_DB_NAME="tribe"
TARGET_DB_PASSWORD="tribe_super_secret_2024"

BACKUP_DIR="./migration_backup_$(date +%Y%m%d_%H%M%S)"

echo "=== TRIBE v2 Migration Tool ==="
echo ""

# 1. Creer le dossier de backup
mkdir -p "$BACKUP_DIR"
echo "[1/5] Dossier de backup cree: $BACKUP_DIR"

# 2. Backup de la base cible (v2) avant migration
echo "[2/5] Backup de la base v2 existante..."
PGPASSWORD="$TARGET_DB_PASSWORD" pg_dump \
  -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" \
  > "$BACKUP_DIR/tribe_v2_backup.sql" 2>/dev/null || echo "  (Base v2 vide ou nouvelle)"

# 3. Exporter les donnees source
echo "[3/5] Export des donnees source..."
if [ -n "$SOURCE_DB_PASSWORD" ]; then
  PGPASSWORD="$SOURCE_DB_PASSWORD" pg_dump \
    -h "$SOURCE_DB_HOST" -p "$SOURCE_DB_PORT" -U "$SOURCE_DB_USER" -d "$SOURCE_DB_NAME" \
    --data-only \
    --table=profiles \
    --table=locations \
    > "$BACKUP_DIR/source_data.sql"
else
  echo "  ATTENTION: SOURCE_DB_PASSWORD non defini"
  echo "  Veuillez exporter manuellement les donnees dans $BACKUP_DIR/source_data.sql"
  exit 1
fi

# 4. Nettoyer les donnees existantes (optionnel)
read -p "[4/5] Voulez-vous supprimer les donnees existantes dans v2? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
  echo "  Suppression des donnees existantes..."
  PGPASSWORD="$TARGET_DB_PASSWORD" psql \
    -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" \
    -c "TRUNCATE locations, profiles CASCADE;"
fi

# 5. Importer les donnees
echo "[5/5] Import des donnees dans v2..."
PGPASSWORD="$TARGET_DB_PASSWORD" psql \
  -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" \
  -f "$BACKUP_DIR/source_data.sql"

# Verification
echo ""
echo "=== Verification ==="
PGPASSWORD="$TARGET_DB_PASSWORD" psql \
  -h "$TARGET_DB_HOST" -p "$TARGET_DB_PORT" -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" \
  -c "SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles UNION ALL SELECT 'locations', COUNT(*) FROM locations;"

echo ""
echo "Migration terminee!"
echo "Backup disponible dans: $BACKUP_DIR"
```

---

## Verification Post-Migration

### Verifier les comptages

```bash
PGPASSWORD=tribe_super_secret_2024 psql -h localhost -p 5433 -U postgres -d tribe -c "
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'locations_validated', COUNT(*) FROM locations WHERE status = 'validated'
UNION ALL
SELECT 'locations_pending', COUNT(*) FROM locations WHERE status = 'pending';
"
```

### Verifier l'integrite des relations

```bash
PGPASSWORD=tribe_super_secret_2024 psql -h localhost -p 5433 -U postgres -d tribe -c "
-- Locations sans collecteur valide
SELECT COUNT(*) as orphan_locations
FROM locations l
LEFT JOIN profiles p ON l.collector_id = p.id
WHERE l.collector_id IS NOT NULL AND p.id IS NULL;
"
```

### Recalculer les points des utilisateurs

```sql
-- Recalculer les points bases sur les locations validees
UPDATE profiles p
SET points = COALESCE((
  SELECT SUM(points_awarded)
  FROM locations l
  WHERE l.collector_id = p.id
  AND l.status = 'validated'
), 0);

-- Recalculer les niveaux
UPDATE profiles
SET level = CASE
  WHEN points >= 2000 THEN 6
  WHEN points >= 1000 THEN 5
  WHEN points >= 600 THEN 4
  WHEN points >= 300 THEN 3
  WHEN points >= 100 THEN 2
  ELSE 1
END;
```

---

## Rollback

En cas de probleme, restaurer le backup:

```bash
# Restaurer la base v2
PGPASSWORD=tribe_super_secret_2024 psql \
  -h localhost -p 5433 -U postgres -d tribe \
  -f migration_backup_XXXXXXXX/tribe_v2_backup.sql
```

---

## Checklist de Migration TRIBE v1 -> v2

### Préparation
- [ ] Lire l'audit de sécurité (Audit_Complet_TRIBE_Securite.docx)
- [ ] Configurer .env.migration avec les credentials
- [ ] Backup de la base v2 existante
- [ ] Vérifier l'accès aux bases sources (MySQL et MongoDB)

### Migration MySQL (Users)
- [ ] Connexion à MySQL Azure réussie
- [ ] Export des utilisateurs
- [ ] Hashage des mots de passe (bcrypt)
- [ ] Import dans profiles PostgreSQL
- [ ] Vérification des comptages

### Migration MongoDB (Locations)
- [ ] Connexion à MongoDB Atlas réussie
- [ ] Export des POIs/locations
- [ ] Mapping des catégories
- [ ] Mapping des user IDs
- [ ] Import dans locations PostgreSQL
- [ ] Vérification des coordonnées GPS

### Post-Migration
- [ ] Exécuter `npm run verify`
- [ ] Exécuter `npm run recalculate`
- [ ] Test de connexion utilisateur via API
- [ ] Test de création de POI via app mobile
- [ ] Vérification sur le dashboard admin

### Sécurité Post-Migration
- [ ] Régénérer password MongoDB Atlas
- [ ] Régénérer password MySQL Azure
- [ ] Régénérer Firebase Private Key
- [ ] Régénérer Azure Blob Storage Key
- [ ] Mettre à jour les secrets dans les services v1 (si encore utilisés)

---

## Fichiers de Migration

| Fichier | Description |
|---------|-------------|
| `scripts/migration/migrate-all.js` | Script principal orchestrant la migration |
| `scripts/migration/migrate-mysql.js` | Migration MySQL → PostgreSQL |
| `scripts/migration/migrate-mongodb.js` | Migration MongoDB → PostgreSQL |
| `scripts/migration/verify-migration.js` | Vérification post-migration |
| `scripts/migration/recalculate-points.js` | Recalcul des points et niveaux |
| `scripts/migration/.env.migration.example` | Template de configuration |

---

## Support

En cas de probleme de migration, verifier:
1. Les logs d'erreur PostgreSQL
2. Les contraintes de cle etrangere
3. Les formats de date (ISO 8601)
4. Les enums (category, status, role)
5. La connexion réseau aux bases sources (MongoDB Atlas, MySQL Azure)
6. Les mappings de catégories et statuts dans les scripts
