#!/usr/bin/env node
/**
 * Script de Migration MongoDB Atlas -> PostgreSQL TRIBE v2
 *
 * Source: Cluster0.locationEntity (MongoDB Atlas)
 * Cible: TRIBE v2 PostgreSQL locations table
 *
 * Usage:
 *   node migrate-mongodb.js
 */

const { MongoClient } = require('mongodb');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Configuration MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://laminedeme:dn44y6icd9ZH8tFP@cluster0.lfr7e90.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_DB = 'Cluster0';
const MONGO_COLLECTION = 'locationEntity';

// Configuration PostgreSQL TRIBE v2
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5433'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'tribe_super_secret_2024',
  database: process.env.PG_DATABASE || 'tribe'
};

// Mapping des types MongoDB -> PostgreSQL enum location_category
const CATEGORY_MAPPING = {
  // Restaurants & Food
  'restaurant': 'restaurant',
  'restaurant ': 'restaurant',
  'cafe': 'restaurant',
  'cafe touba': 'restaurant',
  'cantine': 'restaurant',
  'fastfood': 'restaurant',
  'tangana': 'restaurant',
  'patisserie': 'restaurant',

  // Shops
  'boutique': 'shop',
  'kiosque': 'shop',
  'magasin': 'shop',
  'magasin electromenager': 'shop',
  'depot': 'shop',
  'quincaillerie': 'shop',
  'supermarket': 'shop',
  'librairie': 'shop',
  'bijouterie': 'shop',
  'vente de fruits et legumes de rue': 'shop',
  'tablier  etal de rue ': 'shop',
  'vendeur ambulant  bana bana ': 'shop',
  'vente piece detachee': 'shop',
  'ventes pieces detachees auto ': 'shop',
  'stationary': 'shop',

  // Services
  'societe': 'service',
  'multi service': 'service',
  'agence bancaire': 'service',
  'bureau de transfert d argent': 'service',
  'agence d assurance': 'service',
  'agence de voyage': 'service',
  'agence de marketing': 'service',
  'agence de production': 'service',
  'agence juridique': 'service',
  'cabinet d expertise': 'service',
  'bureau de poste': 'service',
  'centre de telecommunications': 'service',
  'garage': 'service',
  'lavage': 'service',
  'lavage de voiture ': 'service',
  'atelier mecanique': 'service',
  'atelier auto': 'service',
  'atelier menuiserie': 'service',
  'atelier couture': 'service',
  'salon de coiffure': 'service',
  'salon de soin': 'service',
  'pressing': 'service',
  'cordonnier': 'service',
  'vulgarisateur': 'service',
  'imprimerie': 'service',
  'impression ': 'service',
  'cybercafe': 'service',
  'acep': 'service',
  'déco intérieure ': 'service',
  'magasin deco': 'service',
  'kaynane  vente d eau filtree ': 'service',

  // Health
  'pharmacie': 'health',
  'cabinet medical': 'health',
  'cabinet médical ': 'health',
  'cabinet dentaire': 'health',
  'maternite': 'health',

  // Education
  'ecole privee': 'education',
  'institut superieur': 'education',
  'centre de formation professionnelle': 'education',
  'centre d alphabetisation': 'education',
  'établissement scolaire ': 'education',
  'dahra': 'education',

  // Transport
  'parking voiture et moto': 'transport',
  'station de taxis collectifs': 'transport',
  'atomobile': 'transport',

  // Tourism
  'hotel': 'tourism',
  'maison d hote': 'tourism',
  'residence meublee': 'tourism',
  'complex': 'tourism',
  'mall': 'tourism',

  // Culture
  'monument': 'culture',
  'museum  ': 'culture',
  'art gallery': 'culture',
  'theater ': 'culture',
  'cinema ': 'culture',
  'palais presidentiel': 'culture',
  'mosquee': 'culture',
  'marabout': 'culture',

  // Sport
  'salle de sport': 'sport',
  'terrain de basket': 'sport',

  // Other
  'z  others': 'other',
  'others': 'other',
  'immeuble residentiel': 'other',
  'arbre remarquable': 'other',
  'jardin public et prive': 'other',
  'jardin public': 'other',
  'jardin public ': 'other',
  'depotoir d ordure': 'other',
  'point de collecte selective': 'other',
  'poteau electrique': 'other',
  'antenne relais telephonie mobile': 'other',
  'terrain a louer': 'other',
  'abattoir': 'other',
  'écosystèmes ': 'other',
  'cl3': 'other'
};

// Mapping des statuts
const STATUS_MAPPING = {
  'pending': 'pending',
  'Pending': 'pending',
  'approved': 'validated',
  'Approved': 'validated',
  'validated': 'validated',
  'rejected': 'rejected',
  'Rejected': 'rejected'
};

function mapCategory(locationType) {
  if (!locationType) return 'other';
  const normalized = locationType.toLowerCase().trim();
  return CATEGORY_MAPPING[normalized] || 'other';
}

