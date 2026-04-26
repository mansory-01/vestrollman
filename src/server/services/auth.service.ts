import {
  db,
  emailVerifications,
  users,
  organizations,
  loginAttempts,
  biometricLogs,
  passkeyRegistrationChallenges,
} from "../db";
import crypto from "crypto";
import { generateSlug } from "../utils/slug";
import { AuditLogService } from "./audit-log.service";
import { OTP_EXPIRATION_MINUTES } from "./email-verification.service";
import { UserService } from "./user.service";
import { OTPService } from "./otp.service";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
} from "../utils/errors";
import { PasswordVerificationService } from "./password-verification.service";
import { JWTTokenService } from "./jwt-token.service";
import { SessionManagementService } from "./session-management.service";
import { AccountLockoutService } from "./account-lockout.service";
import { RateLimitService } from "./rate-limit.service";
import { LoginAttemptService } from "./login-attempt.service";
import { LogoutService } from "./logout.service";
import { and, eq } from "drizzle-orm";
import { LoginInput } from "../validations/login.schema";
import { RegisterInput, PasskeyRegistrationInput } from "../validations/auth.schema";
import { Logger } from "./logger.service";
import { EmailService } from "./email.service";
import { LoginOTPService } from "./login-otp.service";

/** Max age for a passkey registration challenge (WebAuthn-style short TTL). */
const PASSKEY_REGISTRATION_CHALLENGE_TTL_MS = 5 * 60 * 1000;

function hashPasskeyRegistrationChallenge(challenge: string): string {
  return crypto.createHash("sha256").update(challenge, "utf8").digest("hex");
}

/**
 * AuthService handles user registration, authentication (password and passkey),
 * session management, and biometric enrollment.
 */
export class AuthService {
  /**
   * Registers a new user and creates their organization if applicable.
   * Generates and stores an email verification OTP.
   * 
   * @param data - Registration input including user and company details.
   * @returns Object containing user ID, email, and status message.
   * @throws {ConflictError} If the email already exists.
   */
  static async register(data: RegisterInput) {
    const {
      businessEmail,
      password,
      firstName,
      lastName,
      companyName,
      companyIndustry,
      companySize,
      headquarterCountry,
      accountType,
    } = data;

    const existingUser = await UserService.findByEmail(businessEmail);
    if (existingUser) {
      throw new ConflictError("Email already exists");
    }

    const passwordHash = await PasswordVerificationService.hash(password);

    return await db.transaction(async (tx) => {
      let organizationId: string | undefined;

      if (companyName) {
        const slug = generateSlug(companyName);
        const [org] = await tx
          .insert(organizations)
          .values({
            name: companyName,
            slug,
            industry: companyIndustry,
            registeredCountry: headquarterCountry,
          })
          .returning();
        organizationId = org.id;
      }

      const [user] = await tx
        .insert(users)
        .values({
          firstName,
          lastName,
          email: businessEmail.toLowerCase().trim(),
          passwordHash,
          organizationName: companyName,
          organizationId: organizationId ?? null,
          role: accountType === "employer" ? "admin" : "employee",
          status: "pending_verification",
          signerType: "Email",
        })
        .returning();

      const otp = OTPService.generateOTP();
      const otpHash = await OTPService.hashOTP(otp);

      const expiresAt = new Date(
        Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000,
      );

      await tx.insert(emailVerifications).values({
        userId: user.id,
        otpHash,
        expiresAt,
      });

      Logger.info("Email verification OTP generated", { email: businessEmail });
      
      // Send the OTP via email
      await EmailService.sendVerificationOTPEmail(user.email, user.firstName, otp);
      
      if (process.env.NODE_ENV !== "production") {
        Logger.debug("User registered successfully", { email: user.email });
      }

      return {
        userId: user.id,
        email: user.email,
        message: "Verification email sent",
      };
    });
  }

