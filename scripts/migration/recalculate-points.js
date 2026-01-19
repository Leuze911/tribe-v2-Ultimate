#!/usr/bin/env node
/**
 * Script de Recalcul des Points et Niveaux TRIBE v2
 *
 * Recalcule les points basés sur les locations validées
 * et ajuste les niveaux en conséquence.
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

// Système de niveaux TRIBE v2
const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0, name: 'Débutant' },
  { level: 2, minPoints: 100, name: 'Explorateur' },
  { level: 3, minPoints: 300, name: 'Cartographe' },
  { level: 4, minPoints: 600, name: 'Expert' },
  { level: 5, minPoints: 1000, name: 'Maître' },
  { level: 6, minPoints: 2000, name: 'Légende' }
];

function calculateLevel(points) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].minPoints) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

async function recalculate() {
  validateEnv();
  console.log('=== Recalcul des Points et Niveaux TRIBE v2 ===\n');

  const client = new Client(PG_CONFIG);
  await client.connect();

  try {
    // État avant recalcul
    console.log('[1/4] État actuel:');
    const before = await client.query(`
      SELECT
        SUM(points) as total_points,
        AVG(points)::integer as avg_points,
        MAX(level) as max_level
      FROM profiles
    `);
    console.log(`  Total points: ${before.rows[0].total_points || 0}`);
    console.log(`  Moyenne: ${before.rows[0].avg_points || 0} pts/user`);
    console.log(`  Niveau max: ${before.rows[0].max_level || 1}\n`);

    // Recalcul des points basé sur les locations validées
    console.log('[2/4] Recalcul des points (10 pts/location validée + bonus)...');
    await client.query(`
      UPDATE profiles p
      SET points = COALESCE((
        SELECT SUM(
          CASE
            WHEN l.points_awarded > 0 THEN l.points_awarded
            ELSE 10  -- Points de base par location
          END
        )
        FROM locations l
        WHERE l.collector_id = p.id
        AND l.status = 'validated'
      ), 0)
    `);

    const pointsResult = await client.query(`
      SELECT COUNT(*) as updated FROM profiles WHERE points > 0
    `);
    console.log(`  ✓ ${pointsResult.rows[0].updated} profils mis à jour\n`);

    // Recalcul des niveaux
    console.log('[3/4] Recalcul des niveaux...');
    await client.query(`
      UPDATE profiles
      SET level = CASE
        WHEN points >= 2000 THEN 6
        WHEN points >= 1000 THEN 5
        WHEN points >= 600 THEN 4
        WHEN points >= 300 THEN 3
        WHEN points >= 100 THEN 2
        ELSE 1
      END
    `);

    const levelStats = await client.query(`
      SELECT level, COUNT(*) as count
      FROM profiles
      GROUP BY level
      ORDER BY level
    `);
    console.log('  Répartition par niveau:');
    levelStats.rows.forEach(row => {
      const levelInfo = LEVEL_THRESHOLDS.find(l => l.level === row.level);
      console.log(`    Niveau ${row.level} (${levelInfo?.name || '?'}): ${row.count} utilisateurs`);
    });
    console.log('');

    // État après recalcul
    console.log('[4/4] Nouvel état:');
    const after = await client.query(`
      SELECT
        SUM(points) as total_points,
        AVG(points)::integer as avg_points,
        MAX(level) as max_level,
        (SELECT full_name FROM profiles ORDER BY points DESC LIMIT 1) as top_user,
        (SELECT points FROM profiles ORDER BY points DESC LIMIT 1) as top_points
      FROM profiles
    `);
    console.log(`  Total points: ${after.rows[0].total_points || 0}`);
    console.log(`  Moyenne: ${after.rows[0].avg_points || 0} pts/user`);
    console.log(`  Niveau max: ${after.rows[0].max_level || 1}`);
    console.log(`  Top contributeur: ${after.rows[0].top_user} (${after.rows[0].top_points} pts)`);

    console.log('\n=== Recalcul terminé ===');

  } finally {
    await client.end();
  }
}

recalculate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
