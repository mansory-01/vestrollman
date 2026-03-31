import { db } from "../db";
import { eq } from "drizzle-orm";
import type { SubmissionResult } from "../services/blockchain.service";

// Default TTL: 24 hours
const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

/**
 * TransactionIdempotencyCache
 *
 * Prevents duplicate blockchain transaction submissions by caching submitted
 * transaction hashes along with their results for a configurable TTL window.
 *
 * Backend is selected via the TRANSACTION_CACHE_BACKEND environment variable:
 *   - "redis"  → uses ioredis (requires REDIS_URL env var)
 *   - "db"     → uses the transaction_cache PostgreSQL table (default)
 */
export class TransactionIdempotencyCache {
  private static getBackend(): "redis" | "db" {
    const backend = process.env.TRANSACTION_CACHE_BACKEND;
    return backend === "redis" ? "redis" : "db";
  }

  /**
   * Checks if a transaction hash already exists in the cache.
   * Returns the cached SubmissionResult if found (and not expired), null otherwise.
   */
  static async has(hash: string): Promise<SubmissionResult | null> {
    if (this.getBackend() === "redis") {
      return this.redisHas(hash);
    }
    return this.dbHas(hash);
  }

  /**
   * Stores a transaction hash and its result in the cache.
   * @param hash       - The transaction hash string.
   * @param result     - The SubmissionResult to cache.
   * @param ttlSeconds - How long to cache (default: 24 hours).
   */
  static async set(
    hash: string,
    result: SubmissionResult,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    if (this.getBackend() === "redis") {
      return this.redisSet(hash, result, ttlSeconds);
    }
    return this.dbSet(hash, result, ttlSeconds);
  }

  // ─── DB Backend ───────────────────────────────────────────────────────────

  private static async dbHas(hash: string): Promise<SubmissionResult | null> {
    let transactionCache: any;
    try {
      const schema = (await import("../db/schema")) as Record<string, any>;
      transactionCache = schema.transactionCache;
    } catch {
      return null;
    }

    if (
      typeof (db as any).select !== "function" ||
      !transactionCache?.hash ||
      !transactionCache?.expiresAt
    ) {
      return null;
    }

    const now = new Date();
    const rows = await db
      .select()
      .from(transactionCache)
      .where(eq(transactionCache.hash, hash))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    // Return null if entry has expired
    if (row.expiresAt <= now) {
      // Clean up expired entry
      await db.delete(transactionCache).where(eq(transactionCache.hash, hash));
      return null;
    }

    return JSON.parse(row.resultJson) as SubmissionResult;
  }

  private static async dbSet(
    hash: string,
    result: SubmissionResult,
    ttlSeconds: number,
  ): Promise<void> {
    let transactionCache: any;
    try {
      const schema = (await import("../db/schema")) as Record<string, any>;
      transactionCache = schema.transactionCache;
    } catch {
      return;
    }

    if (
      typeof (db as any).insert !== "function" ||
      !transactionCache?.hash
    ) {
      return;
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await db
      .insert(transactionCache)
      .values({
        hash,
        resultJson: JSON.stringify(result),
        expiresAt,
      })
      .onConflictDoUpdate({
        target: transactionCache.hash,
        set: {
          resultJson: JSON.stringify(result),
          expiresAt,
        },
      });
  }

  // ─── Redis Backend ────────────────────────────────────────────────────────

  private static async getRedisClient(): Promise<any> {
    // Dynamically import ioredis to keep it optional (install ioredis if TRANSACTION_CACHE_BACKEND=redis)
    const { default: Redis } = await import("ioredis" as any);
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    return new Redis(redisUrl);
  }

  private static async redisHas(hash: string): Promise<SubmissionResult | null> {
    const client = await this.getRedisClient();
    try {
      const value = await client.get(`tx:${hash}`);
      if (!value) return null;
      return JSON.parse(value) as SubmissionResult;
    } finally {
      client.quit();
    }
  }

  private static async redisSet(
    hash: string,
    result: SubmissionResult,
    ttlSeconds: number,
  ): Promise<void> {
    const client = await this.getRedisClient();
    try {
      await client.set(`tx:${hash}`, JSON.stringify(result), "EX", ttlSeconds);
    } finally {
      client.quit();
    }
  }
}
