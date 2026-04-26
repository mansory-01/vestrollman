import { db, emailVerifications, users } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { OTPService } from "./otp.service";
import { EmailService } from "./email.service";
import { UserService } from "./user.service";
import { JWTTokenService } from "./jwt-token.service";
import { SessionManagementService } from "./session-management.service";
import { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError } from "../utils/errors";
import { Logger } from "./logger.service";
import crypto from "crypto";

const OTP_EXPIRATION_MINUTES = 15;
const MAX_ATTEMPTS = 5;

/**
 * Handles the two-step login OTP flow:
 * 1. After password verification, generate and email a login OTP
 * 2. Verify the OTP and issue tokens
 */
export class LoginOTPService {
  /**
   * Generates a fresh login OTP, stores it, and emails it to the user.
   * Called right after password verification succeeds.
   */
  static async sendLoginOTP(userId: string, email: string, firstName: string): Promise<void> {
    const otp = OTPService.generateOTP();
    const otpHash = await OTPService.hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    // Invalidate any existing unverified records for this user
    await db
      .update(emailVerifications)
      .set({ verified: true }) // mark old ones as consumed so they can't be used
      .where(
        and(
          eq(emailVerifications.userId, userId),
          eq(emailVerifications.verified, false),
        ),
      );

    // Insert fresh OTP record
    await db.insert(emailVerifications).values({
      userId,
      otpHash,
      expiresAt,
    });

    Logger.info("Login OTP generated and sent", { email });

    // Fire email
    await EmailService.sendVerificationOTPEmail(email, firstName, otp);
  }

  /**
   * Verifies the login OTP and issues access/refresh tokens on success.
   */
  static async verifyLoginOTP(
    email: string,
    otp: string,
    rememberMe: boolean,
    metadata: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await UserService.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.status !== "active") {
      throw new ForbiddenError("Account verification pending. Please check your email.");
    }

    const [verificationRecord] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.userId, user.id),
          eq(emailVerifications.verified, false),
        ),
      )
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);

    if (!verificationRecord) {
      throw new BadRequestError("No pending OTP found. Please log in again.");
    }

    if (verificationRecord.attempts >= MAX_ATTEMPTS) {
      throw new ForbiddenError("Too many failed attempts. Please log in again to get a new code.");
    }

    const now = new Date();
    if (verificationRecord.expiresAt < now) {
      throw new BadRequestError("OTP has expired. Please log in again.");
    }

    const isValid = await OTPService.verifyOTP(otp, verificationRecord.otpHash);
    if (!isValid) {
      const newAttempts = verificationRecord.attempts + 1;
      await db
        .update(emailVerifications)
        .set({ attempts: newAttempts })
        .where(eq(emailVerifications.id, verificationRecord.id));

      const remaining = MAX_ATTEMPTS - newAttempts;
      if (remaining <= 0) {
        throw new ForbiddenError("Too many failed attempts. Please log in again.");
      }
      throw new BadRequestError(
        `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      );
    }

    // Mark OTP as consumed
    await db
      .update(emailVerifications)
      .set({ verified: true })
      .where(eq(emailVerifications.id, verificationRecord.id));

    // Issue tokens
    const sessionId = crypto.randomUUID();

    const accessToken = await JWTTokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = await JWTTokenService.generateRefreshToken(
      { userId: user.id, email: user.email, sessionId },
      rememberMe,
    );

    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);

    await SessionManagementService.createSession(
      user.id,
      refreshToken,
      metadata.userAgent,
      expiresAt,
      sessionId,
    );

    Logger.info("Login OTP verified — session issued", { email });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
