import { db, users, organizations } from "../db";
import { eq, isNull, and } from "drizzle-orm";
import { BadRequestError, NotFoundError } from "../utils/errors";

export type FiatProviderPreference = "monnify" | "flutterwave";

export interface CompanyProfile {
  name: string;
  industry: string | null;
  registrationNumber: string | null;
  providerPreference: FiatProviderPreference;
  registered: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  billing: {
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
}

export interface UpdateCompanyProfileInput {
  name?: string;
  industry?: string | null;
  registrationNumber?: string | null;
  providerPreference?: FiatProviderPreference;
  registered?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  billing?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
}

export class CompanyService {
  private static mapOrganizationToProfile(
    org: typeof organizations.$inferSelect,
  ): CompanyProfile {
    return {
      name: org.name,
      industry: org.industry,
      registrationNumber: org.registrationNumber,
      providerPreference: org.providerPreference,
      registered: {
        street: org.registeredStreet,
        city: org.registeredCity,
        state: org.registeredState,
        postalCode: org.registeredPostalCode,
        country: org.registeredCountry,
      },
      billing: {
        street: org.billingStreet,
        city: org.billingCity,
        state: org.billingState,
        postalCode: org.billingPostalCode,
        country: org.billingCountry,
      },
    };
  }

  private static async getUserOrganization(userId: string) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new NotFoundError("User is not associated with an organization");
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, user.organizationId),
          isNull(organizations.deletedAt),
        ),
      )
      .limit(1);

    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    return org;
  }

  static async getProfile(userId: string): Promise<CompanyProfile> {
    const org = await this.getUserOrganization(userId);
    return this.mapOrganizationToProfile(org);
  }

  static async updateCompanyProfile(
    userId: string,
    data: UpdateCompanyProfileInput,
  ): Promise<CompanyProfile> {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestError("Request body is required");
    }

    const org = await this.getUserOrganization(userId);

    const [updatedOrg] = await db
      .update(organizations)
      .set({
        name: data.name ?? org.name,
        industry: data.industry ?? org.industry,
        registrationNumber: data.registrationNumber ?? org.registrationNumber,
        providerPreference: data.providerPreference ?? org.providerPreference,
        registeredStreet: data.registered?.street ?? org.registeredStreet,
        registeredCity: data.registered?.city ?? org.registeredCity,
        registeredState: data.registered?.state ?? org.registeredState,
        registeredPostalCode:
          data.registered?.postalCode ?? org.registeredPostalCode,
        registeredCountry: data.registered?.country ?? org.registeredCountry,
        billingStreet: data.billing?.street ?? org.billingStreet,
        billingCity: data.billing?.city ?? org.billingCity,
        billingState: data.billing?.state ?? org.billingState,
        billingPostalCode: data.billing?.postalCode ?? org.billingPostalCode,
        billingCountry: data.billing?.country ?? org.billingCountry,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id))
      .returning();

    if (!updatedOrg) {
      throw new NotFoundError("Organization not found");
    }

    return this.mapOrganizationToProfile(updatedOrg);
  }
}
