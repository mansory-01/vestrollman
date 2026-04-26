import { AuthService } from "@/server/services/auth.service";
import { LoginSchema } from "@/server/validations/login.schema";
import { ApiResponse } from "@/server/utils/api-response";
import { withHandler } from "@/server/utils/with-error-handler";

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email/username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or username
 *               password:
 *                 type: string
 *                 format: password
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized - Invalid credentials
 *       400:
 *         description: Bad request - Validation error
 */
export const POST = withHandler(
  { schema: LoginSchema },
  async (_req, { body, metadata }) => {
    const result = await AuthService.login(body, {
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return ApiResponse.success(result, result.message);
  }
);
