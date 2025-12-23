#!/usr/bin/env node
/**
 * Script de Migration Complet TRIBE v1 -> TRIBE v2
 *
 * Ce script orchestre la migration depuis:
 * - MySQL Azure (users/profiles depuis tribe-admin-service)
 * - MongoDB Atlas (locations/POIs depuis tribe-location-service)
 *
 * Usage:
 *   1. Installer les dépendances: npm install
 *   2. Configurer les variables dans .env.migration
 *   3. Exécuter: node migrate-all.js
 *
 * Ordre de migration:
 *   1. MySQL (users) -> PostgreSQL (profiles)
 *   2. MongoDB (locations) -> PostgreSQL (locations) avec mapping des user IDs
 */

const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement si disponibles
const envPath = path.join(__dirname, '.env.migration');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

async function migrateAll() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     TRIBE v1 -> v2 Migration Complète                        ║');
  console.log('║                                                              ║');
  console.log('║  Sources:                                                    ║');
  console.log('║    - MySQL Azure (tribe-admin-service) -> profiles           ║');
  console.log('║    - MongoDB Atlas (tribe-location-service) -> locations     ║');
  console.log('║                                                              ║');
  console.log('║  Cible: PostgreSQL TRIBE v2 (port 5433)                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();

  try {
    // Étape 1: Migration MySQL (users d'abord pour avoir les IDs)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ÉTAPE 1/2: Migration MySQL -> PostgreSQL (Users/Profiles)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const mysqlMigration = require('./migrate-mysql');
      await mysqlMigration.migrate();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.log('⚠ Connexion MySQL impossible - Vérifiez les credentials');
        console.log('  Continuons avec MongoDB...\n');
      } else {
        throw err;
      }
    }

    // Étape 2: Migration MongoDB (locations avec mapping des user IDs)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ÉTAPE 2/2: Migration MongoDB -> PostgreSQL (Locations/POIs)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const mongoMigration = require('./migrate-mongodb');
      await mongoMigration.migrate();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.name === 'MongoServerSelectionError') {
        console.log('⚠ Connexion MongoDB impossible - Vérifiez les credentials');
      } else {
        throw err;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                   MIGRATION TERMINÉE                         ║');
    console.log(`║  Durée totale: ${duration}s${' '.repeat(45 - duration.length)}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\nProchaines étapes:');
    console.log('  1. Vérifier les données: npm run verify');
    console.log('  2. Recalculer les points: npm run recalculate');
    console.log('  3. Régénérer tous les credentials sources (compromis)\n');

  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════════╗');
    console.error('║                    ERREUR DE MIGRATION                        ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error(error);
    process.exit(1);
  }
}

// Exécution
migrateAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
