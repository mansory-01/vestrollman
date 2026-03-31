import * as jose from "jose";
import { Logger } from "./logger.service";

/**
 * JWTTokenService provides advanced JWT operations, including support for
 * asymmetric (RS256) and symmetric (HS256) signing based on environment configuration.
 * It handles rotation and long-lived session tokens.
 */
export class JWTTokenService {
  private static readonly ACCESS_TOKEN_EXPIRY = "15m";
  private static readonly REFRESH_TOKEN_EXPIRY_LONG = "30d";
  private static readonly REFRESH_TOKEN_EXPIRY_SHORT = "7d";

  /**
   * Retrieves the private key for signing.
   * Defaults to HMAC shared secret if PKCS8 key is not provided.
   */
  private static getPrivateKey() {
    const key = process.env.JWT_PRIVATE_KEY;
    if (!key) {
      return new TextEncoder().encode(process.env.JWT_SECRET || "vestroll-fallback-secret");
    }
    return jose.importPKCS8(key, "RS256");
  }

  /**
   * Retrieves the public key for verification.
   * Defaults to HMAC shared secret if SPKI key is not provided.
   */
  private static getPublicKey() {
    const key = process.env.JWT_PUBLIC_KEY;
    if (!key) {
      return new TextEncoder().encode(process.env.JWT_SECRET || "vestroll-fallback-secret");
    }
    return jose.importSPKI(key, "RS256");
  }

  /**
   * Generates a signed Access Token.
   * 
   * @param payload - User data (userId, email).
   * @returns A signed JWT string.
   */
  static async generateAccessToken(payload: { userId: string; email: string }): Promise<string> {
    const key = await this.getPrivateKey();
    const alg = key instanceof Uint8Array ? "HS256" : "RS256";

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(this.ACCESS_TOKEN_EXPIRY)
      .sign(key);
  }

  /**
   * Generates a signed Refresh Token with configurable expiry based on "remember me".
   * 
   * @param payload - User data and session ID.
   * @param rememberMe - Whether to use a 30-day (true) or 7-day (false) expiry.
   * @returns A signed JWT string.
   */
  static async generateRefreshToken(
    payload: { userId: string; email: string; sessionId?: string },
    rememberMe: boolean = false
  ): Promise<string> {
    const key = await this.getPrivateKey();
    const alg = key instanceof Uint8Array ? "HS256" : "RS256";
    const expiry = rememberMe ? this.REFRESH_TOKEN_EXPIRY_LONG : this.REFRESH_TOKEN_EXPIRY_SHORT;

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(key);
  }

  /**
   * Generates a new Refresh Token with a specific expiration timestamp (used for rotation).
   * 
   * @param payload - User data and session ID.
   * @param exp - Absolute Unix timestamp for expiration.
   * @returns A signed JWT string.
   */
  static async generateRotatedRefreshToken(
    payload: { userId: string; email: string; sessionId?: string },
    exp: number
  ): Promise<string> {
    const key = await this.getPrivateKey();
    const alg = key instanceof Uint8Array ? "HS256" : "RS256";

    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(exp)
      .sign(key);
  }

  /**
   * Verifies a JWT and returns its payload.
   * 
   * @param token - The JWT string to verify.
   * @returns The decoded payload, or null if verification fails.
   */
  static async verifyToken(token: string) {
    const key = await this.getPublicKey();
    try {
      const { payload } = await jose.jwtVerify(token, key);
      return payload;
    } catch (error) {
      Logger.error("JWT verification failed", { error: String(error) });
      return null;
    }
  }
}