  /**
   * Authenticates a user using email and password.
   * Checks rate limits, account lockout status, and verification status.
   * 
   * @param data - Login credentials.
   * @param metadata - Request metadata (IP, User Agent).
   * @returns Tokens and user profile.
   * @throws {UnauthorizedError} If credentials are invalid.
   * @throws {TooManyRequestsError} If rate limited.
   * @throws {ForbiddenError} If account is locked or unverified.
   */
  static async login(
    data: LoginInput,
    metadata: { ipAddress?: string; userAgent?: string },
  ) {
    const { email, password, rememberMe } = data;

    if (
      metadata.ipAddress &&
      (await RateLimitService.isRateLimited(metadata.ipAddress))
    ) {
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: false,
        failureReason: "Rate limit exceeded",
      });

      if (process.env.NODE_ENV !== "production") {
        Logger.debug("Login attempt blocked due to rate limit", { email });
      }

      throw new TooManyRequestsError(
        "Too many login attempts. Please try again in 15 minutes.",
      );
    }

    const user = await UserService.findByEmail(email);
    if (!user) {
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: false,
        failureReason: "User not found",
      });

      if (process.env.NODE_ENV !== "production") {
        Logger.debug("Login attempt with unknown email", { email });
      }

      throw new UnauthorizedError("Invalid email or password");
    }

    if (AccountLockoutService.isLocked(user)) {
      const unlockTime = user.lockedUntil?.toLocaleTimeString() || "later";
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: false,
        failureReason: "Account locked",
      });

      if (process.env.NODE_ENV !== "production") {
        Logger.debug("Login attempt with locked account", { email });
      }

      throw new ForbiddenError(
        `Account is temporarily locked.Try again after ${unlockTime} `,
      );
    }

    if (user.status !== "active") {
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: false,
        failureReason: "Unverified account",
      });

      if (process.env.NODE_ENV !== "production") {
        Logger.debug("Login attempt with unverified account", { email });
      }

      throw new ForbiddenError(
        "Account verification pending. Please check your email.",
      );
    }

    const isPasswordValid = await PasswordVerificationService.verify(
      password,
      user.passwordHash || "",
    );
    if (!isPasswordValid) {
      await AccountLockoutService.incrementFailures(user.id);
      await LoginAttemptService.logAttempt({
        email,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: false,
        failureReason: "Invalid password",
      });

      if (process.env.NODE_ENV !== "production") {
        Logger.debug("Login attempt with invalid password", { email });
      }

      throw new UnauthorizedError("Invalid email or password");
    }

    await AccountLockoutService.resetFailures(user.id);

    await LoginAttemptService.logAttempt({
      email,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      lastLoginIp: metadata.ipAddress,
      lastLoginUa: metadata.userAgent,
      success: true,
    });

    // Send login OTP via Brevo instead of issuing tokens immediately
    await LoginOTPService.sendLoginOTP(user.id, user.email, user.firstName);

    Logger.info("Login OTP sent", { email: user.email });

    return {
      email: user.email,
      message: "A verification code has been sent to your email.",
    };
  }

  /**
   * Authenticates a user using passkeys (WebAuthn).
   * 
   * @param email - User's email address.
   * @param metadata - Request metadata.
   * @returns Tokens and user profile.
   * @throws {UnauthorizedError} If identity is not found.
   */
  static async passkeyLogin(
    email: string,
    metadata: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await UserService.findByEmail(email);

    if (!user) {
      await db.insert(biometricLogs).values({
        email,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: false,
        failureReason: "User not found",
      });
      throw new UnauthorizedError("Identity not found");
    }

    try {
      await db.insert(biometricLogs).values({
        userId: user.id,
        email: user.email,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: true,
      });

      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          lastLoginIp: metadata.ipAddress,
          lastLoginUa: metadata.userAgent,
        })
        .where(eq(users.id, user.id));

      const sessionId = crypto.randomUUID();
      const accessToken = await JWTTokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const refreshToken = await JWTTokenService.generateRefreshToken(
        {
          userId: user.id,
          email: user.email,
          sessionId,
        },
        true,
      );

      await SessionManagementService.createSession(
        user.id,
        refreshToken,
        metadata.userAgent,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sessionId,
      );

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
    } catch (error) {
      await db.insert(biometricLogs).values({
        userId: user.id,
        email: user.email,
        lastLoginIp: metadata.ipAddress,
        lastLoginUa: metadata.userAgent,
        success: false,
        failureReason: error instanceof Error ? error.message : "Passkey verification failed",
      });
      throw error;
    }
  }

  /**
   * Updates a user's password.
   * 
   * @param userId - ID of the user.
   * @param currentPasswordHash - Existing password hash.
   * @param currentPassword - Current plain-text password.
   * @param newPassword - New plain-text password.
   * @param metadata - Request metadata.
   * @throws {BadRequestError} If account is OAuth-only or new password is same as current.
   * @throws {UnauthorizedError} If current password is incorrect.
   */
  static async changePassword(
    userId: string,
    currentPasswordHash: string | null,
    currentPassword: string,
    newPassword: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    if (!currentPasswordHash) {
      throw new BadRequestError(
        "No password set for this account. Password change is not available for OAuth-only accounts.",
      );
    }

    const isCurrentValid = await PasswordVerificationService.verify(
      currentPassword,
      currentPasswordHash,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isSamePassword = await PasswordVerificationService.verify(
      newPassword,
      currentPasswordHash,
    );
    if (isSamePassword) {
      throw new BadRequestError(
        "New password must be different from current password",
      );
    }

    const newPasswordHash = await PasswordVerificationService.hash(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await AuditLogService.logEvent({
      userId,
      event: "PASSWORD_CHANGE",
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Issues a fresh registration challenge for the user. Replaces any prior unconsumed challenge.
   * Call before `navigator.credentials.create()` (or equivalent); TTL is five minutes.
   * 
   * @param userId - ID of the user requesting the challenge.
   * @returns The generated challenge string.
   */
  static async issuePasskeyRegistrationChallenge(
    userId: string,
  ): Promise<{ challenge: string }> {
    const challenge = crypto.randomBytes(32).toString("base64url");
    const challengeHash = hashPasskeyRegistrationChallenge(challenge);
    const expiresAt = new Date(Date.now() + PASSKEY_REGISTRATION_CHALLENGE_TTL_MS);

    await db
      .delete(passkeyRegistrationChallenges)
      .where(eq(passkeyRegistrationChallenges.userId, userId));

    await db.insert(passkeyRegistrationChallenges).values({
      userId,
      challengeHash,
      expiresAt,
    });

    return { challenge };
  }

  /**
   * Verifies and deletes a passkey registration challenge.
   * 
   * @param userId - ID of the user.
   * @param challenge - The challenge string to consume.
   * @throws {BadRequestError} If challenge is invalid or expired.
   */
  static async consumePasskeyRegistrationChallenge(
    userId: string,
    challenge: string,
  ): Promise<void> {
    const challengeHash = hashPasskeyRegistrationChallenge(challenge);

    const [row] = await db
      .select()
      .from(passkeyRegistrationChallenges)
      .where(
        and(
          eq(passkeyRegistrationChallenges.userId, userId),
          eq(passkeyRegistrationChallenges.challengeHash, challengeHash),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestError("Invalid challenge");
    }

    if (row.expiresAt.getTime() <= Date.now()) {
      await db
        .delete(passkeyRegistrationChallenges)
        .where(eq(passkeyRegistrationChallenges.id, row.id));
      throw new BadRequestError("Expired");
    }

    await db
      .delete(passkeyRegistrationChallenges)
      .where(eq(passkeyRegistrationChallenges.id, row.id));
  }

  /**
   * Enrolls a new biometric credential for the user.
   * 
   * @param userId - ID of the user.
   * @param registration - Passkey registration details.
   * @param metadata - Request metadata.
   */
  static async enrollBiometrics(
    userId: string,
    registration: PasskeyRegistrationInput,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    await AuthService.consumePasskeyRegistrationChallenge(
      userId,
      registration.challenge,
    );

    // TODO: Implement actual biometric enrollment logic (WebAuthn credential storage)

    await AuditLogService.logBiometricEnrollment({
      userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Logs out the user by invalidating the refresh token and session.
   * 
   * @param refreshToken - The refresh token to invalidate.
   * @param metadata - Request metadata.
   */
  static async logout(
    refreshToken?: string | null,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    await LogoutService.logout(refreshToken, metadata);
  }
}
