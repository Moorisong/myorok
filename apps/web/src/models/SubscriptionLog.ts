import mongoose from 'mongoose';

const SubscriptionLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    previousStatus: {
        type: String,
        required: true,
        enum: ['trial', 'active', 'expired', 'subscribed', 'blocked'],
    },
    newStatus: {
        type: String,
        required: true,
        enum: ['trial', 'active', 'expired', 'subscribed', 'blocked'],
    },
    changedAt: { type: Date, default: Date.now, index: true },
});

export default mongoose.models.SubscriptionLog || mongoose.model('SubscriptionLog', SubscriptionLogSchema);
