import mongoose from 'mongoose';

const NotificationStateSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    type: { type: String, required: true }, // 'COMFORT_COMMENT', 'INACTIVITY'
    lastSentAt: { type: Date, default: null },
    unreadCount: { type: Number, default: 0 },
});

// Compound index for unique device + type
NotificationStateSchema.index({ deviceId: 1, type: 1 }, { unique: true });

export default mongoose.models.NotificationState || mongoose.model('NotificationState', NotificationStateSchema);
