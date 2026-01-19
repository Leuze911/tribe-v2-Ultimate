#!/usr/bin/env node
/**
 * Script d'exploration MongoDB Atlas
 * Découvre les bases de données, collections et structure des données
 */

const { MongoClient } = require('mongodb');

// Configuration (REQUIRED: set MONGO_URI environment variable)
const MONGO_URI = process.env.MONGO_URI;

// Validate required environment variables
function validateEnv() {
  if (!MONGO_URI) {
    console.error('❌ Missing required environment variable: MONGO_URI');
    console.error('\nPlease set MONGO_URI or create a .env file.');
    console.error('See .env.migration.example for reference.');
    process.exit(1);
  }
}

async function explore() {
  validateEnv();
  console.log('=== Exploration MongoDB Atlas ===\n');

  const client = new MongoClient(MONGO_URI);

  try {
    console.log('[1] Connexion à MongoDB Atlas...');
    await client.connect();
    console.log('  ✓ Connecté!\n');

    const db = client.db('Cluster0');
    const collection = db.collection('locationEntity');

    // Compter les documents
    const total = await collection.countDocuments();
    console.log(`[2] Total documents: ${total}\n`);

    // Afficher quelques exemples
    console.log('[3] Exemples de documents:');
    const samples = await collection.find().limit(5).toArray();
    samples.forEach((doc, i) => {
      console.log(`\n--- Document ${i + 1} ---`);
      console.log(JSON.stringify(doc, null, 2));
    });

    // Statistiques sur les statuts
    console.log('\n\n[4] Statistiques par statut:');
    const statusStats = await collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    statusStats.forEach(s => console.log(`  ${s._id || 'null'}: ${s.count}`));

    // Statistiques sur les types
    console.log('\n[5] Statistiques par type (locationType):');
    const typeStats = await collection.aggregate([
      { $group: { _id: '$locationType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    typeStats.forEach(t => console.log(`  ${t._id || 'null'}: ${t.count}`));

    // Compter les documents avec coordonnées valides
    const withCoords = await collection.countDocuments({
      latitude: { $ne: null },
      longitude: { $ne: null }
    });
    console.log(`\n[6] Documents avec coordonnées: ${withCoords}/${total}`);

    // Compter les documents avec uploads
    const withUploads = await collection.countDocuments({
      uploads: { $exists: true, $ne: [], $ne: null }
    });
    console.log(`[7] Documents avec photos: ${withUploads}/${total}`);

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await client.close();
  }
}

explore();
