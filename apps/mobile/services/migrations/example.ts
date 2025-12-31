/**
 * Example: How to add a new migration
 *
 * This file demonstrates how to create and add a new migration to the system.
 * DO NOT import this file - it's for reference only.
 */

import * as SQLite from 'expo-sqlite';
import { Migration } from './types';

/**
 * Example 1: Adding a simple column
 */
const exampleAddColumn: Migration = {
  version: 5, // Next sequential version number
  name: 'add_notes_to_daily_records',
  up: async (db: SQLite.SQLiteDatabase) => {
    // Check if column exists first (idempotency)
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(daily_records)'
    );
    const hasNotes = tableInfo.some((col) => col.name === 'notes');

    if (!hasNotes) {
      await db.execAsync(`
        ALTER TABLE daily_records ADD COLUMN notes TEXT;
      `);
    }
  },
  down: async (db: SQLite.SQLiteDatabase) => {
    // SQLite doesn't support DROP COLUMN
    console.warn('Cannot drop notes column in SQLite');
  },
};

/**
 * Example 2: Adding a new table
 */
const exampleAddTable: Migration = {
  version: 6,
  name: 'create_appointments_table',
  up: async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        petId TEXT NOT NULL,
        title TEXT NOT NULL,
        appointmentDate TEXT NOT NULL,
        location TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE
      );

      -- Create index for efficient querying
      CREATE INDEX IF NOT EXISTS idx_appointments_pet_date
      ON appointments(petId, appointmentDate);
    `);
  },
  down: async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_appointments_pet_date;
      DROP TABLE IF EXISTS appointments;
    `);
  },
};

/**
 * Example 3: Data migration with validation
 */
const exampleDataMigration: Migration = {
  version: 7,
  name: 'normalize_supplement_types',
  up: async (db: SQLite.SQLiteDatabase) => {
    // Update old values to new standardized values
    await db.execAsync(`
      UPDATE supplements
      SET type = 'medicine'
      WHERE type IN ('약', 'medication', 'med');

      UPDATE supplements
      SET type = 'supplement'
      WHERE type IN ('영양제', 'nutritional', 'vitamin');
    `);

    // Verify all types are now standardized
    const invalidTypes = await db.getAllAsync<{ type: string; count: number }>(
      `SELECT type, COUNT(*) as count
       FROM supplements
       WHERE type NOT IN ('medicine', 'supplement')
       GROUP BY type`
    );

    if (invalidTypes.length > 0) {
      throw new Error(
        `Found invalid supplement types: ${invalidTypes.map((t) => t.type).join(', ')}`
      );
    }
  },
  down: async (db: SQLite.SQLiteDatabase) => {
    // Cannot reliably reverse this migration
    console.warn('Cannot reverse type normalization');
  },
};

/**
 * Example 4: Adding multiple indexes
 */
const exampleAddIndexes: Migration = {
  version: 8,
  name: 'add_search_indexes',
  up: async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync(`
      -- Index for searching supplements by name
      CREATE INDEX IF NOT EXISTS idx_supplements_name
      ON supplements(name COLLATE NOCASE);

      -- Index for filtering by date range
      CREATE INDEX IF NOT EXISTS idx_daily_records_date
      ON daily_records(date);

      -- Composite index for common queries
      CREATE INDEX IF NOT EXISTS idx_supplements_pet_type
      ON supplements(petId, type) WHERE deletedAt IS NULL;
    `);
  },
  down: async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_supplements_name;
      DROP INDEX IF EXISTS idx_daily_records_date;
      DROP INDEX IF EXISTS idx_supplements_pet_type;
    `);
  },
};

/**
 * Example 5: Complex migration with data transformation
 */
const exampleComplexMigration: Migration = {
  version: 9,
  name: 'split_name_into_first_last',
  up: async (db: SQLite.SQLiteDatabase) => {
    // Add new columns
    await db.execAsync(`
      ALTER TABLE pets ADD COLUMN firstName TEXT;
      ALTER TABLE pets ADD COLUMN lastName TEXT;
    `);

    // Get all pets
    const pets = await db.getAllAsync<{ id: string; name: string }>(
      'SELECT id, name FROM pets'
    );

    // Split names and update
    for (const pet of pets) {
      const parts = pet.name.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      await db.runAsync(
        'UPDATE pets SET firstName = ?, lastName = ? WHERE id = ?',
        [firstName, lastName, pet.id]
      );
    }

    // Verify all pets have firstName
    const nullCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM pets WHERE firstName IS NULL OR firstName = ""'
    );

    if (nullCount && nullCount.count > 0) {
      throw new Error(`Migration failed: ${nullCount.count} pets without firstName`);
    }
  },
  down: async (db: SQLite.SQLiteDatabase) => {
    // Restore original name from firstName + lastName
    const pets = await db.getAllAsync<{
      id: string;
      firstName: string;
      lastName: string;
    }>('SELECT id, firstName, lastName FROM pets');

    for (const pet of pets) {
      const name = [pet.firstName, pet.lastName].filter(Boolean).join(' ');
      await db.runAsync('UPDATE pets SET name = ? WHERE id = ?', [name, pet.id]);
    }

    // Note: Cannot drop columns in SQLite without recreating table
    console.warn('firstName and lastName columns remain but are unused');
  },
};

/**
 * HOW TO ADD YOUR MIGRATION:
 *
 * 1. Create your migration following the examples above
 * 2. Add it to the migrations array in migrations.ts:
 *
 *    export const migrations: Migration[] = [
 *      // ... existing migrations
 *      yourNewMigration,
 *    ];
 *
 * 3. Test your migration:
 *    - Run on a development database
 *    - Verify data integrity
 *    - Test the rollback (if possible)
 *    - Ensure it's idempotent (can run multiple times)
 *
 * 4. Deploy:
 *    - Merge to main branch
 *    - Migration will run automatically on app start
 *    - Monitor for errors in production
 */
