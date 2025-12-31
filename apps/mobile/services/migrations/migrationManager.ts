import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Migration,
  MigrationRecord,
  MigrationResult,
  MigrationOptions,
} from './types';

const SCHEMA_MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Initializes the schema_migrations table if it doesn't exist
 */
async function initializeSchemaMigrationsTable(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRATIONS_TABLE} (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      appliedAt TEXT NOT NULL,
      checksum TEXT
    );
  `);
}

/**
 * Gets the current database version
 * Returns 0 if no migrations have been applied
 */
async function getCurrentVersion(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      `SELECT MAX(version) as version FROM ${SCHEMA_MIGRATIONS_TABLE}`
    );
    return result?.version || 0;
  } catch (error) {
    console.error('Error getting current version:', error);
    return 0;
  }
}

/**
 * Gets all applied migration records
 */
async function getAppliedMigrations(
  db: SQLite.SQLiteDatabase
): Promise<MigrationRecord[]> {
  try {
    const records = await db.getAllAsync<MigrationRecord>(
      `SELECT * FROM ${SCHEMA_MIGRATIONS_TABLE} ORDER BY version ASC`
    );
    return records;
  } catch (error) {
    console.error('Error getting applied migrations:', error);
    return [];
  }
}

/**
 * Records a migration as applied
 */
async function recordMigration(
  db: SQLite.SQLiteDatabase,
  migration: Migration
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO ${SCHEMA_MIGRATIONS_TABLE} (version, name, appliedAt)
     VALUES (?, ?, ?)`,
    [migration.version, migration.name, now]
  );
}

/**
 * Removes a migration record (used for rollback)
 */
async function removeMigrationRecord(
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  await db.runAsync(
    `DELETE FROM ${SCHEMA_MIGRATIONS_TABLE} WHERE version = ?`,
    [version]
  );
}

/**
 * Creates a backup of the database file
 * Returns the backup file path
 */
