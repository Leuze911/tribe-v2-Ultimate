#!/usr/bin/env node
/**
 * Migration des catégories TRIBE v1 -> v2
 *
 * Source: tribe-back-office.token_configuration (MySQL Azure)
 * Cible: PostgreSQL v2 (categories + poi_types tables)
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');

// Configuration MySQL Azure (tribe-back-office)
const MYSQL_CONFIG = {
  host: 'd-tribe-mql.mysql.database.azure.com',
  port: 3306,
  user: 'admin_nysom',
  password: 'tribe2023!!',
  database: 'tribe-back-office',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 30000
};

// Configuration PostgreSQL TRIBE v2
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5433'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'tribe_super_secret_2024',
  database: process.env.PG_DATABASE || 'tribe'
};

// Fonction pour créer un slug à partir d'un nom
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Mapping des icônes pour chaque catégorie
const CATEGORY_ICONS = {
  'Loisirs  culture et espaces publics': 'library',
  'Commerces  marches et boutiques': 'storefront',
  'Services de proximite  logistique et economie informelle': 'construct',
  'Infrastructure publique  securite et environnement': 'business',
  'Artisanat  ateliers et services techniques': 'hammer',
  'Sante et bien etre': 'medkit',
  'Transports et mobilite': 'bus',
  'Services administratifs  financiers et professionnels': 'briefcase',
  'Hebergement et logement': 'bed',
  'education et formation': 'school',
  'Restauration et alimentation': 'restaurant',
  'Lieux de culte et spiritualite': 'heart',
  'Culture and Leisure': 'color-palette',
  'Shopping': 'cart',
  'Services': 'settings',
  'Dining and entertainement ': 'cafe',
  'Others': 'ellipsis-horizontal'
};

async function migrate() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Migration Catégories TRIBE v1 -> v2                         ║');
  console.log('║  Source: MySQL tribe-back-office.token_configuration         ║');
  console.log('║  Cible: PostgreSQL categories + poi_types                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  const pgClient = new Client(PG_CONFIG);

  try {
    // Connexions
    console.log('[1/6] Connexion aux bases de données...');
    await pgClient.connect();
    console.log('  ✓ Connecté à MySQL et PostgreSQL\n');

    // Étape 2: Créer les tables dans PostgreSQL
    console.log('[2/6] Création des tables categories et poi_types...');

    await pgClient.query(`
      -- Table des catégories principales
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        icon VARCHAR(50) DEFAULT 'folder',
        description TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Index pour recherche rapide
      CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
      CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
    `);
    console.log('  ✓ Table categories créée');

    await pgClient.query(`
      -- Table des types de POI (liés aux catégories)
      CREATE TABLE IF NOT EXISTS poi_types (
        id INT PRIMARY KEY,
        category_id INT REFERENCES categories(id),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        discovery_points INT DEFAULT 5,
        collector_points INT DEFAULT 5,
        update_points DECIMAL(3,1) DEFAULT 2.5,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(category_id, slug)
      );

      -- Index pour recherche rapide
      CREATE INDEX IF NOT EXISTS idx_poi_types_category ON poi_types(category_id);
      CREATE INDEX IF NOT EXISTS idx_poi_types_slug ON poi_types(slug);
      CREATE INDEX IF NOT EXISTS idx_poi_types_active ON poi_types(is_active);
    `);
    console.log('  ✓ Table poi_types créée\n');

    // Étape 3: Récupérer les données de MySQL
    console.log('[3/6] Récupération des données depuis MySQL...');
    const [rows] = await mysqlConn.query(`
      SELECT token_id, category, details, discovery, collector, updatepoi, status, delete_status
      FROM token_configuration
      WHERE delete_status = 'NO'
      ORDER BY category, details
    `);
    console.log(`  ✓ ${rows.length} types de POI récupérés\n`);

    // Étape 4: Insérer les catégories uniques
    console.log('[4/6] Insertion des catégories...');
    const uniqueCategories = [...new Set(rows.map(r => r.category))];
    const categoryIdMap = new Map();

    for (let i = 0; i < uniqueCategories.length; i++) {
      const catName = uniqueCategories[i];
      const slug = slugify(catName);
      const icon = CATEGORY_ICONS[catName] || 'folder';

      const result = await pgClient.query(`
        INSERT INTO categories (name, slug, icon, display_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = $1, icon = $3
        RETURNING id
      `, [catName, slug, icon, i + 1]);

      categoryIdMap.set(catName, result.rows[0].id);
      console.log(`  ✓ ${catName} (id: ${result.rows[0].id})`);
    }
    console.log(`  Total: ${uniqueCategories.length} catégories\n`);

    // Étape 5: Insérer les types de POI
    console.log('[5/6] Insertion des types de POI...');
    let insertedCount = 0;

    for (const row of rows) {
      const categoryId = categoryIdMap.get(row.category);
      const slug = slugify(row.details);
      const isActive = row.status === 'Active';

      await pgClient.query(`
        INSERT INTO poi_types (id, category_id, name, slug, discovery_points, collector_points, update_points, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          category_id = $2, name = $3, slug = $4,
          discovery_points = $5, collector_points = $6, update_points = $7, is_active = $8
      `, [row.token_id, categoryId, row.details, slug, row.discovery, row.collector, row.updatepoi, isActive]);

      insertedCount++;
      if (insertedCount % 50 === 0) {
        console.log(`  ... ${insertedCount} types insérés`);
      }
    }
    console.log(`  ✓ Total: ${insertedCount} types de POI insérés\n`);

    // Étape 6: Ajouter la colonne poi_type_id à locations et lier les POIs existants
    console.log('[6/6] Liaison des POIs existants aux types...');

    // Ajouter la colonne si elle n'existe pas
    await pgClient.query(`
      ALTER TABLE locations
      ADD COLUMN IF NOT EXISTS poi_type_id INT REFERENCES poi_types(id);

      CREATE INDEX IF NOT EXISTS idx_locations_poi_type ON locations(poi_type_id);
    `);
    console.log('  ✓ Colonne poi_type_id ajoutée');

    // Mettre à jour les POIs existants en utilisant metadata->>'original_type'
    const updateResult = await pgClient.query(`
      UPDATE locations l
      SET poi_type_id = pt.id
      FROM poi_types pt
      WHERE LOWER(TRIM(l.metadata->>'original_type')) = LOWER(TRIM(pt.name))
      AND l.poi_type_id IS NULL
    `);
    console.log(`  ✓ ${updateResult.rowCount} POIs liés via original_type`);

    // Pour les POIs sans correspondance exacte, essayer avec le nom
    const updateResult2 = await pgClient.query(`
      UPDATE locations l
      SET poi_type_id = pt.id
      FROM poi_types pt
      WHERE l.poi_type_id IS NULL
      AND LOWER(TRIM(l.name)) LIKE '%' || LOWER(TRIM(pt.name)) || '%'
    `);
    console.log(`  ✓ ${updateResult2.rowCount} POIs supplémentaires liés via nom`);

    // Statistiques finales
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    STATISTIQUES FINALES');
    console.log('═══════════════════════════════════════════════════════════════');

    const catCount = await pgClient.query('SELECT COUNT(*) FROM categories');
    const typeCount = await pgClient.query('SELECT COUNT(*) FROM poi_types');
    const linkedCount = await pgClient.query('SELECT COUNT(*) FROM locations WHERE poi_type_id IS NOT NULL');
    const totalCount = await pgClient.query('SELECT COUNT(*) FROM locations');

    console.log(`  Catégories:        ${catCount.rows[0].count}`);
    console.log(`  Types de POI:      ${typeCount.rows[0].count}`);
    console.log(`  POIs liés:         ${linkedCount.rows[0].count}/${totalCount.rows[0].count}`);
    console.log(`  POIs non liés:     ${totalCount.rows[0].count - linkedCount.rows[0].count}`);

    // Afficher les POIs non liés par original_type
    const unlinked = await pgClient.query(`
      SELECT metadata->>'original_type' as original_type, COUNT(*) as count
      FROM locations
      WHERE poi_type_id IS NULL AND metadata->>'original_type' IS NOT NULL
      GROUP BY metadata->>'original_type'
      ORDER BY count DESC
      LIMIT 10
    `);

    if (unlinked.rows.length > 0) {
      console.log('\n  POIs non liés (top 10 original_types):');
      unlinked.rows.forEach(r => console.log(`    - ${r.original_type}: ${r.count}`));
    }

  } catch (error) {
    console.error('\n✗ Erreur:', error.message);
    throw error;
  } finally {
    await mysqlConn.end();
    await pgClient.end();
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   MIGRATION TERMINÉE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

module.exports = { migrate };

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
