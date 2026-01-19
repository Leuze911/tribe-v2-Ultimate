#!/usr/bin/env node
/**
 * Script de correction des collector_id pour les POIs migrés de MongoDB
 *
 * Ce script:
 * 1. Lit les documents MongoDB avec leurs createdBy (email)
 * 2. Récupère les locations PostgreSQL avec leur mongo_id
 * 3. Mappe les emails vers les profile_id PostgreSQL
 * 4. Met à jour collector_id pour chaque POI
 */

const { MongoClient } = require('mongodb');
const { Client } = require('pg');

// Configuration MongoDB Atlas (REQUIRED: set MONGO_URI environment variable)
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || 'Cluster0';
const MONGO_COLLECTION = process.env.MONGO_COLLECTION || 'locationEntity';

// Configuration PostgreSQL TRIBE v2 (REQUIRED: set PG_PASSWORD environment variable)
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5433'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'tribe'
};

// Validate required environment variables
function validateEnv() {
  const missing = [];
  if (!MONGO_URI) missing.push('MONGO_URI');
  if (!PG_CONFIG.password) missing.push('PG_PASSWORD');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease set these variables or create a .env file.');
    console.error('See .env.migration.example for reference.');
    process.exit(1);
  }
}

async function fixCollectors() {
  // Validate environment variables before starting
  validateEnv();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Correction des collector_id pour POIs migrés               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const mongoClient = new MongoClient(MONGO_URI);
  const pgClient = new Client(PG_CONFIG);

  let stats = { updated: 0, notFound: 0, noProfile: 0, alreadySet: 0 };

  try {
    // Connexion MongoDB
    console.log('[1/5] Connexion à MongoDB Atlas...');
    await mongoClient.connect();
    const mongoDb = mongoClient.db(MONGO_DB);
    const collection = mongoDb.collection(MONGO_COLLECTION);
    console.log('  ✓ Connecté à MongoDB\n');

    // Connexion PostgreSQL
    console.log('[2/5] Connexion à PostgreSQL v2...');
    await pgClient.connect();
    console.log('  ✓ Connecté à PostgreSQL\n');

    // Charger les profils PostgreSQL
    console.log('[3/5] Chargement des profils...');
    const pgProfiles = await pgClient.query('SELECT id, email FROM profiles');
    const emailToId = new Map();
    pgProfiles.rows.forEach(p => emailToId.set(p.email.toLowerCase(), p.id));
    console.log(`  ✓ ${pgProfiles.rows.length} profils chargés\n`);

    // Récupérer tous les documents MongoDB avec createdBy
    console.log('[4/5] Récupération des documents MongoDB...');
    const mongoLocations = await collection.find(
      { delete: { $ne: 'YES' }, createdBy: { $exists: true, $ne: null } },
      { projection: { _id: 1, createdBy: 1, locationName: 1 } }
    ).toArray();
    console.log(`  ✓ ${mongoLocations.length} documents avec createdBy\n`);

    // Créer un map mongo_id -> createdBy
    const mongoIdToEmail = new Map();
    mongoLocations.forEach(loc => {
      mongoIdToEmail.set(loc._id.toString(), loc.createdBy);
    });

    // Récupérer les locations PostgreSQL sans collector_id
    console.log('[5/5] Mise à jour des collector_id...');
    const pgLocations = await pgClient.query(`
      SELECT id, name, metadata
      FROM locations
      WHERE collector_id IS NULL
    `);
    console.log(`  → ${pgLocations.rows.length} locations à traiter\n`);

    for (const loc of pgLocations.rows) {
      const mongoId = loc.metadata?.mongo_id;

      if (!mongoId) {
        stats.notFound++;
        continue;
      }

      const email = mongoIdToEmail.get(mongoId);

      if (!email) {
        console.log(`  ⚠ Pas de createdBy pour mongo_id: ${mongoId} (${loc.name})`);
        stats.notFound++;
        continue;
      }

      const profileId = emailToId.get(email.toLowerCase());

      if (!profileId) {
        console.log(`  ⚠ Pas de profil pour email: ${email} (${loc.name})`);
        stats.noProfile++;
        continue;
      }

      // Mettre à jour le collector_id
      await pgClient.query(
        'UPDATE locations SET collector_id = $1 WHERE id = $2',
        [profileId, loc.id]
      );
      stats.updated++;

      if (stats.updated % 100 === 0) {
        console.log(`  ... ${stats.updated} locations mises à jour`);
      }
    }

    // Vérifier les POIs qui avaient déjà collector_id
    const alreadySet = await pgClient.query(`
      SELECT COUNT(*) as count FROM locations WHERE collector_id IS NOT NULL
    `);
    stats.alreadySet = parseInt(alreadySet.rows[0].count) - stats.updated;

    console.log(`\n✅ Correction terminée!`);
    console.log(`   - Mis à jour: ${stats.updated}`);
    console.log(`   - Déjà définis: ${stats.alreadySet}`);
    console.log(`   - Mongo_id non trouvé: ${stats.notFound}`);
    console.log(`   - Profil manquant: ${stats.noProfile}`);

    // Vérification finale
    console.log('\n=== Vérification finale ===');
    const finalStats = await pgClient.query(`
      SELECT
        COUNT(*) as total,
        COUNT(collector_id) as with_collector,
        COUNT(*) - COUNT(collector_id) as without_collector
      FROM locations
    `);
    console.log(`Total POIs: ${finalStats.rows[0].total}`);
    console.log(`Avec collector: ${finalStats.rows[0].with_collector}`);
    console.log(`Sans collector: ${finalStats.rows[0].without_collector}`);

    // Top collectors
    const topCollectors = await pgClient.query(`
      SELECT p.email, COUNT(l.id) as poi_count
      FROM profiles p
      JOIN locations l ON l.collector_id = p.id
      GROUP BY p.id, p.email
      ORDER BY poi_count DESC
      LIMIT 10
    `);
    console.log('\n=== Top 10 Collectors ===');
    topCollectors.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.email}: ${row.poi_count} POIs`);
    });

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    throw error;
  } finally {
    await mongoClient.close();
    await pgClient.end();
  }

  return stats;
}

module.exports = { fixCollectors };

if (require.main === module) {
  fixCollectors()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
