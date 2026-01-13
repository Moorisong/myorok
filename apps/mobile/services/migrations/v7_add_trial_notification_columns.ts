import * as SQLite from 'expo-sqlite';
import { Migration } from './types';

/**
 * Migration v7: Add trial notification tracking and deviceId columns to subscription_state table
 * - lastTrialPushAt: Timestamp of last trial end notification sent
 * - nextTrialPushAt: Timestamp of next scheduled trial end notification
 * - deviceId: Unique device identifier for SSOT trial management (duplicate trial prevention)
 */
export const v7_add_trial_notification_columns: Migration = {
  version: 7,
  name: 'add_trial_notification_columns',
  up: async (db: SQLite.SQLiteDatabase) => {
    // Check if columns already exist
    const tableInfo = await db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(subscription_state)'
    );

    const hasLastTrialPushAt = tableInfo.some((col) => col.name === 'lastTrialPushAt');
    const hasNextTrialPushAt = tableInfo.some((col) => col.name === 'nextTrialPushAt');
    const hasDeviceId = tableInfo.some((col) => col.name === 'deviceId');

    if (!hasLastTrialPushAt) {
      await db.execAsync(`
        ALTER TABLE subscription_state ADD COLUMN lastTrialPushAt TEXT;
      `);
      console.log('[Migration v7] Added lastTrialPushAt column to subscription_state');
    }

    if (!hasNextTrialPushAt) {
      await db.execAsync(`
        ALTER TABLE subscription_state ADD COLUMN nextTrialPushAt TEXT;
      `);
      console.log('[Migration v7] Added nextTrialPushAt column to subscription_state');
    }

    if (!hasDeviceId) {
      await db.execAsync(`
        ALTER TABLE subscription_state ADD COLUMN deviceId TEXT;
      `);
      console.log('[Migration v7] Added deviceId column to subscription_state for SSOT trial management');
    }

    // Add index for deviceId for efficient duplicate trial prevention
    try {
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_subscription_state_deviceId 
        ON subscription_state(deviceId);
      `);
      console.log('[Migration v7] Added deviceId index for SSOT trial management');
    } catch (error) {
      console.warn('[Migration v7] Failed to create deviceId index (may already exist):', error);
    }
  },
  down: async (db: SQLite.SQLiteDatabase) => {
    // SQLite doesn't support DROP COLUMN directly
    // To fully remove columns, we'd need to recreate the table
    console.warn(
      '[Migration v7] Cannot drop columns in SQLite. Columns remain but unused.'
    );
    
    // Drop the index we created
    try {
      await db.execAsync(`
        DROP INDEX IF EXISTS idx_subscription_state_deviceId;
      `);
      console.log('[Migration v7] Dropped deviceId index');
    } catch (error) {
      console.warn('[Migration v7] Failed to drop deviceId index:', error);
    }
  },
};
