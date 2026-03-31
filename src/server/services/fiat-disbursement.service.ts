import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, fiatTransactions, organizations, users } from "@/server/db";
import { createFiatProvider, type FiatProviderPreference } from "@/server/services/fiat";
import type { CreateDisbursementInput } from "@/server/validations/finance.schema";
import {
  ForbiddenError,
  NotFoundError,
} from "@/server/utils/errors";

function buildDisbursementReference(organizationId: string): string {
  const compactOrgId = organizationId.replace(/-/g, "").slice(0, 12);
  return `dsb_${compactOrgId}_${randomUUID().replace(/-/g, "")}`;
}

export class FiatDisbursementService {
  static async create(userId: string, input: CreateDisbursementInput) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
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

    const providerPreference: FiatProviderPreference =
      organization.providerPreference;

    const provider = createFiatProvider(providerPreference);
    const reference = buildDisbursementReference(organization.id);

    const disbursement = await provider.disburse({
      amount: input.amount,
      reference,
      narration: input.narration,
      destinationBankCode: input.destinationBankCode,
      destinationAccountNumber: input.destinationAccountNumber,
      destinationAccountName: input.destinationAccountName,
      currency: input.currency,
    });

    await db.insert(fiatTransactions).values({
      organizationId: organization.id,
      amount: BigInt(input.amount),
      type: "payout",
      status: disbursement.status,
      provider: providerPreference,
      providerReference: disbursement.providerReference,
      metadata: {
        reference: disbursement.reference,
        fee: disbursement.fee,
        narration: input.narration,
      },
    });

    return {
      reference: disbursement.reference,
      provider: providerPreference,
      providerReference: disbursement.providerReference,
      status: disbursement.status,
      amount: disbursement.amount,
      fee: disbursement.fee,
    };
  }
}
