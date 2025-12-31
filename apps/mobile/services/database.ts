import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runMigrations as runMigrationSystem } from './migrations/migrationManager';
import { migrations } from './migrations/migrations';

const DB_NAME = 'myorok.db';
const SELECTED_PET_KEY = 'selected_pet_id';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeTables(db);
    // Use new migration system
    await runMigrationSystem(db, migrations, DB_NAME, {
      createBackup: true,
      useTransaction: true,
      onProgress: (current, total, name) => {
        console.log(`Running migration ${current}/${total}: ${name}`);
      },
    });
    // Keep legacy migrations for backward compatibility
    await runLegacyMigrations(db);
    await ensureDefaultPet(db);
    dbInstance = db;
    return db;
  })();

  return dbPromise;
}

async function initializeTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_records (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      date TEXT NOT NULL,
      peeCount INTEGER DEFAULT 0,
      poopCount INTEGER DEFAULT 0,
      diarrheaCount INTEGER DEFAULT 0,
      vomitCount INTEGER DEFAULT 0,
      vomitTypes TEXT,
      waterIntake INTEGER DEFAULT 0,
      memo TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(petId, date)
    );



    CREATE TABLE IF NOT EXISTS supplements (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplement_records (
      id TEXT PRIMARY KEY,
      supplementId TEXT NOT NULL,
      date TEXT NOT NULL,
      taken INTEGER NOT NULL DEFAULT 0
    );



    CREATE TABLE IF NOT EXISTS custom_metrics (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      name TEXT NOT NULL,
      unit TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_metric_records (
      id TEXT PRIMARY KEY,
      metricId TEXT NOT NULL,
      date TEXT NOT NULL,
      value REAL NOT NULL,
      memo TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fluid_records (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      date TEXT NOT NULL,
      fluidType TEXT NOT NULL,
      volume INTEGER,
      memo TEXT,
      createdAt TEXT NOT NULL
    );



    CREATE TABLE IF NOT EXISTS medication_memos (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      medicationName TEXT NOT NULL,
      memo TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS food_preference_memos (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      foodName TEXT NOT NULL,
      foodType TEXT NOT NULL,
      memo TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS subscription_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      trialStartDate TEXT NOT NULL,
      subscriptionStatus TEXT NOT NULL,
      subscriptionStartDate TEXT,
      subscriptionExpiryDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

/**
 * Legacy migration function for backward compatibility
 * These migrations were added before the migration system was implemented
 * They are kept to ensure existing databases are updated correctly
 */
async function runLegacyMigrations(db: SQLite.SQLiteDatabase) {
  try {
    // Check if waterIntake column exists in daily_records
    const tableInfo = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(daily_records)`
    );

    const hasWaterIntake = tableInfo.some(col => col.name === 'waterIntake');

    if (!hasWaterIntake) {
      console.log('Adding waterIntake column to daily_records table...');
      await db.execAsync(`
        ALTER TABLE daily_records ADD COLUMN waterIntake INTEGER DEFAULT 0;
      `);
      console.log('waterIntake column added successfully');
    }

    // Check if deletedAt column exists in supplements
    const supplementsInfo = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(supplements)`
    );

    const hasSupplementsDeletedAt = supplementsInfo.some(col => col.name === 'deletedAt');

    if (!hasSupplementsDeletedAt) {
      console.log('Adding deletedAt column to supplements table...');
      await db.execAsync(`
        ALTER TABLE supplements ADD COLUMN deletedAt TEXT;
      `);
      console.log('deletedAt column added successfully');
    }

    // Check if deletedAt column exists in pets
    const petsInfo = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(pets)`
    );

    const hasPetsDeletedAt = petsInfo.some(col => col.name === 'deletedAt');

    if (!hasPetsDeletedAt) {
      console.log('Adding deletedAt column to pets table...');
      await db.execAsync(`
        ALTER TABLE pets ADD COLUMN deletedAt TEXT;
      `);
      console.log('deletedAt column added to pets successfully');
    }
  } catch (error) {
    console.error('Legacy migration error:', error);
  }
}


async function ensureDefaultPet(db: SQLite.SQLiteDatabase) {

  const pet = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM pets LIMIT 1'
  );

  if (!pet) {
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO pets (id, name, createdAt) VALUES (?, ?, ?)',
      ['default-pet', '우리 고양이', now]
    );
  }
}

export async function getSelectedPetId(): Promise<string> {
  // Try to get from AsyncStorage first
  const storedPetId = await AsyncStorage.getItem(SELECTED_PET_KEY);
  if (storedPetId) {
    return storedPetId;
  }

  // If not stored, get first available pet
  const database = await getDatabase();
  const pet = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM pets WHERE deletedAt IS NULL LIMIT 1'
  );

  const petId = pet?.id || 'default-pet';

  // Store for future use
  await AsyncStorage.setItem(SELECTED_PET_KEY, petId);

  return petId;
}

export async function setSelectedPetId(petId: string): Promise<void> {
  await AsyncStorage.setItem(SELECTED_PET_KEY, petId);
}

// Deprecated: Use getSelectedPetId instead
export async function getDefaultPetId(): Promise<string> {
  return getSelectedPetId();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
