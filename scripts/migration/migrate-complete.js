#!/usr/bin/env node
/**
 * Migration Complète - Données Manquantes
 *
 * 1. Ajoute timing_list (horaires) dans metadata des locations
 * 2. Crée et remplit la table rewards (token_master)
 * 3. Crée et remplit la table support_tickets (support_master)
 */

const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const { Client } = require('pg');
const fs = require('fs');

// Configurations (REQUIRED: set environment variables)
const MONGO_URI = process.env.MONGO_URI;

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'tribe',
  ssl: { rejectUnauthorized: false }
};

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
  if (!MYSQL_CONFIG.host) missing.push('MYSQL_HOST');
  if (!MYSQL_CONFIG.user) missing.push('MYSQL_USER');
  if (!MYSQL_CONFIG.password) missing.push('MYSQL_PASSWORD');
  if (!PG_CONFIG.password) missing.push('PG_PASSWORD');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease set these variables or create a .env file.');
    console.error('See .env.migration.example for reference.');
    process.exit(1);
  }
}

async function migrateComplete() {
  // Validate environment variables before starting
  validateEnv();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Migration Complète - Données Manquantes                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const mongoClient = new MongoClient(MONGO_URI);
  let mysqlConn;
  const pgClient = new Client(PG_CONFIG);

  try {
    // Connexions
    console.log('[1/6] Connexions aux bases de données...');
    await mongoClient.connect();
    mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
    await pgClient.connect();
    console.log('  ✓ Toutes les connexions établies\n');

    // ============================================
    // ÉTAPE 2: Créer les nouvelles tables PostgreSQL
    // ============================================
    console.log('[2/6] Création des tables manquantes dans PostgreSQL...');

    // Table rewards (historique des conversions de tokens)
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        tokens_used INTEGER NOT NULL,
        amount_converted DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, successful, rejected
        converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),

        -- Metadata pour traçabilité
        mysql_id INTEGER,  -- ID original dans MySQL
        notes TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_rewards_profile ON rewards(profile_id);
      CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
    `);
    console.log('  ✓ Table rewards créée');

    // Table support_tickets
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open',  -- open, in_progress, resolved, closed
        priority VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, urgent
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,

        -- Metadata
        mysql_id INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_support_email ON support_tickets(email);
      CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
    `);
    console.log('  ✓ Table support_tickets créée\n');

    // ============================================
    // ÉTAPE 3: Migrer timing_list vers metadata
    // ============================================
    console.log('[3/6] Migration des horaires d\'ouverture (timing_list)...');

    const mongoDB = mongoClient.db('Cluster0');
    const locationsColl = mongoDB.collection('locationEntity');

    // Récupérer les locations avec timing_list
    const locationsWithTiming = await locationsColl.find({
      timing_list: { $exists: true, $ne: null, $ne: [] }
    }).toArray();

    console.log(`  → ${locationsWithTiming.length} locations avec horaires`);

    let timingUpdated = 0;
    for (const loc of locationsWithTiming) {
      try {
        // Parser timing_list (format bizarre avec strings JSON fragmentées)
        let openingHours = [];
        if (Array.isArray(loc.timing_list)) {
          // Reconstruire le JSON
          const jsonStr = loc.timing_list.join('');
          try {
            openingHours = JSON.parse(jsonStr);
          } catch {
            // Format alternatif
            openingHours = loc.timing_list;
          }
        }

        // Mettre à jour la location dans PostgreSQL
        const updateResult = await pgClient.query(`
          UPDATE locations
          SET metadata = metadata || $1::jsonb,
              updated_at = NOW()
          WHERE metadata->>'mongo_id' = $2
        `, [
          JSON.stringify({ opening_hours: openingHours }),
          loc._id.toString()
        ]);

        if (updateResult.rowCount > 0) {
          timingUpdated++;
        }
      } catch (err) {
        console.log(`  ⚠ Erreur timing pour ${loc.locationName}: ${err.message}`);
      }
    }
    console.log(`  ✓ ${timingUpdated} locations mises à jour avec horaires\n`);

    // ============================================
    // ÉTAPE 4: Charger le mapping user IDs
    // ============================================
    console.log('[4/6] Chargement du mapping utilisateurs...');

    // Charger le mapping MySQL ID -> PostgreSQL UUID
    let userMapping = new Map();
    try {
      const mappingData = JSON.parse(fs.readFileSync('user_id_mapping.json', 'utf8'));
      mappingData.forEach(m => userMapping.set(m.mysql_id, m.pg_id));
      console.log(`  ✓ ${userMapping.size} mappings chargés\n`);
    } catch {
      console.log('  ⚠ Pas de fichier mapping, recherche par email...\n');
    }

    // Créer aussi un mapping par email
    const [mysqlUsers] = await mysqlConn.query('SELECT user_id, email FROM user_master');
    const mysqlEmailToId = new Map();
    mysqlUsers.forEach(u => mysqlEmailToId.set(u.user_id, u.email?.toLowerCase()));

    const pgProfilesRes = await pgClient.query('SELECT id, email FROM profiles');
    const pgEmailToId = new Map();
    pgProfilesRes.rows.forEach(p => pgEmailToId.set(p.email.toLowerCase(), p.id));

    // ============================================
    // ÉTAPE 5: Migrer token_master → rewards
    // ============================================
    console.log('[5/6] Migration des récompenses (token_master)...');

    const [tokenMaster] = await mysqlConn.query('SELECT * FROM token_master');
    console.log(`  → ${tokenMaster.length} conversions à migrer`);

    let rewardsMigrated = 0;
    for (const token of tokenMaster) {
      try {
        // Trouver le profile_id
        let profileId = userMapping.get(token.user_id);
        if (!profileId) {
          const email = mysqlEmailToId.get(token.user_id);
          if (email) {
            profileId = pgEmailToId.get(email);
          }
        }

        await pgClient.query(`
          INSERT INTO rewards (
            profile_id, tokens_used, amount_converted, status,
            converted_at, mysql_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [
          profileId,
          token.token_used,
          token.amount_converted,
          token.status?.toLowerCase() || 'pending',
          token.used_on || new Date(),
          token.id
        ]);
        rewardsMigrated++;
      } catch (err) {
        console.log(`  ⚠ Erreur reward ${token.id}: ${err.message}`);
      }
    }
    console.log(`  ✓ ${rewardsMigrated} récompenses migrées\n`);

    // ============================================
    // ÉTAPE 6: Migrer support_master → support_tickets
    // ============================================
    console.log('[6/6] Migration des tickets support (support_master)...');

    const [supportMaster] = await mysqlConn.query('SELECT * FROM support_master');
    console.log(`  → ${supportMaster.length} tickets à migrer`);

    let ticketsMigrated = 0;
    for (const ticket of supportMaster) {
      try {
        // Trouver le profile_id par email
        const profileId = pgEmailToId.get(ticket.from_email?.toLowerCase()) || null;

        await pgClient.query(`
          INSERT INTO support_tickets (
            profile_id, email, subject, content, status, mysql_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [
          profileId,
          ticket.from_email || 'unknown@tribe.sn',
          'Support Request #' + ticket.support_id,
          ticket.email_content || '',
          'resolved',  // Anciens tickets considérés comme résolus
          ticket.support_id
        ]);
        ticketsMigrated++;
      } catch (err) {
        console.log(`  ⚠ Erreur ticket ${ticket.support_id}: ${err.message}`);
      }
    }
    console.log(`  ✓ ${ticketsMigrated} tickets migrés\n`);

    // ============================================
    // Vérification finale
    // ============================================
    console.log('=== VÉRIFICATION FINALE ===\n');

    const tables = ['profiles', 'locations', 'rewards', 'support_tickets'];
    for (const table of tables) {
      const result = await pgClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} lignes`);
    }

    // Vérifier les horaires
    const withHours = await pgClient.query(`
      SELECT COUNT(*) as count FROM locations
      WHERE metadata->>'opening_hours' IS NOT NULL
    `);
    console.log(`  locations avec horaires: ${withHours.rows[0].count}`);

  } catch (error) {
    console.error('\nErreur fatale:', error);
    throw error;
  } finally {
    await mongoClient.close();
    if (mysqlConn) await mysqlConn.end();
    await pgClient.end();
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              MIGRATION COMPLÈTE TERMINÉE                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

migrateComplete()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
