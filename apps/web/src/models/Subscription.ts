import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, default: 'unknown' },
    status: {
        type: String,
        required: true,
        enum: ['trial', 'active', 'expired'],
        index: true,
    },
    trialStartDate: { type: Date, default: null },
    subscriptionStartDate: { type: Date, default: null },
    subscriptionExpiryDate: { type: Date, default: null, index: true },
    forceExpired: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

SubscriptionSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
