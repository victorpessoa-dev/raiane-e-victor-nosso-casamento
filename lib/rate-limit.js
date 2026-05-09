const buckets = new Map();

function pruneBucket(bucket, now) {
  while (bucket.length > 0 && bucket[0] <= now) {
    bucket.shift();
  }
}

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const expiresAt = now + windowMs;
  const bucket = buckets.get(key) || [];

  pruneBucket(bucket, now);

  if (bucket.length >= limit) {
    const retryAfterMs = Math.max(bucket[0] - now, 0);
    return {
      success: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  bucket.push(expiresAt);
  buckets.set(key, bucket);

  return {
    success: true,
    retryAfterSeconds: 0,
  };
}
