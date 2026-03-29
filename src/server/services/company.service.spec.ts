/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyService } from "./company.service";

const { db } = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../db", () => ({
  db,
  users: {
    id: "users.id",
    organizationId: "users.organizationId",
  },
  organizations: {
    id: "organizations.id",
    name: "organizations.name",
    slug: "organizations.slug",
    providerPreference: "organizations.providerPreference",
    deletedAt: "organizations.deletedAt",
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

describe("CompanyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns providerPreference in company profile", async () => {
    db.select
      .mockReturnValueOnce(mockSelectRows([{ organizationId: "org-1" }]))
      .mockReturnValueOnce(
        mockSelectRows([
          {
            id: "org-1",
            name: "Acme",
            industry: "Fintech",
            registrationNumber: "RC-123",
            providerPreference: "monnify",
            registeredStreet: null,
            registeredCity: null,
            registeredState: null,
            registeredPostalCode: null,
            registeredCountry: null,
            billingStreet: null,
            billingCity: null,
            billingState: null,
            billingPostalCode: null,
            billingCountry: null,
          },
        ]),
      );

    const result = await CompanyService.getProfile("user-1");

    expect(result.providerPreference).toBe("monnify");
  });

  it("updates provider preference and persists via organizations table", async () => {
    db.select
      .mockReturnValueOnce(mockSelectRows([{ organizationId: "org-1" }]))
      .mockReturnValueOnce(
        mockSelectRows([
          {
            id: "org-1",
            name: "Acme",
            industry: "Fintech",
            registrationNumber: "RC-123",
            providerPreference: "monnify",
            registeredStreet: null,
            registeredCity: null,
            registeredState: null,
            registeredPostalCode: null,
            registeredCountry: null,
            billingStreet: null,
            billingCity: null,
            billingState: null,
            billingPostalCode: null,
            billingCountry: null,
          },
        ]),
      );

    const returning = vi.fn().mockResolvedValue([
      {
        id: "org-1",
        name: "Acme",
        industry: "Fintech",
        registrationNumber: "RC-123",
        providerPreference: "flutterwave",
        registeredStreet: null,
        registeredCity: null,
        registeredState: null,
        registeredPostalCode: null,
        registeredCountry: null,
        billingStreet: null,
        billingCity: null,
        billingState: null,
        billingPostalCode: null,
        billingCountry: null,
      },
    ]);

    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });

    db.update.mockReturnValue({ set });

    const result = await CompanyService.updateCompanyProfile("user-1", {
      providerPreference: "flutterwave",
    });

    expect(db.update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        providerPreference: "flutterwave",
        updatedAt: expect.any(Date),
      }),
    );
    expect(result.providerPreference).toBe("flutterwave");
  });
});
