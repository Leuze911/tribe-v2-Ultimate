#!/usr/bin/env node
/**
 * Script de Vérification Post-Migration TRIBE v2
 *
 * Vérifie l'intégrité des données après migration
 */

const { Client } = require('pg');

// Configuration PostgreSQL (REQUIRED: set PG_PASSWORD environment variable)
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5433'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'tribe'
};

// Validate required environment variables
function validateEnv() {
  if (!PG_CONFIG.password) {
    console.error('❌ Missing required environment variable: PG_PASSWORD');
    console.error('\nPlease set PG_PASSWORD or create a .env file.');
    console.error('See .env.migration.example for reference.');
    process.exit(1);
  }
}

async function verify() {
  validateEnv();
  console.log('=== Vérification Post-Migration TRIBE v2 ===\n');

  const client = new Client(PG_CONFIG);
  await client.connect();

  try {
    // 1. Comptages globaux
    console.log('[1/5] Comptages globaux:');
    const counts = await client.query(`
      SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
      UNION ALL SELECT 'locations', COUNT(*) FROM locations
      UNION ALL SELECT 'locations_validated', COUNT(*) FROM locations WHERE status = 'validated'
      UNION ALL SELECT 'locations_pending', COUNT(*) FROM locations WHERE status = 'pending'
      UNION ALL SELECT 'locations_rejected', COUNT(*) FROM locations WHERE status = 'rejected'
    `);
    counts.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.count}`);
    });

    // 2. Répartition par rôle
    console.log('\n[2/5] Répartition des profils par rôle:');
    const roles = await client.query(`
      SELECT role, COUNT(*) as count
      FROM profiles
      GROUP BY role
      ORDER BY count DESC
    `);
    roles.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });

    // 3. Répartition par catégorie
    console.log('\n[3/5] Répartition des locations par catégorie:');
    const categories = await client.query(`
      SELECT category, COUNT(*) as count
      FROM locations
      GROUP BY category
      ORDER BY count DESC
    `);
    categories.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count}`);
    });

    // 4. Vérification intégrité (orphelins)
    console.log('\n[4/5] Vérification d\'intégrité:');

    const orphanLocations = await client.query(`
      SELECT COUNT(*) as count
      FROM locations l
      LEFT JOIN profiles p ON l.collector_id = p.id
      WHERE l.collector_id IS NOT NULL AND p.id IS NULL
    `);
    const orphanCount = parseInt(orphanLocations.rows[0].count);
    if (orphanCount > 0) {
      console.log(`  ⚠ Locations orphelines (collector_id invalide): ${orphanCount}`);
    } else {
      console.log(`  ✓ Aucune location orpheline`);
    }

    const nullEmails = await client.query(`
      SELECT COUNT(*) as count FROM profiles WHERE email IS NULL OR email = ''
    `);
    if (parseInt(nullEmails.rows[0].count) > 0) {
      console.log(`  ⚠ Profils sans email: ${nullEmails.rows[0].count}`);
    } else {
      console.log(`  ✓ Tous les profils ont un email`);
    }

    const invalidCoords = await client.query(`
      SELECT COUNT(*) as count FROM locations
      WHERE latitude IS NULL OR longitude IS NULL
         OR latitude < -90 OR latitude > 90
         OR longitude < -180 OR longitude > 180
    `);
    if (parseInt(invalidCoords.rows[0].count) > 0) {
      console.log(`  ⚠ Locations avec coordonnées invalides: ${invalidCoords.rows[0].count}`);
    } else {
      console.log(`  ✓ Toutes les coordonnées sont valides`);
    }

    // 5. Top contributeurs
    console.log('\n[5/5] Top 10 contributeurs:');
    const topContributors = await client.query(`
      SELECT
        p.full_name,
        p.email,
        p.points,
        p.level,
        COUNT(l.id) as locations_count
      FROM profiles p
      LEFT JOIN locations l ON l.collector_id = p.id AND l.status = 'validated'
      GROUP BY p.id, p.full_name, p.email, p.points, p.level
      ORDER BY locations_count DESC
      LIMIT 10
    `);
    topContributors.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.full_name || row.email}: ${row.locations_count} locations, ${row.points} pts (Lvl ${row.level})`);
    });

    console.log('\n=== Vérification terminée ===');

  } finally {
    await client.end();
  }
}

verify()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
