import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionIdempotencyCache } from "./transaction-idempotency";

// Mock the DB module
vi.mock("../db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("../db/schema", () => ({
  transactionCache: {
    hash: "hash",
    resultJson: "resultJson",
    expiresAt: "expiresAt",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

const mockResult = {
  hash: "abc123",
  status: "SUCCESS",
  ledger: 100,
  resultXdr: "base64xdr",
};

describe("TransactionIdempotencyCache (DB backend)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default to DB backend
    delete process.env.TRANSACTION_CACHE_BACKEND;
  });

  describe("has()", () => {
    it("should return null on cache miss", async () => {
      const { db } = await import("../db");
      (db.select as any) = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await TransactionIdempotencyCache.has("nonexistent-hash");
      expect(result).toBeNull();
    });

    it("should return cached result on cache hit (non-expired)", async () => {
      const { db } = await import("../db");
      const futureExpiry = new Date(Date.now() + 60_000);
      (db.select as any) = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                hash: "abc123",
                resultJson: JSON.stringify(mockResult),
                expiresAt: futureExpiry,
              },
            ]),
          }),
        }),
      });

      const result = await TransactionIdempotencyCache.has("abc123");
      expect(result).toEqual(mockResult);
    });

    it("should return null and delete expired entries", async () => {
      const { db } = await import("../db");
      const pastExpiry = new Date(Date.now() - 60_000);
      (db.select as any) = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                hash: "abc123",
                resultJson: JSON.stringify(mockResult),
                expiresAt: pastExpiry,
              },
            ]),
          }),
        }),
      });
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      (db.delete as any) = mockDelete;

      const result = await TransactionIdempotencyCache.has("abc123");
      expect(result).toBeNull();
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("set()", () => {
    it("should insert a new cache entry", async () => {
      const { db } = await import("../db");
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db.insert as any) = mockInsert;

      await TransactionIdempotencyCache.set("abc123", mockResult, 3600);
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
