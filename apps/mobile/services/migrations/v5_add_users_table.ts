import * as SQLite from 'expo-sqlite';
import { Migration } from './types';

/**
 * Migration v5: Add users table and userId columns for Kakao login
 * 
 * This migration adds:
 * 1. `users` table for storing Kakao user information
 * 2. `userId` column to subscription_state table
 * 3. `userId` column to all data tables (pets, daily_records, etc.)
 */
export const v5_add_users_table: Migration = {
    version: 5,
    name: 'add_users_table',
    up: async (db: SQLite.SQLiteDatabase) => {
        // 1. Create users table
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT,
        profileImage TEXT,
        createdAt TEXT NOT NULL,
        lastLogin TEXT NOT NULL
      );
    `);

        // 2. Add userId to subscription_state
        const subscriptionInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(subscription_state)'
        );
        const hasSubscriptionUserId = subscriptionInfo.some((col) => col.name === 'userId');

        if (!hasSubscriptionUserId) {
            await db.execAsync(`
        ALTER TABLE subscription_state ADD COLUMN userId TEXT;
      `);
        }

        // 3. Add userId to pets
        const petsInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(pets)'
        );
        const hasPetsUserId = petsInfo.some((col) => col.name === 'userId');

        if (!hasPetsUserId) {
            await db.execAsync('ALTER TABLE pets ADD COLUMN userId TEXT;');
        }

        // 4. Add userId to daily_records
        const dailyInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(daily_records)'
        );
        const hasDailyUserId = dailyInfo.some((col) => col.name === 'userId');

        if (!hasDailyUserId) {
            await db.execAsync('ALTER TABLE daily_records ADD COLUMN userId TEXT;');
        }

        // 5. Add userId to supplements
        const supplementsInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(supplements)'
        );
        const hasSupplementsUserId = supplementsInfo.some((col) => col.name === 'userId');

        if (!hasSupplementsUserId) {
            await db.execAsync('ALTER TABLE supplements ADD COLUMN userId TEXT;');
        }

        // 6. Add userId to supplement_records
        const supplementRecordsInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(supplement_records)'
        );
        const hasSupplementRecordsUserId = supplementRecordsInfo.some((col) => col.name === 'userId');

        if (!hasSupplementRecordsUserId) {
            await db.execAsync('ALTER TABLE supplement_records ADD COLUMN userId TEXT;');
        }

        // 7. Add userId to fluid_records
        const fluidInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(fluid_records)'
        );
        const hasFluidUserId = fluidInfo.some((col) => col.name === 'userId');

        if (!hasFluidUserId) {
            await db.execAsync('ALTER TABLE fluid_records ADD COLUMN userId TEXT;');
        }

        // 8. Add userId to custom_metrics
        const customMetricsInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(custom_metrics)'
        );
        const hasCustomMetricsUserId = customMetricsInfo.some((col) => col.name === 'userId');

        if (!hasCustomMetricsUserId) {
            await db.execAsync('ALTER TABLE custom_metrics ADD COLUMN userId TEXT;');
        }

        // 9. Add userId to custom_metric_records
        const customMetricRecordsInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(custom_metric_records)'
        );
        const hasCustomMetricRecordsUserId = customMetricRecordsInfo.some((col) => col.name === 'userId');

        if (!hasCustomMetricRecordsUserId) {
            await db.execAsync('ALTER TABLE custom_metric_records ADD COLUMN userId TEXT;');
        }

        // 10. Add userId to medication_memos
        const medicationMemosInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(medication_memos)'
        );
        const hasMedicationMemosUserId = medicationMemosInfo.some((col) => col.name === 'userId');

        if (!hasMedicationMemosUserId) {
            await db.execAsync('ALTER TABLE medication_memos ADD COLUMN userId TEXT;');
        }

        // 11. Add userId to food_preference_memos
        const foodPreferenceMemosInfo = await db.getAllAsync<{ name: string }>(
            'PRAGMA table_info(food_preference_memos)'
        );
        const hasFoodPreferenceMemosUserId = foodPreferenceMemosInfo.some((col) => col.name === 'userId');

        if (!hasFoodPreferenceMemosUserId) {
            await db.execAsync('ALTER TABLE food_preference_memos ADD COLUMN userId TEXT;');
        }

        // 12. Create indexes for userId lookups
        await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
      CREATE INDEX IF NOT EXISTS idx_pets_user ON pets(userId);
      CREATE INDEX IF NOT EXISTS idx_subscription_user ON subscription_state(userId);
      CREATE INDEX IF NOT EXISTS idx_daily_records_user ON daily_records(userId);
      CREATE INDEX IF NOT EXISTS idx_supplements_user ON supplements(userId);
      CREATE INDEX IF NOT EXISTS idx_fluid_records_user ON fluid_records(userId);
      CREATE INDEX IF NOT EXISTS idx_custom_metrics_user ON custom_metrics(userId);
    `);

        console.log('[Migration v5] Users table and userId columns added successfully');
    },
    down: async (db: SQLite.SQLiteDatabase) => {
        // Drop indexes
        await db.execAsync(`
      DROP INDEX IF EXISTS idx_users_id;
      DROP INDEX IF EXISTS idx_pets_user;
      DROP INDEX IF EXISTS idx_subscription_user;
      DROP INDEX IF EXISTS idx_daily_records_user;
      DROP INDEX IF EXISTS idx_supplements_user;
      DROP INDEX IF EXISTS idx_fluid_records_user;
      DROP INDEX IF EXISTS idx_custom_metrics_user;
    `);

        // Drop users table
        await db.execAsync('DROP TABLE IF EXISTS users;');

        // Note: SQLite doesn't support DROP COLUMN
        // userId columns will remain but be unused
        console.warn('[Migration v5] Rolled back. userId columns remain but are unused.');
    },
};
