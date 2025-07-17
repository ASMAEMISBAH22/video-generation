interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimit {
  private store: Map<string, RateLimitEntry>;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit = 10, windowMs = 60000) {
    this.store = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      this.store.delete(key);
    }

    if (!entry || now > entry.resetTime) {
      // First request or expired entry
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { success: true, remaining: this.limit - 1 };
    }

    if (entry.count >= this.limit) {
      return { success: false, remaining: 0 };
    }

    // Increment counter
    entry.count++;
    return { success: true, remaining: this.limit - entry.count };
  }

  // Clean up method (call periodically if needed)
  cleanup() {
    const now = Date.now();
    Array.from(this.store.entries()).forEach(([key, entry]) => {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    });
  }
}

// Export a singleton instance
export const rateLimit = new RateLimit(); 