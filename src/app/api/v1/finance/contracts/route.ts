import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { db, contracts } from "@/server/db";
import { eq } from "drizzle-orm";

const CONTRACT_STATUS_MAP: Record<string, string> = {
  pending_signature: "In Review",
  in_review: "In Review",
  rejected: "Rejected",
  active: "Active",
  completed: "Completed",
};

const CONTRACT_TYPE_MAP: Record<string, string> = {
  fixed_rate: "Fixed rate",
  pay_as_you_go: "Pay as you go",
  milestone: "Milestone",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      ({ user } = await AuthUtils.authenticateRequestOrRefreshCookie(req));
    } catch {
      return ApiResponse.error("Unauthorized", 401);
    }

    if (!user.organizationId) {
      return ApiResponse.success([], "Contracts retrieved successfully");
    }

    const rows = await db
      .select()
      .from(contracts)
      .where(eq(contracts.organizationId, user.organizationId));

    const data = rows.map((c) => ({
      id: c.id,
      title: c.title,
      amount: c.amount,
      paymentType: c.paymentType === "fiat" ? 1 : 2,
      contractType: CONTRACT_TYPE_MAP[c.contractType] ?? c.contractType,
      status: CONTRACT_STATUS_MAP[c.status] ?? c.status,
      period: {
        startDate: formatDate(c.startDate),
        endDate: formatDate(c.endDate ?? undefined),
      },
    }));

    return ApiResponse.success(data, "Contracts retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[List Contracts Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
