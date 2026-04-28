import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { PayrollService } from "@/server/services/payroll.service";
import { db, invoices, employees } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { users } from "@/server/db/schema";

const RunPayrollSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).min(1, "At least one invoice is required"),
  providerId: z.enum(["monnify", "flutterwave"]).default("monnify"),
});

/**
 * @swagger
 * /finance/payroll:
 *   get:
 *     summary: List pending payroll invoices
 *     description: Returns all pending invoices with employee details for the authenticated organization.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending payroll items retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequestOrRefreshCookie(req);

    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      return ApiResponse.error("User is not associated with any organization", 403);
    }

    const pendingInvoices = await db
      .select({
        id: invoices.id,
        invoiceNo: invoices.invoiceNo,
        title: invoices.title,
        amount: invoices.amount,
        paidIn: invoices.paidIn,
        status: invoices.status,
        issueDate: invoices.issueDate,
        employeeId: invoices.employeeId,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        employeeEmail: employees.email,
        employeeRole: employees.role,
        employeeAvatarUrl: employees.avatarUrl,
      })
      .from(invoices)
      .innerJoin(employees, eq(invoices.employeeId, employees.id))
      .where(
        and(
          eq(invoices.organizationId, user.organizationId),
          eq(invoices.status, "pending"),
        ),
      );

    const data = pendingInvoices.map((row: typeof pendingInvoices[number]) => ({
      id: row.id,
      invoiceNo: row.invoiceNo,
      title: row.title,
      amount: row.amount,
      paidIn: row.paidIn,
      status: row.status,
      issueDate: row.issueDate,
      employee: {
        id: row.employeeId,
        firstName: row.employeeFirstName,
        lastName: row.employeeLastName,
        email: row.employeeEmail,
        role: row.employeeRole,
        avatarUrl: row.employeeAvatarUrl,
      },
    }));

    return ApiResponse.success(data, "Pending payroll items retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[Finance Payroll GET Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}

/**
 * @swagger
 * /finance/payroll:
 *   post:
 *     summary: Execute payroll
 *     description: Processes payroll for a list of pending invoice IDs using the organization's payment provider.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceIds
 *             properties:
 *               invoiceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               providerId:
 *                 type: string
 *                 enum: [monnify, flutterwave]
 *     responses:
 *       200:
 *         description: Payroll executed successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequestOrRefreshCookie(req);

    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) {
      return ApiResponse.error("User is not associated with any organization", 403);
    }

    const body = await req.json();
    const parsed = RunPayrollSchema.safeParse(body);

    if (!parsed.success) {
      return ApiResponse.error(
        "Invalid request body",
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const results = await PayrollService.runPayroll(
      user.organizationId,
      parsed.data.invoiceIds,
      parsed.data.providerId,
    );

    const succeeded = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return ApiResponse.success(
      { results, succeeded, failed, total: results.length },
      `Payroll processed: ${succeeded} succeeded, ${failed} failed`,
    );
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }
    console.error("[Finance Payroll POST Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
