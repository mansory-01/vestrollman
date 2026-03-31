import { NextRequest } from "next/server";
import { ApiResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/errors";
import { AuthUtils } from "@/server/utils/auth";
import { CompanyService } from "@/server/services/company.service";
import { updateCompanyProfileSchema } from "@/server/validations/company.schema";

/**
 * @swagger
 * /company/profile:
 *   get:
 *     summary: Get company profile
 *     description: Return the authenticated user's organization legal and contact details
 *     tags: [General]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 industry:
 *                   type: string
 *                   nullable: true
 *                 registrationNumber:
 *                   type: string
 *                   nullable: true
 *                 providerPreference:
 *                   type: string
 *                   enum: [monnify, flutterwave]
 *                 registered:
 *                   type: object
 *                   properties:
 *                     street:
 *                       type: string
 *                       nullable: true
 *                     city:
 *                       type: string
 *                       nullable: true
 *                     state:
 *                       type: string
 *                       nullable: true
 *                     postalCode:
 *                       type: string
 *                       nullable: true
 *                     country:
 *                       type: string
 *                       nullable: true
 *                 billing:
 *                   type: object
 *                   properties:
 *                     street:
 *                       type: string
 *                       nullable: true
 *                     city:
 *                       type: string
 *                       nullable: true
 *                     state:
 *                       type: string
 *                       nullable: true
 *                     postalCode:
 *                       type: string
 *                       nullable: true
 *                     country:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: User not associated with an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);

    const profile = await CompanyService.getProfile(userId);

    return ApiResponse.success(profile, "Company profile retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Company Profile Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}

/**
 * @swagger
 * /company/profile:
 *   put:
 *     summary: Update company profile
 *     description: Update the authenticated user's organization profile and fiat provider preference
 *     tags: [General]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               industry:
 *                 type: string
 *                 nullable: true
 *               registrationNumber:
 *                 type: string
 *                 nullable: true
 *               providerPreference:
 *                 type: string
 *                 enum: [monnify, flutterwave]
 *               registered:
 *                 type: object
 *               billing:
 *                 type: object
 *     responses:
 *       200:
 *         description: Company profile updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not associated with an organization
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await AuthUtils.authenticateRequest(req);
    const payload = await req.json();

    const parsed = updateCompanyProfileSchema.safeParse(payload);
    if (!parsed.success) {
      return ApiResponse.error(
        "Invalid request body",
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const profile = await CompanyService.updateCompanyProfile(userId, parsed.data);

    return ApiResponse.success(profile, "Company profile updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode, error.errors);
    }

    console.error("[Update Company Profile Error]", error);
    return ApiResponse.error("Internal server error", 500);
  }
}