async function createDatabaseBackup(dbName: string): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
    const backupPath = `${FileSystem.documentDirectory}SQLite/backup_${timestamp}_${dbName}`;

    // Check if database file exists
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    if (!dbInfo.exists) {
      console.warn('Database file does not exist, skipping backup');
      return '';
    }

    // Copy database file to backup
    await FileSystem.copyAsync({
      from: dbPath,
      to: backupPath,
    });

    console.log(`Database backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Error creating database backup:', error);
    throw new Error(`Failed to create database backup: ${error}`);
  }
}

/**
 * Executes a single migration within a transaction
 */
async function executeMigration(
  db: SQLite.SQLiteDatabase,
  migration: Migration,
  useTransaction: boolean = true
): Promise<void> {
  if (useTransaction) {
    try {
      await db.execAsync('BEGIN TRANSACTION;');
      await migration.up(db);
      await recordMigration(db, migration);
      await db.execAsync('COMMIT;');
      console.log(`Migration ${migration.version} (${migration.name}) applied successfully`);
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      console.error(`Migration ${migration.version} (${migration.name}) failed:`, error);
      throw error;
    }
  } else {
    await migration.up(db);
    await recordMigration(db, migration);
    console.log(`Migration ${migration.version} (${migration.name}) applied successfully`);
  }
}

/**
 * Rolls back a single migration
 */
async function rollbackMigration(
  db: SQLite.SQLiteDatabase,
  migration: Migration,
  useTransaction: boolean = true
): Promise<void> {
  if (useTransaction) {
    try {
      await db.execAsync('BEGIN TRANSACTION;');
      await migration.down(db);
      await removeMigrationRecord(db, migration.version);
      await db.execAsync('COMMIT;');
      console.log(`Migration ${migration.version} (${migration.name}) rolled back successfully`);
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      console.error(`Rollback of migration ${migration.version} (${migration.name}) failed:`, error);
      throw error;
    }
  } else {
    await migration.down(db);
    await removeMigrationRecord(db, migration.version);
    console.log(`Migration ${migration.version} (${migration.name}) rolled back successfully`);
  }
}

/**
 * Runs all pending migrations
 * @param db - SQLite database instance
 * @param migrations - Array of migration definitions
 * @param options - Migration options
 * @returns Array of migration results
 */
export async function runMigrations(
  db: SQLite.SQLiteDatabase,
  migrations: Migration[],
  dbName: string = 'myorok.db',
  options: MigrationOptions = {}
): Promise<MigrationResult[]> {
  const {
    createBackup = true,
    useTransaction = true,
    onProgress,
  } = options;

  const results: MigrationResult[] = [];

  try {
    // Initialize schema_migrations table
    await initializeSchemaMigrationsTable(db);

    // Get current version
    const currentVersion = await getCurrentVersion(db);
    console.log(`Current database version: ${currentVersion}`);

    // Filter pending migrations
    const pendingMigrations = migrations
      .filter((m) => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations to run');
      return results;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    // Create backup before migrations
    if (createBackup && pendingMigrations.length > 0) {
      try {
        await createDatabaseBackup(dbName);
      } catch (error) {
        console.error('Backup failed, aborting migrations:', error);
        throw new Error('Failed to create backup before migration');
      }
    }

    // Run each pending migration
    for (let i = 0; i < pendingMigrations.length; i++) {
      const migration = pendingMigrations[i];

      if (onProgress) {
        onProgress(i + 1, pendingMigrations.length, migration.name);
      }

      try {
        await executeMigration(db, migration, useTransaction);
        results.push({
          success: true,
          version: migration.version,
          name: migration.name,
        });
      } catch (error) {
        const migrationError =
          error instanceof Error ? error : new Error(String(error));
        results.push({
          success: false,
          version: migration.version,
          name: migration.name,
          error: migrationError,
        });
        // Stop on first error
        throw new Error(
          `Migration ${migration.version} (${migration.name}) failed: ${migrationError.message}`
        );
      }
    }

    console.log(`All ${pendingMigrations.length} migrations completed successfully`);
    return results;
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  }
}

/**
 * Rolls back the last N migrations
 * @param db - SQLite database instance
 * @param migrations - Array of migration definitions
 * @param count - Number of migrations to roll back (default: 1)
 * @param options - Migration options
 */
export async function rollbackMigrations(
  db: SQLite.SQLiteDatabase,
  migrations: Migration[],
  count: number = 1,
  options: MigrationOptions = {}
): Promise<MigrationResult[]> {
  const { useTransaction = true } = options;
  const results: MigrationResult[] = [];

  try {
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(db);

    if (appliedMigrations.length === 0) {
      console.log('No migrations to roll back');
      return results;
    }

    // Get the migrations to roll back (in reverse order)
    const migrationsToRollback = appliedMigrations
      .slice(-count)
      .reverse()
      .map((record) => migrations.find((m) => m.version === record.version))
      .filter((m): m is Migration => m !== undefined);

    console.log(`Rolling back ${migrationsToRollback.length} migrations`);

    // Roll back each migration
    for (const migration of migrationsToRollback) {
      try {
        await rollbackMigration(db, migration, useTransaction);
        results.push({
          success: true,
          version: migration.version,
          name: migration.name,
        });
      } catch (error) {
        const migrationError =
          error instanceof Error ? error : new Error(String(error));
        results.push({
          success: false,
          version: migration.version,
          name: migration.name,
          error: migrationError,
        });
        throw new Error(
          `Rollback of migration ${migration.version} (${migration.name}) failed: ${migrationError.message}`
        );
      }
    }

    console.log(`Rolled back ${migrationsToRollback.length} migrations successfully`);
    return results;
  } catch (error) {
    console.error('Rollback process failed:', error);
    throw error;
  }
}

/**
 * Gets the current migration status
 * @param db - SQLite database instance
 * @param migrations - Array of migration definitions
 */
export async function getMigrationStatus(
  db: SQLite.SQLiteDatabase,
  migrations: Migration[]
): Promise<{
  currentVersion: number;
  latestVersion: number;
  appliedMigrations: MigrationRecord[];
  pendingMigrations: Migration[];
}> {
  await initializeSchemaMigrationsTable(db);

  const currentVersion = await getCurrentVersion(db);
  const appliedMigrations = await getAppliedMigrations(db);
  const latestVersion = Math.max(...migrations.map((m) => m.version), 0);
  const pendingMigrations = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  return {
    currentVersion,
    latestVersion,
    appliedMigrations,
    pendingMigrations,
  };
}
