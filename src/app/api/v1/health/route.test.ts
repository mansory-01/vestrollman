import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

const { mockBlockchainService, mockLogger, pingDbMock } = vi.hoisted(() => ({
  mockBlockchainService: {
    isHealthy: vi.fn(),
    getLedgerHealth: vi.fn(),
  },
  mockLogger: {
    error: vi.fn(),
  },
  pingDbMock: vi.fn(),
}));

vi.mock("@/server/services/blockchain.service", () => ({
  BlockchainService: vi.fn(function MockBlockchainService() {
    return mockBlockchainService;
  }),
}));

vi.mock("@/server/services/logger.service", () => ({
  Logger: mockLogger,
}));

vi.mock("@/server/utils/ping-db", () => ({
  pingDb: pingDbMock,
}));

vi.mock("@/server/utils/service-discovery", () => ({
  getServiceDiscovery: vi.fn(() => ({
    rpcUrl: "https://rpc.example.test",
    horizonUrl: "https://horizon.example.test",
  })),
}));

describe("GET /api/v1/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pingDbMock.mockResolvedValue(true);
  });

  const createMockRequest = (): NextRequest => {
    return {
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  it("should return healthy status with ledger age", async () => {
    pingDbMock.mockResolvedValue(true);
    mockBlockchainService.isHealthy.mockResolvedValue(true);
    mockBlockchainService.getLedgerHealth.mockResolvedValue({
      ledger: 1234,
      ledgerAgeSeconds: 12,
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe("System is healthy");
    expect(data.data.ledger).toBe(1234);
    expect(data.data.ledgerAgeSeconds).toBe(12);
    expect(data.data.status).toBe("healthy");
  });

  it("should return degraded status when ledger age exceeds 60 seconds", async () => {
    pingDbMock.mockResolvedValue(true);
    mockBlockchainService.isHealthy.mockResolvedValue(true);
    mockBlockchainService.getLedgerHealth.mockResolvedValue({
      ledger: 1234,
      ledgerAgeSeconds: 61,
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("System is degraded");
    expect(data.data.status).toBe("degraded");
    expect(data.data.ledgerAgeSeconds).toBe(61);
  });

  it("should return unhealthy when the RPC is unreachable even if ledger data is present", async () => {
    pingDbMock.mockResolvedValue(true);
    mockBlockchainService.isHealthy.mockResolvedValue(false);
    mockBlockchainService.getLedgerHealth.mockResolvedValue({
      ledger: 1234,
      ledgerAgeSeconds: 12,
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.message).toBe("System is unhealthy");
    expect(data.status).toBe(503);
  });

  it("should return a 503 response when ledger health lookup fails", async () => {
    pingDbMock.mockResolvedValue(true);
    mockBlockchainService.isHealthy.mockResolvedValue(true);
    mockBlockchainService.getLedgerHealth.mockRejectedValue(
      new Error("Horizon unavailable"),
    );

    const response = await GET(createMockRequest());

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("System is unhealthy");
  });
});
