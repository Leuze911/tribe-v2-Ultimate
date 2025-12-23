/**
 * Script de Migration MongoDB Atlas -> PostgreSQL TRIBE v2
 *
 * Source: tribe-location-service (MongoDB Atlas)
 * Cible: TRIBE v2 PostgreSQL (port 5433)
 *
 * Usage:
 *   1. Installer les dépendances: npm install mongodb pg uuid
 *   2. Configurer les variables d'environnement ou modifier ce fichier
 *   3. Exécuter: node migrate-mongodb.js
 */

const { MongoClient } = require('mongodb');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Configuration MongoDB (Source - tribe-location-service)
// ATTENTION: Ces credentials sont compromis selon l'audit - à régénérer après migration
const MONGO_CONFIG = {
  // Format typique MongoDB Atlas
  uri: process.env.MONGO_URI || 'mongodb+srv://tribe-user:SYQogeSN4aJCqY5n@cluster0.xxxxx.mongodb.net/tribe',
  database: process.env.MONGO_DB || 'tribe',
  collection: process.env.MONGO_COLLECTION || 'locations' // ou 'pois'
};

// Configuration PostgreSQL (Cible - TRIBE v2)
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5433'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'tribe_super_secret_2024',
  database: process.env.PG_DATABASE || 'tribe'
};

// Mapping des catégories MongoDB -> PostgreSQL enum
const CATEGORY_MAPPING = {
  // Valeurs possibles dans l'ancienne app
  'food': 'restaurant',
  'restaurant': 'restaurant',
  'cafe': 'restaurant',
  'bar': 'restaurant',
  'store': 'shop',
  'shop': 'shop',
  'market': 'shop',
  'supermarket': 'shop',
  'boutique': 'shop',
  'service': 'service',
  'bank': 'service',
  'atm': 'service',
  'hospital': 'health',
  'health': 'health',
  'pharmacy': 'health',
  'clinic': 'health',
  'doctor': 'health',
  'school': 'education',
  'education': 'education',
  'university': 'education',
  'college': 'education',
  'transport': 'transport',
  'bus': 'transport',
  'taxi': 'transport',
  'gare': 'transport',
  'station': 'transport',
  'tourism': 'tourism',
  'hotel': 'tourism',
  'museum': 'tourism',
  'monument': 'tourism',
  'culture': 'culture',
  'library': 'culture',
  'cinema': 'culture',
  'theater': 'culture',
  'sport': 'sport',
  'gym': 'sport',
  'stadium': 'sport',
  'pool': 'sport',
  'other': 'other'
};

// Mapping des statuts
const STATUS_MAPPING = {
  'pending': 'pending',
  'approved': 'validated',
  'validated': 'validated',
  'accepted': 'validated',
  'rejected': 'rejected',
  'refused': 'rejected'
};

// Mapping des user IDs MongoDB -> PostgreSQL UUID
const userIdMapping = new Map();

