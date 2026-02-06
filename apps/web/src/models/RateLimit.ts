import mongoose from 'mongoose';

const RateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  timestamps: [{ type: Date }],
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
});

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
