import { eq, sql } from "drizzle-orm";
import { db, users, userStatusEnum, signerTypeEnum } from "../db";
import { AuditLogService } from "./audit-log.service";
import type { PgTransaction } from "drizzle-orm/pg-core";

export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type SignerType = (typeof signerTypeEnum.enumValues)[number];

// Whitelist of allowed domains for avatar URLs
const ALLOWED_AVATAR_DOMAINS = [
  "vestroll-assets.s3.amazonaws.com",
  "res.cloudinary.com",
  "s3.amazonaws.com",
  "storage.googleapis.com",
];

/**
 * Validates that an avatar URL points to an allowed domain.
 * 
 * @param avatarUrl - The URL to validate.
 * @throws {Error} If the URL is invalid or the domain is not whitelisted.
 */
function validateAvatarUrl(avatarUrl: string | null | undefined): void {
  if (!avatarUrl) return;

  try {
    const url = new URL(avatarUrl);
    const hostname = url.hostname.toLowerCase();

    const isAllowed = ALLOWED_AVATAR_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) {
      throw new Error(
        `Avatar URL domain '${hostname}' is not allowed. Allowed domains: ${ALLOWED_AVATAR_DOMAINS.join(", ")}`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Avatar URL domain")) {
      throw error;
    }
    throw new Error("Invalid avatar URL format");
  }
}

/**
 * UserService handles user-related database operations and profile management.
 */
export class UserService {
  /**
   * Finds a user by their email address.
   */
  static async findByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1);

    return user || null;
  }

  /**
   * Creates a new user record.
   */
  static async create(
    data: {
      firstName: string;
      lastName: string;
      email: string;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx?: PgTransaction<any, any, any>,
  ) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const executor = tx || db;

    const [user] = await executor
      .insert(users)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: normalizedEmail,
        status: "pending_verification",
      })
      .returning();

    return user;
  }

  /**
   * Finds a user by their unique ID.
   */
  static async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  /**
   * Updates an existing user's profile and logs security-sensitive changes.
   */
  static async update(
    userId: string,
    data: Partial<typeof users.$inferInsert>,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    const oldUser = await this.findById(userId);
    if (!oldUser) return null;

    if (data.avatarUrl !== undefined && data.avatarUrl !== null) {
      validateAvatarUrl(data.avatarUrl);
    }

    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser) {
      if (data.email && data.email !== oldUser.email) {
        await AuditLogService.logEmailChange({
          userId,
          oldEmail: oldUser.email,
          newEmail: updatedUser.email,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        });
      }
      if (data.role && data.role !== oldUser.role) {
        await AuditLogService.logRoleChange({
          userId,
          oldRole: oldUser.role || "N/A",
          newRole: updatedUser.role || "N/A",
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        });
      }
    }

    return updatedUser || null;
  }
}
