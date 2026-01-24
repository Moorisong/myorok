import dbConnect from './mongodb';
import RateLimit from '../models/RateLimit';

interface RateLimitWindow {
  readonly windowMs: number;
  readonly maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  waitSeconds?: number;
  reason?: string;
}

export async function checkRateLimit(
  key: string,
  limits: readonly RateLimitWindow[]
): Promise<RateLimitResult> {
  await dbConnect();

  const now = new Date();
  const maxWindowMs = Math.max(...limits.map(l => l.windowMs));
  const oldestRelevantTime = new Date(now.getTime() - maxWindowMs);

  const entry = await RateLimit.findOneAndUpdate(
    { key },
    {
      $push: {
        timestamps: {
          $each: [now],
          $position: 0,
        },
      },
      $set: {
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
      },
    },
    { upsert: true, new: true }
  );

  const timestamps: Date[] = entry.timestamps || [];
  const recentTimestamps = timestamps.filter(
    (t: Date) => t >= oldestRelevantTime
  );

  if (recentTimestamps.length !== timestamps.length) {
    await RateLimit.updateOne(
      { key },
      { $set: { timestamps: recentTimestamps } }
    );
  }

  for (const { windowMs, maxRequests } of limits) {
    const windowStart = new Date(now.getTime() - windowMs);
    const count = recentTimestamps.filter((t: Date) => t >= windowStart).length;

    if (count > maxRequests) {
      const waitSeconds = Math.ceil(windowMs / 1000);
      return {
        allowed: false,
        waitSeconds,
        reason: `요청 제한을 초과했습니다. ${Math.ceil(waitSeconds / 60)}분 후에 다시 시도해주세요.`,
      };
    }
  }

  return { allowed: true };
}

export function createRateLimitKey(
  action: 'post' | 'comment',
  deviceId: string,
  ip?: string
): string {
  const sanitizedIp = ip?.replace(/[^a-zA-Z0-9.:]/g, '') || 'unknown';
  return `${action}:${deviceId}:${sanitizedIp}`;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

export const RATE_LIMITS = {
  post: [
    { windowMs: 60 * 60 * 1000, maxRequests: 1 },
  ],
  comment: [
    { windowMs: 60 * 1000, maxRequests: 10 },
    { windowMs: 5 * 60 * 1000, maxRequests: 50 },
  ],
} as const;
