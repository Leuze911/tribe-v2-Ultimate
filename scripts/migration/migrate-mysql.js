#!/usr/bin/env node
/**
 * Script de Migration MySQL Azure -> PostgreSQL TRIBE v2
 *
 * Source: tribe.user_master (MySQL Azure)
 * Cible: TRIBE v2 PostgreSQL profiles table
 */

const mysql = require('mysql2/promise');
const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Configuration MySQL Azure
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'd-tribe-mql.mysql.database.azure.com',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'admin_nysom',
  password: process.env.MYSQL_PASSWORD || 'tribe2023!!',
  database: 'tribe',
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

// Mapping MySQL user_id -> PostgreSQL UUID
const userIdMapping = new Map();

async function migrate() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Migration MySQL Azure -> PostgreSQL TRIBE v2                ║');
  console.log('║  Source: tribe.user_master (79 users)                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let mysqlConnection;
  const pgClient = new Client(PG_CONFIG);

  let stats = { migrated: 0, skipped: 0, errors: 0 };

  try {
    // Connexions
    console.log('[1/5] Connexion à MySQL Azure...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('  ✓ Connecté à MySQL\n');

    console.log('[2/5] Connexion à PostgreSQL v2...');
    await pgClient.connect();
    console.log('  ✓ Connecté à PostgreSQL\n');

    // Récupérer les emails existants pour éviter les doublons
    console.log('[3/5] Vérification des profils existants...');
    const pgProfiles = await pgClient.query('SELECT id, email FROM profiles');
    const existingEmails = new Set(pgProfiles.rows.map(p => p.email.toLowerCase()));
    console.log(`  ✓ ${pgProfiles.rows.length} profils existants\n`);

    // Récupérer les utilisateurs MySQL (seulement les actifs)
    console.log('[4/5] Migration des utilisateurs...');
    const [mysqlUsers] = await mysqlConnection.query(`
      SELECT user_id, email, password, first_name, last_name, name,
             phone_number, phone_number1, phone_number2, role, image_name,
             token_allocated, token_avaliable, token_used, current_level,
             account_status, created_on
      FROM user_master
      WHERE account_status != 'deleted' OR account_status IS NULL
    `);
    console.log(`  → ${mysqlUsers.length} utilisateurs à migrer\n`);

    for (const user of mysqlUsers) {
      try {
        const email = (user.email || '').toLowerCase().trim();

        if (!email || !email.includes('@')) {
          console.log(`  ⚠ Skip: ID ${user.user_id} - email invalide`);
          stats.skipped++;
          continue;
        }

        if (existingEmails.has(email)) {
          console.log(`  ⚠ Skip: ${email} - déjà existant`);
          stats.skipped++;
          continue;
        }

        // Construire le nom complet
        let fullName = '';
        if (user.first_name && user.last_name) {
          fullName = `${user.first_name} ${user.last_name}`.trim();
        } else if (user.name) {
          fullName = user.name;
        } else if (user.first_name) {
          fullName = user.first_name;
        } else {
          fullName = email.split('@')[0];
        }

        // Téléphone (prendre le premier disponible)
        const phone = user.phone_number || user.phone_number1 || user.phone_number2 || '';

        // Générer un nouveau mot de passe hashé
        // Les anciens mots de passe semblent être chiffrés (pas hashés), on ne peut pas les migrer
        const defaultPassword = 'TribeUser2024!';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Calculer les points (token_used * 5 comme approximation)
        const points = (user.token_used || 0) * 5;

        // Niveau (mapper vers notre système)
        const level = Math.max(1, user.current_level || 1);

        // Rôle (tous sont collectors dans l'ancien système)
        const role = 'collector';

        // Créer un nouvel UUID
        const newId = uuidv4();
        userIdMapping.set(user.user_id, newId);

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

        const values = [
          newId,
          email,
          passwordHash,
          fullName,
          phone,
          user.image_name || '',
          role,
          points,
          level,
          user.account_status === 'active' || user.account_status === null,
          user.created_on || new Date(),
          new Date()
        ];

        await pgClient.query(insertQuery, values);
        existingEmails.add(email);
        stats.migrated++;

        if (stats.migrated % 20 === 0) {
          console.log(`  ... ${stats.migrated} utilisateurs migrés`);
        }
      } catch (err) {
        console.log(`  ✗ Erreur: ${user.email || user.user_id} - ${err.message}`);
        stats.errors++;
      }
    }

    console.log(`\n  ✓ Migration terminée: ${stats.migrated} migrés, ${stats.skipped} ignorés, ${stats.errors} erreurs\n`);

    // Sauvegarder le mapping
    const fs = require('fs');
    const mappingData = Array.from(userIdMapping.entries())
      .map(([mysqlId, pgId]) => ({ mysql_id: mysqlId, pg_id: pgId }));
    fs.writeFileSync('user_id_mapping.json', JSON.stringify(mappingData, null, 2));
    console.log(`[5/5] Mapping sauvegardé: user_id_mapping.json (${mappingData.length} entrées)\n`);

    // Statistiques finales
    console.log('=== Statistiques PostgreSQL ===');
    const countResult = await pgClient.query('SELECT COUNT(*) as count FROM profiles');
    console.log(`Total profils: ${countResult.rows[0].count}`);

    const roleStats = await pgClient.query(`
      SELECT role, COUNT(*) as count
      FROM profiles
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('\nPar rôle:');
    roleStats.rows.forEach(row => console.log(`  ${row.role}: ${row.count}`));

  } catch (error) {
    console.error('\nErreur fatale:', error);
    throw error;
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    await pgClient.end();
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   MIGRATION TERMINÉE                         ║');
  console.log('║                                                              ║');
  console.log('║  NOTE: Les mots de passe ont été réinitialisés à:            ║');
  console.log('║        TribeUser2024!                                        ║');
  console.log('║  Les utilisateurs devront changer leur mot de passe.         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  return stats;
}

module.exports = { migrate, userIdMapping };

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
