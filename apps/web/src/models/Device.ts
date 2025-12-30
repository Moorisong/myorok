import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    pushToken: { type: String }, // Expo Push Token
    settings: {
        marketing: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        inactivity: { type: Boolean, default: true },
    },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Device || mongoose.model('Device', DeviceSchema);
