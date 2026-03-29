/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FiatDisbursementService } from "./fiat-disbursement.service";

const { db, createFiatProvider } = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
  createFiatProvider: vi.fn(),
}));

vi.mock("@/server/services/fiat", () => ({
  createFiatProvider,
}));

vi.mock("@/server/db", () => ({
  db,
  users: {
    id: "users.id",
    organizationId: "users.organizationId",
  },
  organizations: {
    id: "organizations.id",
    providerPreference: "organizations.providerPreference",
    deletedAt: "organizations.deletedAt",
  },
  fiatTransactions: {
    tableName: "fiat_transactions",
  },
}));

function mockSelectRows(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

describe("FiatDisbursementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses organization monnify preference to create disbursement", async () => {
    db.select
      .mockReturnValueOnce(mockSelectRows([{ organizationId: "org-1" }]))
      .mockReturnValueOnce(
        mockSelectRows([{ id: "org-1", providerPreference: "monnify" }]),
      );

    const disburse = vi.fn().mockResolvedValue({
      reference: "ref-1",
      providerReference: "mnfy-123",
      status: "pending",
      amount: 50000,
      fee: 100,
    });

    createFiatProvider.mockReturnValue({ disburse });

    const values = vi.fn().mockResolvedValue(undefined);
    db.insert.mockReturnValue({ values });

    const result = await FiatDisbursementService.create("user-1", {
      amount: 50000,
      destinationBankCode: "058",
      destinationAccountNumber: "0123456789",
      destinationAccountName: "Jane Doe",
      narration: "Payroll payout",
      currency: "NGN",
    });

    expect(createFiatProvider).toHaveBeenCalledWith("monnify");
    expect(disburse).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        provider: "monnify",
        providerReference: "mnfy-123",
      }),
    );
    expect(result.provider).toBe("monnify");
  });

  it("uses organization flutterwave preference to create disbursement", async () => {
    db.select
      .mockReturnValueOnce(mockSelectRows([{ organizationId: "org-2" }]))
      .mockReturnValueOnce(
        mockSelectRows([{ id: "org-2", providerPreference: "flutterwave" }]),
      );

    const disburse = vi.fn().mockResolvedValue({
      reference: "ref-2",
      providerReference: "flw-123",
      status: "pending",
      amount: 20000,
      fee: 50,
    });

    createFiatProvider.mockReturnValue({ disburse });

    const values = vi.fn().mockResolvedValue(undefined);
    db.insert.mockReturnValue({ values });

    const result = await FiatDisbursementService.create("user-2", {
      amount: 20000,
      destinationBankCode: "033",
      destinationAccountNumber: "9876543210",
      destinationAccountName: "John Doe",
      narration: "Contract payout",
      currency: "NGN",
    });

    expect(createFiatProvider).toHaveBeenCalledWith("flutterwave");
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-2",
        provider: "flutterwave",
        providerReference: "flw-123",
      }),
    );
    expect(result.provider).toBe("flutterwave");
  });
});
