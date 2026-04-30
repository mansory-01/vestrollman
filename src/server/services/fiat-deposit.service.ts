import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, fiatTransactions, organizations, users } from "@/server/db";
import { createFiatProvider, type FiatProviderPreference } from "@/server/services/fiat";
import type { CreateDepositInput } from "@/server/validations/finance.schema";
import {
  ForbiddenError,
  NotFoundError,
} from "@/server/utils/errors";

function buildDepositReference(organizationId: string): string {
  const compactOrgId = organizationId.replace(/-/g, "").slice(0, 12);
  return `dep_${compactOrgId}_${randomUUID().replace(/-/g, "")}`;
}

export class FiatDepositService {
  static async initialize(userId: string, input: CreateDepositInput) {
    const [user] = await db
      .select({ organizationId: users.organizationId, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      throw new ForbiddenError("User is not associated with any organization");
    }

    const [organization] = await db
      .select({
        id: organizations.id,
        providerPreference: organizations.providerPreference,
        name: organizations.name,
      })
      .from(organizations)
      .where(
        and(
          eq(organizations.id, user.organizationId),
          isNull(organizations.deletedAt),
        ),
      )
      .limit(1);

    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    // Use the provider preference from the input if provided, otherwise use organization's preference
    const providerPreference: FiatProviderPreference = input.provider || organization.providerPreference || "monnify";

    const provider = createFiatProvider(providerPreference);
    const reference = buildDepositReference(organization.id);

    // Convert amount to kobo for storage (NGN * 100)
    const amountInKobo = Math.round(input.amount * 100);

    const deposit = await provider.initializePayment({
      amount: amountInKobo,
      reference,
      customerEmail: user.email,
      customerName: organization.name,
      currency: "NGN",
      redirectUrl: input.redirectUrl,
    });

    // Store the transaction in the database
    await db.insert(fiatTransactions).values({
      organizationId: organization.id,
      amount: BigInt(amountInKobo),
      type: "deposit",
      status: "pending",
      provider: providerPreference,
      providerReference: reference,
      reference: deposit.reference,
      metadata: {
        checkoutUrl: deposit.checkoutUrl,
        paymentUrl: deposit.paymentUrl,
        authorizationUrl: deposit.authorizationUrl,
      },
    });

    return {
      reference: deposit.reference,
      provider: providerPreference,
      checkoutUrl: deposit.checkoutUrl,
      paymentUrl: deposit.paymentUrl,
      authorizationUrl: deposit.authorizationUrl,
      status: deposit.status,
      amount: input.amount,
      currency: deposit.currency,
    };
  }
}
