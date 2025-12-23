/**
 * Script de Migration MySQL Azure -> PostgreSQL TRIBE v2
 *
 * Source: tribe-admin-service & tribe-backoffice-service (MySQL Azure)
 * Cible: TRIBE v2 PostgreSQL (port 5433)
 *
 * Usage:
 *   1. Installer les dépendances: npm install mysql2 pg uuid bcrypt
 *   2. Configurer les variables d'environnement ou modifier ce fichier
 *   3. Exécuter: node migrate-mysql.js
 *
 * IMPORTANT: Les mots de passe dans l'ancienne base sont en clair (selon l'audit).
 * Ce script les hashera avec bcrypt avant insertion dans v2.
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Configuration MySQL (Source - tribe-admin-service / tribe-backoffice-service)
// ATTENTION: Ces credentials sont compromis selon l'audit - à régénérer après migration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'tribe-mysql-server.mysql.database.azure.com',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'tribe_admin',
  password: process.env.MYSQL_PASSWORD || 'tribe2023!!',
  database: process.env.MYSQL_DATABASE || 'tribe_db',
  ssl: {
    rejectUnauthorized: false // Azure MySQL nécessite SSL
  }
};

// Configuration PostgreSQL (Cible - TRIBE v2)
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5433'),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'tribe_super_secret_2024',
  database: process.env.PG_DATABASE || 'tribe'
};

// Mapping des rôles MySQL -> PostgreSQL
const ROLE_MAPPING = {
  'ADMIN': 'admin',
  'ADMINISTRATOR': 'admin',
  'SUPER_ADMIN': 'admin',
  'VALIDATOR': 'validator',
  'MODERATOR': 'validator',
  'USER': 'collector',
  'COLLECTOR': 'collector',
  'BASIC': 'collector'
};

// Mapping des IDs MySQL -> PostgreSQL UUID
const userIdMapping = new Map();

async function migrate() {
  console.log('=== Migration MySQL Azure -> PostgreSQL TRIBE v2 ===\n');

  let mysqlConnection;
  const pgClient = new Client(PG_CONFIG);

  try {
    // Connexion aux bases
    console.log('[1/7] Connexion à MySQL Azure...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('  ✓ Connecté à MySQL\n');

    console.log('[2/7] Connexion à PostgreSQL v2...');
    await pgClient.connect();
    console.log('  ✓ Connecté à PostgreSQL\n');

    // Découvrir les tables disponibles
    console.log('[3/7] Découverte des tables MySQL...');
    const [tables] = await mysqlConnection.query('SHOW TABLES');
    console.log('  Tables trouvées:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`    - ${tableName}`);
    });
    console.log('');

    // Récupérer les utilisateurs depuis MySQL
    // Essayer différents noms de tables possibles
    console.log('[4/7] Extraction des utilisateurs MySQL...');
    let mysqlUsers = [];

    const possibleUserTables = ['users', 'user', 'accounts', 'profiles', 'members', 'collectors'];
    for (const tableName of possibleUserTables) {
      try {
        const [rows] = await mysqlConnection.query(`SELECT * FROM ${tableName}`);
        if (rows.length > 0) {
          mysqlUsers = rows;
          console.log(`  ✓ ${rows.length} utilisateurs trouvés dans table '${tableName}'\n`);
          break;
        }
      } catch (err) {
        // Table n'existe pas, continuer
      }
    }

    if (mysqlUsers.length === 0) {
      console.log('  ⚠ Aucune table utilisateurs trouvée. Essayez de spécifier la table manuellement.\n');
    }

    // Récupérer les emails existants dans PostgreSQL pour éviter les doublons
    console.log('[5/7] Vérification des profils existants dans v2...');
    const pgProfiles = await pgClient.query('SELECT id, email FROM profiles');
    const existingEmails = new Set(pgProfiles.rows.map(p => p.email.toLowerCase()));
    console.log(`  ✓ ${pgProfiles.rows.length} profils existants dans v2\n`);

    // Migration des utilisateurs
    console.log('[6/7] Migration des utilisateurs...');
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const mysqlUser of mysqlUsers) {
      try {
        // Identifier les champs (noms variés possibles)
        const email = (mysqlUser.email || mysqlUser.mail || mysqlUser.user_email || '').toLowerCase().trim();
        const password = mysqlUser.password || mysqlUser.pwd || mysqlUser.pass || mysqlUser.motDePasse || '';
        const fullName = mysqlUser.full_name || mysqlUser.fullName || mysqlUser.name ||
                        mysqlUser.nom || `${mysqlUser.first_name || ''} ${mysqlUser.last_name || ''}`.trim() ||
                        mysqlUser.prenom && mysqlUser.nom ? `${mysqlUser.prenom} ${mysqlUser.nom}` : '';
        const phone = mysqlUser.phone || mysqlUser.telephone || mysqlUser.tel || mysqlUser.mobile || '';
        const avatarUrl = mysqlUser.avatar_url || mysqlUser.avatar || mysqlUser.photo || mysqlUser.image || '';
        const role = mysqlUser.role || mysqlUser.user_role || mysqlUser.type || 'USER';
        const points = parseInt(mysqlUser.points || mysqlUser.score || '0') || 0;
        const level = parseInt(mysqlUser.level || mysqlUser.niveau || '1') || 1;
        const isActive = mysqlUser.is_active !== undefined ? Boolean(mysqlUser.is_active) :
                        mysqlUser.active !== undefined ? Boolean(mysqlUser.active) :
                        mysqlUser.enabled !== undefined ? Boolean(mysqlUser.enabled) : true;

        if (!email) {
          console.log(`  ⚠ Skipping user sans email: ID ${mysqlUser.id}`);
          skipped++;
          continue;
        }

        // Vérifier si l'email existe déjà
        if (existingEmails.has(email)) {
          console.log(`  ⚠ Email déjà existant: ${email}`);
          skipped++;
          continue;
        }

        // Hasher le mot de passe (l'ancien était en clair selon l'audit)
        let passwordHash;
        if (password && !password.startsWith('$2')) {
          // Mot de passe en clair -> hasher
          passwordHash = await bcrypt.hash(password, 10);
        } else if (password.startsWith('$2')) {
          // Déjà hashé (bcrypt)
          passwordHash = password;
        } else {
          // Pas de mot de passe -> générer un temporaire
          passwordHash = await bcrypt.hash('ChangerMoi2024!', 10);
        }

        // Mapper le rôle
        const mappedRole = ROLE_MAPPING[role.toUpperCase()] || 'collector';

        // Créer un nouvel UUID pour PostgreSQL
        const newId = uuidv4();
        userIdMapping.set(mysqlUser.id, newId);

        // Insérer dans PostgreSQL
        const insertQuery = `
          INSERT INTO profiles (
            id, email, password_hash, full_name, phone,
            avatar_url, role, points, level, is_active,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12
          )
          ON CONFLICT (email) DO NOTHING
        `;

        const createdAt = mysqlUser.created_at || mysqlUser.createdAt ||
                         mysqlUser.date_creation || mysqlUser.registration_date || new Date();
        const updatedAt = mysqlUser.updated_at || mysqlUser.updatedAt ||
                         mysqlUser.date_modification || createdAt;

        const values = [
          newId,
          email,
          passwordHash,
          fullName || email.split('@')[0],
          phone,
          avatarUrl,
          mappedRole,
          points,
          level,
          isActive,
          createdAt,
          updatedAt
        ];

        await pgClient.query(insertQuery, values);
        existingEmails.add(email);
        migrated++;

        if (migrated % 50 === 0) {
          console.log(`  ... ${migrated} utilisateurs migrés`);
        }
      } catch (err) {
        console.log(`  ✗ Erreur pour user ${mysqlUser.email || mysqlUser.id}: ${err.message}`);
        errors++;
      }
    }

    console.log(`  ✓ Migration terminée: ${migrated} migrés, ${skipped} ignorés, ${errors} erreurs\n`);

    // Sauvegarder le mapping des IDs pour les locations
    console.log('[7/7] Sauvegarde du mapping des IDs...');
    const mappingData = Array.from(userIdMapping.entries())
      .map(([mysqlId, pgId]) => ({ mysql_id: mysqlId, pg_id: pgId }));

    if (mappingData.length > 0) {
      const fs = require('fs');
      fs.writeFileSync(
        'user_id_mapping.json',
        JSON.stringify(mappingData, null, 2)
      );
      console.log(`  ✓ Mapping sauvegardé dans user_id_mapping.json (${mappingData.length} entrées)\n`);
    }

    // Statistiques finales
    console.log('=== Statistiques ===');
    const countResult = await pgClient.query('SELECT COUNT(*) as count FROM profiles');
    console.log(`Total profils dans v2: ${countResult.rows[0].count}`);

    const roleStats = await pgClient.query(`
      SELECT role, COUNT(*) as count
      FROM profiles
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('\nRépartition par rôle:');
    roleStats.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });

  } catch (error) {
    console.error('Erreur de migration:', error);
    throw error;
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    await pgClient.end();
  }

  console.log('\n=== Migration MySQL terminée ===');
}

// Export pour usage en module
module.exports = { migrate, userIdMapping };

// Exécution directe
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
