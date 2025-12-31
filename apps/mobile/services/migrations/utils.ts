import * as SQLite from 'expo-sqlite';
import { getMigrationStatus } from './migrationManager';
import { migrations } from './migrations';

/**
 * Utility functions for working with migrations
 */

/**
 * Logs the current migration status to the console
 * Useful for debugging and monitoring
 */
export async function logMigrationStatus(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  try {
    const status = await getMigrationStatus(db, migrations);

    console.log('=== Migration Status ===');
    console.log(`Current version: ${status.currentVersion}`);
    console.log(`Latest version: ${status.latestVersion}`);
    console.log(`Applied migrations: ${status.appliedMigrations.length}`);
    console.log(`Pending migrations: ${status.pendingMigrations.length}`);

    if (status.appliedMigrations.length > 0) {
      console.log('\nApplied migrations:');
      status.appliedMigrations.forEach((m) => {
        console.log(`  v${m.version}: ${m.name} (${m.appliedAt})`);
      });
    }

    if (status.pendingMigrations.length > 0) {
      console.log('\nPending migrations:');
      status.pendingMigrations.forEach((m) => {
        console.log(`  v${m.version}: ${m.name}`);
      });
    }

    console.log('========================');
  } catch (error) {
    console.error('Error getting migration status:', error);
  }
}

/**
 * Gets a list of all migration versions
 */
export function getAllMigrationVersions(): number[] {
  return migrations.map((m) => m.version).sort((a, b) => a - b);
}

/**
 * Gets a migration by version number
 */
export function getMigrationByVersion(version: number) {
  return migrations.find((m) => m.version === version);
}

/**
 * Validates that all migrations have sequential version numbers
 * Returns an array of errors if validation fails
 */
export function validateMigrations(): string[] {
  const errors: string[] = [];
  const versions = migrations.map((m) => m.version);

  // Check for duplicates
  const duplicates = versions.filter(
    (v, i) => versions.indexOf(v) !== i
  );
  if (duplicates.length > 0) {
    errors.push(
      `Duplicate migration versions found: ${duplicates.join(', ')}`
    );
  }

  // Check for sequential versions
  const sortedVersions = [...versions].sort((a, b) => a - b);
  for (let i = 0; i < sortedVersions.length; i++) {
    if (sortedVersions[i] !== i + 1) {
      errors.push(
        `Migrations must have sequential versions starting from 1. Found gap at version ${i + 1}`
      );
      break;
    }
  }

  // Check for empty names
  migrations.forEach((m) => {
    if (!m.name || m.name.trim() === '') {
      errors.push(`Migration v${m.version} has an empty name`);
    }
  });

  // Check for missing up/down functions
  migrations.forEach((m) => {
    if (typeof m.up !== 'function') {
      errors.push(`Migration v${m.version} (${m.name}) is missing 'up' function`);
    }
    if (typeof m.down !== 'function') {
      errors.push(`Migration v${m.version} (${m.name}) is missing 'down' function`);
    }
  });

  return errors;
}

/**
 * Checks if migrations are valid
 * Throws an error if validation fails
 */
export function assertMigrationsValid(): void {
  const errors = validateMigrations();
  if (errors.length > 0) {
    throw new Error(
      `Migration validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * Gets information about applied migrations from the database
 */
export async function getAppliedMigrationInfo(
  db: SQLite.SQLiteDatabase
): Promise<
  Array<{
    version: number;
    name: string;
    appliedAt: string;
    daysAgo: number;
  }>
> {
  try {
    const records = await db.getAllAsync<{
      version: number;
      name: string;
      appliedAt: string;
    }>('SELECT version, name, appliedAt FROM schema_migrations ORDER BY version ASC');

    return records.map((record) => {
      const appliedDate = new Date(record.appliedAt);
      const now = new Date();
      const diffMs = now.getTime() - appliedDate.getTime();
      const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      return {
        ...record,
        daysAgo,
      };
    });
  } catch (error) {
    console.error('Error getting applied migration info:', error);
    return [];
  }
}

/**
 * Checks if the database is up to date with all migrations
 */
export async function isDatabaseUpToDate(
  db: SQLite.SQLiteDatabase
): Promise<boolean> {
  const status = await getMigrationStatus(db, migrations);
  return status.pendingMigrations.length === 0;
}

/**
 * Gets the name of the last applied migration
 */
export async function getLastAppliedMigration(
  db: SQLite.SQLiteDatabase
): Promise<{ version: number; name: string } | null> {
  try {
    const result = await db.getFirstAsync<{
      version: number;
      name: string;
    }>(
      'SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    return result || null;
  } catch (error) {
    console.error('Error getting last applied migration:', error);
    return null;
  }
}
