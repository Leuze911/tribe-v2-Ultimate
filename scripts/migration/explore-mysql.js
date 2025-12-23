#!/usr/bin/env node
/**
 * Script d'exploration MySQL Azure
 */

const mysql = require('mysql2/promise');

const MYSQL_CONFIG = {
  host: 'd-tribe-mql.mysql.database.azure.com',
  port: 3306,
  user: 'admin_nysom',
  password: 'tribe2023!!',
  database: 'tribe',
  ssl: { rejectUnauthorized: false },
  connectTimeout: 30000
};

async function explore() {
  console.log('=== Exploration MySQL Azure - Base tribe ===\n');

  const connection = await mysql.createConnection(MYSQL_CONFIG);

  try {
    // Structure de user_master
    console.log('[1] Structure de user_master:');
    const [columns] = await connection.query('DESCRIBE user_master');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
    });

    // Compter les utilisateurs
    console.log('\n[2] Statistiques:');
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM user_master');
    console.log(`  Total utilisateurs: ${countResult[0].total}`);

    // Statistiques par rôle
    const [roleStats] = await connection.query(`
      SELECT role, COUNT(*) as count
      FROM user_master
      GROUP BY role
      ORDER BY count DESC
    `);
    console.log('\n  Par rôle:');
    roleStats.forEach(r => console.log(`    ${r.role || 'null'}: ${r.count}`));

    // Statistiques par statut
    const [statusStats] = await connection.query(`
      SELECT account_status, COUNT(*) as count
      FROM user_master
      GROUP BY account_status
    `);
    console.log('\n  Par statut:');
    statusStats.forEach(s => console.log(`    ${s.account_status || 'null'}: ${s.count}`));

    // Statistiques par niveau
    const [levelStats] = await connection.query(`
      SELECT current_level, COUNT(*) as count
      FROM user_master
      GROUP BY current_level
      ORDER BY current_level
    `);
    console.log('\n  Par niveau:');
    levelStats.forEach(l => console.log(`    Niveau ${l.current_level || 0}: ${l.count}`));

    // Exemples complets
    console.log('\n[3] Exemples d\'utilisateurs (5 premiers):');
    const [users] = await connection.query(`
      SELECT user_id, email, first_name, last_name, name, phone_number, role,
             token_allocated, token_avaliable, token_used, current_level, account_status, created_on
      FROM user_master
      LIMIT 5
    `);
    users.forEach((user, i) => {
      console.log(`\n  [${i+1}] ID: ${user.user_id}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Nom: ${user.first_name || ''} ${user.last_name || ''} (name: ${user.name || ''})`);
      console.log(`      Téléphone: ${user.phone_number || '-'}`);
      console.log(`      Rôle: ${user.role || '-'}`);
      console.log(`      Tokens: allocated=${user.token_allocated || 0}, available=${user.token_avaliable || 0}, used=${user.token_used || 0}`);
      console.log(`      Niveau: ${user.current_level || 1}`);
      console.log(`      Statut: ${user.account_status || '-'}`);
      console.log(`      Créé le: ${user.created_on}`);
    });

    // Token conversions
    console.log('\n\n[4] Token conversions (token_master):');
    const [tokens] = await connection.query('SELECT * FROM token_master LIMIT 5');
    tokens.forEach((t, i) => {
      console.log(`  [${i+1}] User ${t.user_id}: ${t.token_used} tokens -> ${t.amount_converted} (${t.status})`);
    });

  } finally {
    await connection.end();
  }
}

explore().catch(console.error);
