import { z } from "zod";
import { LoginOTPService } from "@/server/services/login-otp.service";
import { ApiResponse } from "@/server/utils/api-response";
import { withHandler } from "@/server/utils/with-error-handler";

const VerifyLoginOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * @swagger
 * /auth/verify-login-otp:
 *   post:
 *     summary: Verify login OTP and issue tokens
 *     description: Verifies the OTP sent after password login and returns access/refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OTP verified — tokens issued
 *       400:
 *         description: Invalid or expired OTP
 *       403:
 *         description: Too many attempts
 */
export const POST = withHandler(
  { schema: VerifyLoginOTPSchema },
  async (_req, { body, metadata }) => {
    const result = await LoginOTPService.verifyLoginOTP(
      body.email,
      body.otp,
      body.rememberMe ?? false,
      { ipAddress: metadata.ipAddress, userAgent: metadata.userAgent },
    );

    const response = ApiResponse.success(result, "Login successful");

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: body.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    };

    response.cookies.set("refreshToken", result.refreshToken, cookieOptions);

    return response;
  },
);
