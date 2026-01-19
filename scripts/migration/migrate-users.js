#!/usr/bin/env node
/**
 * Migration des utilisateurs et configurations TRIBE v1 -> v2
 *
 * Source: tribe (MySQL Azure) - user_master
 * Source: tribe-back-office (MySQL Azure) - achievement_configuration, gift_configuration, faq_configuration
 * Cible: PostgreSQL v2
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');

// Configuration MySQL Azure
const MYSQL_CONFIG = {
  host: 'd-tribe-mql.mysql.database.azure.com',
  port: 3306,
  user: 'admin_nysom',
  password: 'tribe2023!!',
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

async function syncUserPoints(mysqlConn, pgClient) {
  console.log('\n📊 Synchronizing user points...');

  // Get MySQL users with tokens
  const [mysqlUsers] = await mysqlConn.query(`
    SELECT user_id, email, token_avaliable, current_level
    FROM user_master
    WHERE (account_status = 'active' OR account_status IS NULL)
    AND token_avaliable > 0
  `);

  console.log(`Found ${mysqlUsers.length} MySQL users with tokens`);

  let synced = 0;
  let notFound = 0;

  for (const user of mysqlUsers) {
    // Find user in PostgreSQL
    const pgResult = await pgClient.query(
      'SELECT id, email, points FROM profiles WHERE LOWER(email) = LOWER($1)',
      [user.email]
    );

    if (pgResult.rows.length > 0) {
      const pgUser = pgResult.rows[0];

      // Update points if MySQL has more (take the higher value)
      if (user.token_avaliable > pgUser.points) {
        await pgClient.query(
          'UPDATE profiles SET points = $1 WHERE id = $2',
          [user.token_avaliable, pgUser.id]
        );
        console.log(`  ✅ Updated ${user.email}: ${pgUser.points} -> ${user.token_avaliable} points`);
        synced++;
      } else {
        console.log(`  ⏭️ ${user.email}: PG points (${pgUser.points}) >= MySQL tokens (${user.token_avaliable})`);
      }
    } else {
      console.log(`  ⚠️ User not found in PostgreSQL: ${user.email}`);
      notFound++;
    }
  }

  console.log(`\n✅ Points sync complete: ${synced} updated, ${notFound} not found`);
}

async function migrateAchievements(mysqlConn, pgClient) {
  console.log('\n🏆 Migrating achievement configuration...');

  // Check if level_thresholds table exists
  const tableCheck = await pgClient.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'level_thresholds'
    );
  `);

  if (!tableCheck.rows[0].exists) {
    console.log('Creating level_thresholds table...');
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS level_thresholds (
        level INT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        min_points INT NOT NULL,
        description TEXT,
        gift_tokens INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  // Get achievements from MySQL
  const [achievements] = await mysqlConn.query(`
    SELECT achievement_id, achievement_name, achievement_description, level, no_of_tokens
    FROM achievement_configuration
    WHERE delete_status = 'NO'
    ORDER BY CAST(level AS UNSIGNED)
  `);

  // Build level thresholds from achievements
  const levelMap = {
    '1': { name: 'Beginner', min_points: 0, gift_tokens: 0 },
    '2': { name: 'Trainee', min_points: 50, gift_tokens: 100 },
    '3': { name: 'Amateur', min_points: 100, gift_tokens: 200 },
    '4': { name: 'Pro', min_points: 500, gift_tokens: 350 },
    '5': { name: 'Expert', min_points: 2000, gift_tokens: 500 }
  };

  // Insert level thresholds
  await pgClient.query('DELETE FROM level_thresholds');

  for (const [level, data] of Object.entries(levelMap)) {
    await pgClient.query(`
      INSERT INTO level_thresholds (level, name, min_points, gift_tokens, description)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (level) DO UPDATE SET
        name = EXCLUDED.name,
        min_points = EXCLUDED.min_points,
        gift_tokens = EXCLUDED.gift_tokens
    `, [level, data.name, data.min_points, data.gift_tokens, `Level ${level}: ${data.name}`]);
  }

  console.log(`✅ Migrated ${Object.keys(levelMap).length} level thresholds`);
}

async function migrateFAQs(mysqlConn, pgClient) {
  console.log('\n❓ Migrating FAQ configuration...');

  // Check if faqs table exists
  const tableCheck = await pgClient.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'faqs'
    );
  `);

  if (!tableCheck.rows[0].exists) {
    console.log('Creating faqs table...');
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question_en TEXT NOT NULL,
        answer_en TEXT NOT NULL,
        question_fr TEXT,
        answer_fr TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  // Get FAQs from MySQL
  const [faqs] = await mysqlConn.query(`
    SELECT id, english_question, english_answer, french_question, french_answer
    FROM faq_configuration
    ORDER BY id
  `);

  // Clear existing FAQs
  await pgClient.query('DELETE FROM faqs');

  for (const faq of faqs) {
    await pgClient.query(`
      INSERT INTO faqs (question_en, answer_en, question_fr, answer_fr, display_order)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      faq.english_question,
      faq.english_answer,
      faq.french_question,
      faq.french_answer,
      faq.id
    ]);
  }

  console.log(`✅ Migrated ${faqs.length} FAQs`);
}

async function updateUserLevels(pgClient) {
  console.log('\n📈 Updating user levels based on points...');

  // Update levels based on points thresholds
  const result = await pgClient.query(`
    UPDATE profiles p
    SET level = (
      SELECT COALESCE(
        (SELECT MAX(level) FROM level_thresholds WHERE min_points <= p.points),
        1
      )
    )
    WHERE EXISTS (SELECT 1 FROM level_thresholds)
    RETURNING id, email, points, level
  `);

  console.log(`✅ Updated levels for ${result.rowCount} users`);

  // Show some examples
  const examples = await pgClient.query(`
    SELECT email, points, level FROM profiles
    WHERE points > 0
    ORDER BY points DESC
    LIMIT 5
  `);

  if (examples.rows.length > 0) {
    console.log('\nTop users by points:');
    examples.rows.forEach(u => {
      console.log(`  ${u.email}: ${u.points} points, level ${u.level}`);
    });
  }
}

async function main() {
  console.log('🚀 Starting user migration from MySQL to PostgreSQL v2...\n');

  // Connect to MySQL (tribe database for users)
  const mysqlConn = await mysql.createConnection({
    ...MYSQL_CONFIG,
    database: 'tribe'
  });
  console.log('✅ Connected to MySQL (tribe)');

  // Connect to MySQL (backoffice for configurations)
  const mysqlBackoffice = await mysql.createConnection({
    ...MYSQL_CONFIG,
    database: 'tribe-back-office'
  });
  console.log('✅ Connected to MySQL (tribe-back-office)');

  // Connect to PostgreSQL
  const pgClient = new Client(PG_CONFIG);
  await pgClient.connect();
  console.log('✅ Connected to PostgreSQL');

  try {
    // 1. Sync user points
    await syncUserPoints(mysqlConn, pgClient);

    // 2. Migrate level/achievement configuration
    await migrateAchievements(mysqlBackoffice, pgClient);

    // 3. Migrate FAQs
    await migrateFAQs(mysqlBackoffice, pgClient);

    // 4. Update user levels based on points
    await updateUserLevels(pgClient);

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await mysqlConn.end();
    await mysqlBackoffice.end();
    await pgClient.end();
  }
}

main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