async function migrate() {
  console.log('=== Migration MongoDB -> PostgreSQL TRIBE v2 ===\n');

  const mongoClient = new MongoClient(MONGO_CONFIG.uri);
  const pgClient = new Client(PG_CONFIG);

  try {
    // Connexion aux bases
    console.log('[1/6] Connexion à MongoDB Atlas...');
    await mongoClient.connect();
    const mongoDb = mongoClient.db(MONGO_CONFIG.database);
    console.log('  ✓ Connecté à MongoDB\n');

    console.log('[2/6] Connexion à PostgreSQL v2...');
    await pgClient.connect();
    console.log('  ✓ Connecté à PostgreSQL\n');

    // Récupérer les données MongoDB
    console.log('[3/6] Extraction des données MongoDB...');
    const locationsCollection = mongoDb.collection(MONGO_CONFIG.collection);
    const mongoLocations = await locationsCollection.find({}).toArray();
    console.log(`  ✓ ${mongoLocations.length} locations trouvées\n`);

    // Récupérer les users existants dans PostgreSQL pour le mapping
    console.log('[4/6] Chargement des profils PostgreSQL existants...');
    const pgProfiles = await pgClient.query('SELECT id, email FROM profiles');
    const emailToId = new Map();
    pgProfiles.rows.forEach(p => emailToId.set(p.email, p.id));
    console.log(`  ✓ ${pgProfiles.rows.length} profils existants\n`);

    // Migration des locations
    console.log('[5/6] Migration des locations...');
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const mongoLoc of mongoLocations) {
      try {
        // Extraire les coordonnées (format MongoDB GeoJSON ou simple)
        let latitude, longitude;
        if (mongoLoc.location?.coordinates) {
          // Format GeoJSON: [longitude, latitude]
          longitude = mongoLoc.location.coordinates[0];
          latitude = mongoLoc.location.coordinates[1];
        } else if (mongoLoc.coordinates) {
          longitude = mongoLoc.coordinates[0] || mongoLoc.coordinates.lng;
          latitude = mongoLoc.coordinates[1] || mongoLoc.coordinates.lat;
        } else {
          latitude = mongoLoc.latitude || mongoLoc.lat;
          longitude = mongoLoc.longitude || mongoLoc.lng;
        }

        if (!latitude || !longitude) {
          console.log(`  ⚠ Skipping ${mongoLoc.name}: coordonnées manquantes`);
          skipped++;
          continue;
        }

        // Mapper la catégorie
        const originalCategory = (mongoLoc.category || mongoLoc.type || 'other').toLowerCase();
        const category = CATEGORY_MAPPING[originalCategory] || 'other';

        // Mapper le statut
        const originalStatus = (mongoLoc.status || 'pending').toLowerCase();
        const status = STATUS_MAPPING[originalStatus] || 'pending';

        // Trouver ou créer un collector_id
        let collectorId = null;
        if (mongoLoc.userId || mongoLoc.user_id || mongoLoc.createdBy) {
          const mongoUserId = mongoLoc.userId || mongoLoc.user_id || mongoLoc.createdBy;

          // Si on a déjà mappé cet ID
          if (userIdMapping.has(mongoUserId.toString())) {
            collectorId = userIdMapping.get(mongoUserId.toString());
          } else if (mongoLoc.userEmail && emailToId.has(mongoLoc.userEmail)) {
            collectorId = emailToId.get(mongoLoc.userEmail);
            userIdMapping.set(mongoUserId.toString(), collectorId);
          }
        }

        // Photos (convertir en array PostgreSQL)
        let photos = [];
        if (mongoLoc.photos && Array.isArray(mongoLoc.photos)) {
          photos = mongoLoc.photos;
        } else if (mongoLoc.imageUrl) {
          photos = [mongoLoc.imageUrl];
        } else if (mongoLoc.images && Array.isArray(mongoLoc.images)) {
          photos = mongoLoc.images;
        }

        // Metadata additionnelle
        const metadata = {
          mongo_id: mongoLoc._id?.toString(),
          original_category: originalCategory,
          original_status: originalStatus,
          migrated_at: new Date().toISOString(),
          ...mongoLoc.metadata
        };

        // Insérer dans PostgreSQL
        const newId = uuidv4();
        const insertQuery = `
          INSERT INTO locations (
            id, collector_id, name, category, description,
            latitude, longitude, accuracy, address, city,
            photos, metadata, status, points_awarded, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4::location_category, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13::location_status, $14, $15, $16
          )
          ON CONFLICT (id) DO NOTHING
        `;

        const values = [
          newId,
          collectorId,
          mongoLoc.name || 'Sans nom',
          category,
          mongoLoc.description || '',
          latitude,
          longitude,
          mongoLoc.accuracy || null,
          mongoLoc.address || '',
          mongoLoc.city || 'Dakar',
          photos,
          JSON.stringify(metadata),
          status,
          status === 'validated' ? (mongoLoc.points || 10) : 0,
          mongoLoc.createdAt?.$date || mongoLoc.created_at || new Date(),
          mongoLoc.updatedAt?.$date || mongoLoc.updated_at || new Date()
        ];

        await pgClient.query(insertQuery, values);
        migrated++;

        if (migrated % 100 === 0) {
          console.log(`  ... ${migrated} locations migrées`);
        }
      } catch (err) {
        console.log(`  ✗ Erreur pour ${mongoLoc.name || mongoLoc._id}: ${err.message}`);
        errors++;
      }
    }

    console.log(`  ✓ Migration terminée: ${migrated} migrées, ${skipped} ignorées, ${errors} erreurs\n`);

    // Vérification
    console.log('[6/6] Vérification...');
    const countResult = await pgClient.query('SELECT COUNT(*) as count FROM locations');
    console.log(`  ✓ Total locations dans v2: ${countResult.rows[0].count}\n`);

    // Récapitulatif par catégorie
    const categoryStats = await pgClient.query(`
      SELECT category, COUNT(*) as count
      FROM locations
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log('  Répartition par catégorie:');
    categoryStats.rows.forEach(row => {
      console.log(`    ${row.category}: ${row.count}`);
    });

  } catch (error) {
    console.error('Erreur de migration:', error);
    throw error;
  } finally {
    await mongoClient.close();
    await pgClient.end();
  }

  console.log('\n=== Migration MongoDB terminée ===');
}

// Export pour usage en module
module.exports = { migrate };

// Exécution directe
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
