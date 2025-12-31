import { getDatabase } from '../database';

/**
 * Migrate legacy data (data without userId) to current user
 *
 * This function assigns the current user's ID to all records that have NULL userId.
 * This ensures backward compatibility with data created before user login feature.
 *
 * @param userId - The current logged-in user's ID
 */
export async function migrateLegacyDataToUser(userId: string): Promise<void> {
    try {
        const db = await getDatabase();

        console.log('[MigrateLegacyData] Starting migration for user:', userId);

        // Get count of records without userId
        const counts = await Promise.all([
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM pets WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM daily_records WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM supplements WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM supplement_records WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM fluid_records WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM custom_metrics WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM custom_metric_records WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM medication_memos WHERE userId IS NULL'),
            db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM food_preference_memos WHERE userId IS NULL'),
        ]);

        const totalLegacyRecords = counts.reduce((sum, result) => sum + (result?.count || 0), 0);

        if (totalLegacyRecords === 0) {
            console.log('[MigrateLegacyData] No legacy data to migrate');
            return;
        }

        console.log(`[MigrateLegacyData] Found ${totalLegacyRecords} legacy records to migrate`);

        // Assign userId to all legacy data
        await db.execAsync(`
            UPDATE pets SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE daily_records SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE supplements SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE supplement_records SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE fluid_records SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE custom_metrics SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE custom_metric_records SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE medication_memos SET userId = '${userId}' WHERE userId IS NULL;
            UPDATE food_preference_memos SET userId = '${userId}' WHERE userId IS NULL;
        `);

        console.log(`[MigrateLegacyData] Successfully migrated ${totalLegacyRecords} records to user ${userId}`);
    } catch (error) {
        console.error('[MigrateLegacyData] Migration failed:', error);
        throw error;
    }
}
