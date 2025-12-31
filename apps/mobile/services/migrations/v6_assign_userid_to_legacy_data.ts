import * as SQLite from 'expo-sqlite';
import { Migration } from './types';

/**
 * Migration v6: Assign userId to legacy data (data created before user login feature)
 *
 * This migration assigns the current logged-in user's ID to all records that have NULL userId.
 * This ensures backward compatibility with data created before the Kakao login feature.
 */
export const v6_assign_userid_to_legacy_data: Migration = {
    version: 6,
    name: 'assign_userid_to_legacy_data',
    up: async (db: SQLite.SQLiteDatabase) => {
        // Note: This migration will be executed when user logs in
        // At this point, we don't know the userId yet
        // The actual data migration will be done in userService after login

        console.log('[Migration v6] Prepared for legacy data migration (will execute on login)');
    },
    down: async (db: SQLite.SQLiteDatabase) => {
        console.log('[Migration v6] Rollback - no action needed');
    },
};
