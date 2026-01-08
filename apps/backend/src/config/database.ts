import { Pool } from 'pg';
import { config } from './index';

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: config.database.url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
    console.log('[Database] Connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client', err);
});

export { pool };

/**
 * Initialize database tables
 */
export async function initializeDatabase(): Promise<void> {
    const client = await pool.connect();
    try {
        // Create trial_records table
        await client.query(`
            CREATE TABLE IF NOT EXISTS trial_records (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                device_id VARCHAR(255),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // Create subscription_records table
        await client.query(`
            CREATE TABLE IF NOT EXISTS subscription_records (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'blocked',
                trial_started_at TIMESTAMPTZ,
                subscription_started_at TIMESTAMPTZ,
                subscription_expires_at TIMESTAMPTZ,
                product_id VARCHAR(255),
                purchase_token TEXT,
                order_id VARCHAR(255),
                last_verified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // Create purchase_verifications table (for audit trail)
        await client.query(`
            CREATE TABLE IF NOT EXISTS purchase_verifications (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                purchase_token TEXT NOT NULL,
                order_id VARCHAR(255),
                product_id VARCHAR(255),
                verification_result JSONB,
                verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_trial_records_user_id ON trial_records(user_id);
            CREATE INDEX IF NOT EXISTS idx_subscription_records_user_id ON subscription_records(user_id);
            CREATE INDEX IF NOT EXISTS idx_subscription_records_status ON subscription_records(status);
            CREATE INDEX IF NOT EXISTS idx_purchase_verifications_user_id ON purchase_verifications(user_id);
        `);

        console.log('[Database] Tables initialized successfully');
    } catch (error) {
        console.error('[Database] Failed to initialize tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
    await pool.end();
    console.log('[Database] Connection pool closed');
}
