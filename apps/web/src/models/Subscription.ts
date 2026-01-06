import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['trial', 'active', 'expired'],
        index: true,
    },
    trialStartDate: { type: Date, required: true },
    subscriptionStartDate: { type: Date, default: null },
    subscriptionExpiryDate: { type: Date, default: null, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

SubscriptionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
