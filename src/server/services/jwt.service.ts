import * as jose from "jose";
import { InvalidTokenError, TokenExpiredError } from "../utils/errors";

export interface JWTPayload extends jose.JWTPayload {
  userId: string;
  email: string;
}

/**
 * JWTService handles the generation and verification of Access and Refresh tokens
 * using the HS256 algorithm. It uses the `jose` library for edge-compatibility.
 */
export class JWTService {
  /**
   * Normalizes expiration strings. If a value is provided in milliseconds (e.g., "100ms"),
   * it converts it to a Unix timestamp in seconds for compatible JWT expiration.
   * 
   * @param expiration - Expiration string (e.g., "15m", "7d", "100ms").
   * @returns Normalized expiration as a string or absolute Unix timestamp.
   */
  private static normalizeExpiration(expiration: string): string | number {
    const msMatch = expiration.match(/^(\d+)ms$/);
    if (!msMatch) {
      return expiration;
    }

    const ms = Number(msMatch[1]);
    return Math.floor((Date.now() + ms) / 1000);
  }

  private static get ACCESS_SECRET() {
    return new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "");
  }
  private static get REFRESH_SECRET() {
    return new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "");
  }
  private static get ACCESS_EXPIRATION() {
    return process.env.JWT_ACCESS_EXPIRATION || "15m";
  }
  private static get REFRESH_EXPIRATION() {
    return process.env.JWT_REFRESH_EXPIRATION || "7d";
  }

  /**
   * Generates a signed Access Token.
   * 
   * @param payload - User data to include in the token.
   * @returns A signed JWT string.
   * @throws {Error} If JWT_ACCESS_SECRET is not configured.
   */
  static async generateAccessToken(payload: JWTPayload): Promise<string> {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.normalizeExpiration(this.ACCESS_EXPIRATION))
      .sign(this.ACCESS_SECRET);
  }

  /**
   * Generates a signed Refresh Token.
   * 
   * @param payload - User data to include in the token.
   * @returns A signed JWT string.
   * @throws {Error} If JWT_REFRESH_SECRET is not configured.
   */
  static async generateRefreshToken(payload: JWTPayload): Promise<string> {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.normalizeExpiration(this.REFRESH_EXPIRATION))
      .sign(this.REFRESH_SECRET);
  }

  /**
   * Verifies an Access Token and returns its payload.
   * 
   * @param token - The JWT string to verify.
   * @returns The decoded payload.
   * @throws {TokenExpiredError} If the token has expired.
   * @throws {InvalidTokenError} If the token is invalid.
   */
  static async verifyAccessToken(token: string): Promise<JWTPayload> {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET is not configured");
    }

    try {
      const { payload } = await jose.jwtVerify(token, this.ACCESS_SECRET);
      return payload as JWTPayload;
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new TokenExpiredError("Access token has expired");
      }
      throw new InvalidTokenError("Invalid access token");
    }
  }

  /**
   * Verifies a Refresh Token and returns its payload.
   * 
   * @param token - The JWT string to verify.
   * @returns The decoded payload.
   * @throws {TokenExpiredError} If the token has expired.
   * @throws {InvalidTokenError} If the token is invalid.
   */
  static async verifyRefreshToken(token: string): Promise<JWTPayload> {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }

    try {
      const { payload } = await jose.jwtVerify(token, this.REFRESH_SECRET);
      return payload as JWTPayload;
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new TokenExpiredError("Refresh token has expired");
      }
      throw new InvalidTokenError("Invalid refresh token");
    }
  }
}
