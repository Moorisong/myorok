import mongoose from 'mongoose';
import { config } from './index';

/**
 * MongoDB 연결 초기화
 */
export async function connectDatabase(): Promise<void> {
    const mongoUrl = config.database.url;

    if (!mongoUrl || mongoUrl === 'mongodb://localhost:27017/myorok') {
        console.warn('[Database] MONGODB_URL not set, using default local connection');
    }

    try {
        await mongoose.connect(mongoUrl, {
            // Mongoose 6+ 기본 옵션
        });
        console.log('[Database] Connected to MongoDB');
    } catch (error) {
        console.error('[Database] MongoDB connection failed:', error);
        throw error;
    }
}

/**
 * MongoDB 연결 종료
 */
export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB');
}

// ============================================================
// Schemas
// ============================================================

/**
 * Trial Record Schema - 무료체험 사용 기록
 */
const trialRecordSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    trialStartedAt: { type: Date, required: true, default: Date.now },
    deviceId: { type: String, default: 'unknown' },
}, {
    timestamps: true,
});

/**
 * Subscription Record Schema - 구독 상태 기록
 */
const subscriptionRecordSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    status: {
        type: String,
        enum: ['trial', 'subscribed', 'blocked'],
        default: 'blocked'
    },
    trialStartedAt: { type: Date },
    subscriptionStartedAt: { type: Date },
    subscriptionExpiresAt: { type: Date },
    productId: { type: String },
    purchaseToken: { type: String },
    orderId: { type: String },
    lastVerifiedAt: { type: Date },
}, {
    timestamps: true,
});

/**
 * Purchase Verification Schema - 구매 검증 기록 (감사 로그)
 */
const purchaseVerificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    purchaseToken: { type: String, required: true },
    orderId: { type: String },
    productId: { type: String },
    verificationResult: { type: mongoose.Schema.Types.Mixed },
    verifiedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

// ============================================================
// Models
// ============================================================

export const TrialRecord = mongoose.model('TrialRecord', trialRecordSchema);
export const SubscriptionRecord = mongoose.model('SubscriptionRecord', subscriptionRecordSchema);
export const PurchaseVerification = mongoose.model('PurchaseVerification', purchaseVerificationSchema);
