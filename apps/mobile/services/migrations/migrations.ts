import * as SQLite from 'expo-sqlite';
import { Migration } from './types';
import { v5_add_users_table } from './v5_add_users_table';

/**
 * All database migrations in order
 * Each migration should have a unique version number and implement both up and down functions
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'enable_foreign_keys',
    up: async (db: SQLite.SQLiteDatabase) => {
      // Enable foreign key constraints
      await db.execAsync('PRAGMA foreign_keys = ON;');
    },
    down: async (db: SQLite.SQLiteDatabase) => {
      // Disable foreign key constraints
      await db.execAsync('PRAGMA foreign_keys = OFF;');
    },
  },
  {
    version: 2,
    name: 'add_petid_to_supplement_records',
    up: async (db: SQLite.SQLiteDatabase) => {
      // Check if column already exists
      const tableInfo = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(supplement_records)'
      );
      const hasPetId = tableInfo.some((col) => col.name === 'petId');

      if (!hasPetId) {
        // Add petId column
        await db.execAsync(`
          ALTER TABLE supplement_records ADD COLUMN petId TEXT;
        `);

        // Populate petId from supplements table
        await db.execAsync(`
          UPDATE supplement_records
          SET petId = (
            SELECT petId FROM supplements
            WHERE supplements.id = supplement_records.supplementId
          );
        `);

        // Handle orphaned records (where supplement was deleted or doesn't exist)
        const nullCount = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM supplement_records WHERE petId IS NULL'
        );

        if (nullCount && nullCount.count > 0) {
          console.warn(`Found ${nullCount.count} orphaned supplement_records, attempting to fix...`);

          // Try to assign to the first pet
          const firstPet = await db.getFirstAsync<{ id: string }>('SELECT id FROM pets LIMIT 1');

          if (firstPet) {
            // Assign orphaned records to the first pet
            await db.execAsync(`
              UPDATE supplement_records
              SET petId = '${firstPet.id}'
              WHERE petId IS NULL;
            `);
            console.log(`Assigned ${nullCount.count} orphaned records to pet ${firstPet.id}`);
          } else {
            // No pets exist, delete orphaned records
            await db.execAsync('DELETE FROM supplement_records WHERE petId IS NULL;');
            console.log(`Deleted ${nullCount.count} orphaned supplement_records (no pets found)`);
          }
        }

        // Create index for better query performance
        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_supplement_records_pet
          ON supplement_records(petId);
        `);

        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_supplement_records_supp
          ON supplement_records(supplementId);
        `);
      }
    },
    down: async (db: SQLite.SQLiteDatabase) => {
      // SQLite doesn't support DROP COLUMN directly
      // We would need to recreate the table without the petId column
      // For now, we'll just drop the indexes
      await db.execAsync('DROP INDEX IF EXISTS idx_supplement_records_pet;');
      await db.execAsync('DROP INDEX IF EXISTS idx_supplement_records_supp;');

      // Note: To fully remove the column, we'd need to:
      // 1. Create a new table without petId
      // 2. Copy data from old table
      // 3. Drop old table
      // 4. Rename new table
      console.warn(
        'Cannot drop petId column in SQLite. Indexes removed but column remains.'
      );
    },
  },
  {
    version: 3,
    name: 'add_petid_to_custom_metric_records',
    up: async (db: SQLite.SQLiteDatabase) => {
      // Check if column already exists
      const tableInfo = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(custom_metric_records)'
      );
      const hasPetId = tableInfo.some((col) => col.name === 'petId');

      if (!hasPetId) {
        // Add petId column
        await db.execAsync(`
          ALTER TABLE custom_metric_records ADD COLUMN petId TEXT;
        `);

        // Populate petId from custom_metrics table
        await db.execAsync(`
          UPDATE custom_metric_records
          SET petId = (
            SELECT petId FROM custom_metrics
            WHERE custom_metrics.id = custom_metric_records.metricId
          );
        `);

        // Handle orphaned records (where custom_metric was deleted or doesn't exist)
        const nullCount = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM custom_metric_records WHERE petId IS NULL'
        );

        if (nullCount && nullCount.count > 0) {
          console.warn(`Found ${nullCount.count} orphaned custom_metric_records, attempting to fix...`);

          // Try to assign to the first pet
          const firstPet = await db.getFirstAsync<{ id: string }>('SELECT id FROM pets LIMIT 1');

          if (firstPet) {
            // Assign orphaned records to the first pet
            await db.execAsync(`
              UPDATE custom_metric_records
              SET petId = '${firstPet.id}'
              WHERE petId IS NULL;
            `);
            console.log(`Assigned ${nullCount.count} orphaned custom_metric_records to pet ${firstPet.id}`);
          } else {
            // No pets exist, delete orphaned records
            await db.execAsync('DELETE FROM custom_metric_records WHERE petId IS NULL;');
            console.log(`Deleted ${nullCount.count} orphaned custom_metric_records (no pets found)`);
          }
        }

        // Create indexes for better query performance
        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_custom_metric_records_pet
          ON custom_metric_records(petId);
        `);

        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_custom_metric_records_metric
          ON custom_metric_records(metricId);
        `);
      }
    },
    down: async (db: SQLite.SQLiteDatabase) => {
      // Drop indexes
      await db.execAsync('DROP INDEX IF EXISTS idx_custom_metric_records_pet;');
      await db.execAsync('DROP INDEX IF EXISTS idx_custom_metric_records_metric;');

      console.warn(
        'Cannot drop petId column in SQLite. Indexes removed but column remains.'
      );
    },
  },
  {
    version: 4,
    name: 'create_performance_indexes',
    up: async (db: SQLite.SQLiteDatabase) => {
      // Create all performance indexes as specified in the documentation
      await db.execAsync(`
        -- daily_records: petId + date combination
        CREATE INDEX IF NOT EXISTS idx_daily_records_pet_date
        ON daily_records(petId, date);

        -- supplements: petId filtering (excluding soft-deleted)
        CREATE INDEX IF NOT EXISTS idx_supplements_pet
        ON supplements(petId) WHERE deletedAt IS NULL;

        -- fluid_records: petId + date combination
        CREATE INDEX IF NOT EXISTS idx_fluid_records_pet_date
        ON fluid_records(petId, date);

        -- custom_metrics: petId filtering
        CREATE INDEX IF NOT EXISTS idx_custom_metrics_pet
        ON custom_metrics(petId);

        -- medication_memos: petId (excluding soft-deleted)
        CREATE INDEX IF NOT EXISTS idx_medication_memos_pet
        ON medication_memos(petId) WHERE deletedAt IS NULL;

        -- food_preference_memos: petId (excluding soft-deleted)
        CREATE INDEX IF NOT EXISTS idx_food_preference_memos_pet
        ON food_preference_memos(petId) WHERE deletedAt IS NULL;
      `);
    },
    down: async (db: SQLite.SQLiteDatabase) => {
      // Drop all created indexes
      await db.execAsync(`
        DROP INDEX IF EXISTS idx_daily_records_pet_date;
        DROP INDEX IF EXISTS idx_supplements_pet;
        DROP INDEX IF EXISTS idx_fluid_records_pet_date;
        DROP INDEX IF EXISTS idx_custom_metrics_pet;
        DROP INDEX IF EXISTS idx_medication_memos_pet;
        DROP INDEX IF EXISTS idx_food_preference_memos_pet;
      `);
    },
  },
  // v5: Add users table and userId columns
  v5_add_users_table,
];
