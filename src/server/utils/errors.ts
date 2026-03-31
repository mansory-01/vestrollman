import {
  buildProblemDetails,
  PROBLEM_TYPE_MAP,
  type ProblemDetails,
} from "./problem-details";

/**
 * Root application error class.
 *
 * Extends the native `Error` with an HTTP status code, optional field-level
 * errors, and an RFC 7807 `type` URI and `title` so every subclass can 
 * self-describe its problem category.
 */
export class AppError extends Error {
  /** RFC 7807 `type` URI identifying the problem category. */
  public type: string;
  /** RFC 7807 `title` – short, stable summary of the problem type. */
  public title: string;
  /** The HTTP status code associated with this error. */
  public status: number;

  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors: Record<string, unknown> | null = null,
    typeOverride?: string,
    titleOverride?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    const defaults = PROBLEM_TYPE_MAP[statusCode] ?? {
      type: "about:blank",
      title: "Unknown Error",
    };
    this.status = statusCode;
    this.type = typeOverride ?? defaults.type;
    this.title = titleOverride ?? defaults.title;
  }

  /**
   * Serializes this error into a fully-populated RFC 7807 ProblemDetails object.
   *
   * @param instance - The request path / URI that caused this error.
   * @returns A ProblemDetails object.
   */
  toProblemDetails(instance: string = "unknown"): ProblemDetails {
    return buildProblemDetails(
      this.statusCode,
      this.message,
      instance,
      this.errors,
      { type: this.type, title: this.title },
    );
  }
}

/**
 * Thrown when request validation fails.
 */
export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errors: Record<string, unknown> | null = null,
  ) {
    super(
      message,
      400,
      errors,
      "/problems/validation-error",
      "Validation Error",
    );
  }
}

/**
 * Thrown when a generic bad request is received.
 */
export class BadRequestError extends AppError {
  constructor(
    message: string = "Bad request",
    errors: Record<string, unknown> | null = null,
  ) {
    super(message, 400, errors);
  }
}

/**
 * Thrown when authentication is required or fails.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
  }
}

/**
 * Thrown when OAuth authentication fails.
 */
export class OAuthError extends AppError {
  constructor(
    message: string = "OAuth authentication failed",
    errors: Record<string, unknown> | null = null,
  ) {
    super(message, 401, errors, "/problems/oauth-error", "OAuth Error");
  }
}

/**
 * Thrown when a token has expired.
 */
export class TokenExpiredError extends AppError {
  constructor(message: string = "Token has expired") {
    super(message, 401, null, "/problems/token-expired", "Token Expired");
  }
}

/**
 * Thrown when a token is invalid.
 */
export class InvalidTokenError extends AppError {
  constructor(message: string = "Invalid token") {
    super(message, 401, null, "/problems/invalid-token", "Invalid Token");
  }
}

/**
 * Thrown when a token audience does not match the expected value.
 */
export class AudienceMismatchError extends OAuthError {
  constructor(message: string = "Token audience mismatch") {
    super(message);
    this.type = "/problems/audience-mismatch";
    this.title = "Audience Mismatch";
  }
}

/**
 * Thrown when a token issuer does not match the expected value.
 */
export class IssuerMismatchError extends OAuthError {
  constructor(message: string = "Token issuer mismatch") {
    super(message);
    this.type = "/problems/issuer-mismatch";
    this.title = "Issuer Mismatch";
  }
}

/**
 * Thrown when access to a resource is forbidden.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
  }
}

/**
 * Thrown when a requested resource is not found.
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Thrown when a resource conflict occurs (e.g., duplicate entry).
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * Thrown when rate limits are exceeded.
 */
export class TooManyRequestsError extends AppError {
  constructor(
    message: string = "Too many requests",
    public retryAfter?: number,
  ) {
    super(message, 429);
  }
}

/**
 * Thrown for unexpected server-side errors.
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}
