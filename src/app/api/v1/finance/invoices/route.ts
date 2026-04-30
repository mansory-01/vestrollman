import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { db, invoices } from "@/server/db";
import { eq } from "drizzle-orm";

const INVOICE_STATUS_MAP: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  unpaid: "Pending",
  overdue: "Overdue",
  paid: "Paid",
  rejected: "Rejected",
};

function formatDate(date: Date): string {
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
      return ApiResponse.success([], "Invoices retrieved successfully");
    }

    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.organizationId, user.organizationId));

    const data = rows.map((inv) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      title: inv.title,
      amount: inv.amount,
      paidIn: inv.paidIn === "fiat" ? "USD" : "USDT",
      status: INVOICE_STATUS_MAP[inv.status] ?? inv.status,
      issueDate: formatDate(inv.issueDate),
    }));

    return ApiResponse.success(data, "Invoices retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[List Invoices Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
