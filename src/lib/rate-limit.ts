// Simple in-memory rate limiter
// For production with multiple instances, consider using Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
}, 60000); // Clean up every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(entry.resetAt),
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  const allowed = entry.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetAt: new Date(entry.resetAt),
  };
}

// Rate limit configurations
export const RATE_LIMITS = {
  register: {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  verifyOtp: {
    limit: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
  },
  resendOtp: {
    limit: 3,
    windowMs: 30 * 60 * 1000, // 30 minutes
  },
};
