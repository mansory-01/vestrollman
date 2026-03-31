import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import {
  CreateDisbursementSchema,
} from "@/server/validations/finance.schema";
import { FiatDisbursementService } from "@/server/services/fiat-disbursement.service";

/**
 * @swagger
 * /finance/disbursements:
 *   post:
 *     summary: Create a fiat disbursement
 *     description: Initiate a bank payout for the authenticated organization using its configured provider preference.
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
 *               - amount
 *               - destinationBankCode
 *               - destinationAccountNumber
 *               - destinationAccountName
 *               - narration
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Amount in kobo.
 *               destinationBankCode:
 *                 type: string
 *               destinationAccountNumber:
 *                 type: string
 *               destinationAccountName:
 *                 type: string
 *               narration:
 *                 type: string
 *               currency:
 *                 type: string
 *                 enum: [NGN]
 *     responses:
 *       200:
 *         description: Disbursement initiated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequestOrRefreshCookie(req);
    const payload = await req.json();

    const parsed = CreateDisbursementSchema.safeParse(payload);
    if (!parsed.success) {
      return ApiResponse.error(
        "Invalid request body",
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await FiatDisbursementService.create(userId, parsed.data);

    return ApiResponse.success(result, "Disbursement initiated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Create Disbursement Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
