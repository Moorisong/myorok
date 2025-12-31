import * as SQLite from 'expo-sqlite';

/**
 * Represents a single database migration
 */
export interface Migration {
  /**
   * Unique version number for this migration
   * Must be sequential (1, 2, 3, ...)
   */
  version: number;

  /**
   * Human-readable name describing the migration
   * Example: 'add_petid_to_supplement_records'
   */
  name: string;

  /**
   * Function to apply the migration
   * This function should modify the database schema or data
   */
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;

  /**
   * Function to rollback the migration
   * This function should undo the changes made by the up function
   */
  down: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

/**
 * Represents a migration record in the schema_migrations table
 */
export interface MigrationRecord {
  version: number;
  name: string;
  appliedAt: string;
  checksum?: string;
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  success: boolean;
  version: number;
  name: string;
  error?: Error;
}

/**
 * Options for running migrations
 */
export interface MigrationOptions {
  /**
   * Whether to create a backup before running migrations
   * Default: true
   */
  createBackup?: boolean;

  /**
   * Whether to use transactions for migrations
   * Default: true
   */
  useTransaction?: boolean;

  /**
   * Callback function called on migration progress
   */
  onProgress?: (current: number, total: number, migrationName: string) => void;
}
