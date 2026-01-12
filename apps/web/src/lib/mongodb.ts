import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalMongoose {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: GlobalMongoose;
}

let cached: GlobalMongoose = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    console.log('[DEBUG_PROD] dbConnect called');

    if (cached.conn) {
        console.log('[DEBUG_PROD] Returning cached connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        const uri = MONGODB_URI!;
        // Mask URI for security but show DB name/cluster
        const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        console.log(`[DEBUG_PROD] Connecting to MongoDB: ${maskedUri}`);

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log('✅ MongoDB 연결 성공');
            console.log(`[DEBUG_PROD] Connected to DB: ${mongoose.connection.name}, Host: ${mongoose.connection.host}`);
            return mongoose;
        }).catch((err) => {
            console.error('[DEBUG_PROD] ❌ MongoDB Connection Error:', err);
            throw err;
        });
    } else {
        console.log('[DEBUG_PROD] Reusing existing connection promise');
    }

    try {
        cached.conn = await cached.promise;
        console.log('[DEBUG_PROD] Connection established successfully');
    } catch (e) {
        cached.promise = null;
        console.error('[DEBUG_PROD] ❌ Connection promise failed:', e);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