function mapStatus(status) {
  if (!status) return 'pending';
  return STATUS_MAPPING[status] || 'pending';
}

async function migrate() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Migration MongoDB Atlas -> PostgreSQL TRIBE v2              ║');
  console.log('║  Source: Cluster0.locationEntity (1236 POIs)                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const mongoClient = new MongoClient(MONGO_URI);
  const pgClient = new Client(PG_CONFIG);

  let stats = { migrated: 0, skipped: 0, errors: 0 };

  try {
    // Connexions
    console.log('[1/5] Connexion à MongoDB Atlas...');
    await mongoClient.connect();
    const mongoDb = mongoClient.db(MONGO_DB);
    const collection = mongoDb.collection(MONGO_COLLECTION);
    console.log('  ✓ Connecté à MongoDB\n');

    console.log('[2/5] Connexion à PostgreSQL v2...');
    await pgClient.connect();
    console.log('  ✓ Connecté à PostgreSQL\n');

    // Récupérer les profils existants pour mapper les emails
    console.log('[3/5] Chargement des profils existants...');
    const pgProfiles = await pgClient.query('SELECT id, email FROM profiles');
    const emailToId = new Map();
    pgProfiles.rows.forEach(p => emailToId.set(p.email.toLowerCase(), p.id));
    console.log(`  ✓ ${pgProfiles.rows.length} profils chargés\n`);

    // Récupérer et migrer les locations
    console.log('[4/5] Migration des locations...');
    const mongoLocations = await collection.find({ delete: { $ne: 'YES' } }).toArray();
    console.log(`  → ${mongoLocations.length} locations à migrer\n`);

    for (const loc of mongoLocations) {
      try {
        // Vérifier les coordonnées
        if (!loc.latitude || !loc.longitude) {
          console.log(`  ⚠ Skip: ${loc.locationName} - coordonnées manquantes`);
          stats.skipped++;
          continue;
        }

        // Mapper la catégorie
        const category = mapCategory(loc.locationType);
        const status = mapStatus(loc.status);

        // Trouver le collector_id si l'email existe
        let collectorId = null;
        if (loc.createdBy) {
          collectorId = emailToId.get(loc.createdBy.toLowerCase()) || null;
        }

        // Préparer les photos (URLs Azure Blob Storage)
        const photos = (loc.uploads || []).map(filename => {
          // Les photos sont probablement sur Azure Blob Storage
          // Format: https://[account].blob.core.windows.net/[container]/[filename]
          return filename;
        });

        // Metadata additionnelle
        const metadata = {
          mongo_id: loc._id.toString(),
          reference_id: loc.referenceId,
          name_location: loc.name_location,
          token: loc.token,
          token_id: loc.token_id,
          original_type: loc.locationType,
          migrated_at: new Date().toISOString()
        };

        // Insérer dans PostgreSQL
        const newId = uuidv4();
        const insertQuery = `
          INSERT INTO locations (
            id, collector_id, name, category, description,
            latitude, longitude, address, city,
            photos, metadata, status, points_awarded,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4::location_category, $5,
            $6, $7, $8, $9,
            $10, $11, $12::location_status, $13,
            $14, $15
          )
          ON CONFLICT DO NOTHING
        `;

        const values = [
          newId,
          collectorId,
          loc.locationName || 'Sans nom',
          category,
          '', // description vide pour l'instant
          loc.latitude,
          loc.longitude,
          loc.address || '',
          'Dakar', // default city
          photos,
          JSON.stringify(metadata),
          status,
          status === 'validated' ? 10 : 0,
          loc.createdOn ? new Date(loc.createdOn) : new Date(),
          new Date()
        ];

        await pgClient.query(insertQuery, values);
        stats.migrated++;

        if (stats.migrated % 100 === 0) {
          console.log(`  ... ${stats.migrated} locations migrées`);
        }
      } catch (err) {
        console.log(`  ✗ Erreur: ${loc.locationName || loc._id} - ${err.message}`);
        stats.errors++;
      }
    }

    console.log(`\n  ✓ Migration terminée: ${stats.migrated} migrées, ${stats.skipped} ignorées, ${stats.errors} erreurs\n`);

    // Vérification finale
    console.log('[5/5] Vérification...');
    const countResult = await pgClient.query('SELECT COUNT(*) as count FROM locations');
    console.log(`  Total locations dans v2: ${countResult.rows[0].count}`);

    const categoryStats = await pgClient.query(`
      SELECT category, COUNT(*) as count
      FROM locations
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log('\n  Répartition par catégorie:');
    categoryStats.rows.forEach(row => {
      console.log(`    ${row.category}: ${row.count}`);
    });

    const statusStats = await pgClient.query(`
      SELECT status, COUNT(*) as count
      FROM locations
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('\n  Répartition par statut:');
    statusStats.rows.forEach(row => {
      console.log(`    ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('\nErreur fatale:', error);
    throw error;
  } finally {
    await mongoClient.close();
    await pgClient.end();
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   MIGRATION TERMINÉE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  return stats;
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
