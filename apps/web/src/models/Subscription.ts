import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, default: 'unknown' },
    status: {
        type: String,
        required: true,
        enum: ['trial', 'active', 'expired', 'subscribed', 'blocked'],
        index: true,
    },
    trialStartDate: { type: Date, default: null },
    subscriptionStartDate: { type: Date, default: null },
    subscriptionExpiryDate: { type: Date, default: null, index: true },
    forceExpired: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// userId는 고유해야 함 (한 사용자당 하나의 구독)
// deviceId는 인덱싱만 하여 검색 성능 최적화 (중복 trial 체크는 API 레이어에서 수행)
SubscriptionSchema.index({ deviceId: 1 });

SubscriptionSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
