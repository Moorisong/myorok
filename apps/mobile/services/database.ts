import * as SQLite from 'expo-sqlite';

const DB_NAME = 'myorok.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;

    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeTables();
    await ensureDefaultPet();

    return db;
}

async function initializeTables() {
    if (!db) return;

    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
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
      memo TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(petId, date)
    );

    CREATE TABLE IF NOT EXISTS food_records (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      date TEXT NOT NULL,
      foodType TEXT NOT NULL,
      preference TEXT NOT NULL,
      comment TEXT,
      createdAt TEXT NOT NULL
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

    CREATE TABLE IF NOT EXISTS hospital_records (
      id TEXT PRIMARY KEY,
      petId TEXT NOT NULL,
      date TEXT NOT NULL,
      memo TEXT,
      createdAt TEXT NOT NULL
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
  `);
}

async function ensureDefaultPet() {
    if (!db) return;

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

export async function getDefaultPetId(): Promise<string> {
    const database = await getDatabase();
    const pet = await database.getFirstAsync<{ id: string }>(
        'SELECT id FROM pets LIMIT 1'
    );
    return pet?.id || 'default-pet';
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
