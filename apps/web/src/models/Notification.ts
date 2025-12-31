import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    type: { type: String, required: true }, // 'COMMENT', 'INACTIVITY', 'SYSTEM'
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Object }, // Extra data { postId: ... }
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
