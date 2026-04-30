import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { FiatDepositService } from "@/server/services/fiat-deposit.service";
import { CreateDepositSchema } from "@/server/validations/finance.schema";
import { withHandler } from "@/server/utils/with-error-handler";

/**
 * @swagger
 * /finance/fiat/deposit:
 *   post:
 *     summary: Initialize a fiat wallet deposit
 *     description: Initialize a deposit transaction via payment gateway (Monnify/Flutterwave) for funding the organization's fiat wallet.
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
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Deposit amount in NGN
 *               provider:
 *                 type: string
 *                 enum: [monnify, flutterwave]
 *                 default: monnify
 *                 description: Payment gateway provider to use
 *               redirectUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect to after payment completion
 *     responses:
 *       200:
 *         description: Deposit initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     provider:
 *                       type: string
 *                     checkoutUrl:
 *                       type: string
 *                     paymentUrl:
 *                       type: string
 *                     authorizationUrl:
 *                       type: string
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request - Validation error
 */
export const POST = withHandler(
  { schema: CreateDepositSchema },
  async (req: NextRequest, { body, metadata }) => {
    const { user } = await AuthUtils.authenticateRequestOrRefreshCookie(req);
    
    const result = await FiatDepositService.initialize(user.id, body);

    return ApiResponse.success(result, "Deposit initialized successfully. Please complete the payment.");
  }
);
