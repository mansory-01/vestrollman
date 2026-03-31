import { NextRequest, NextResponse } from "next/server";
import { JWTService } from "@/server/services/jwt.service";

/**
 * Global API Middleware
 * 
 * Handles cross-cutting concerns for all API requests:
 * 1. Request Tracing: Injects a unique `x-response-id` into request and response headers.
 * 2. CORS Handling: Validates the request origin against allowed origins and handles preflight OPTIONS requests.
 * 3. Identity Verification: Verifies incoming access tokens/cookies for specific API routes.
 */
export async function middleware(req: NextRequest) {
  const responseId = crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-response-id", responseId);

  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") ?? [];
  const origin = req.headers.get("origin");

  // Origin validation
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: "Forbidden: Origin not allowed",
    });
  }

  // CORS Preflight
  if (req.method === "OPTIONS") {
    if (origin && allowedOrigins.includes(origin)) {
      const response = new NextResponse(null, { status: 200 });
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With",
      );
      response.headers.set("Access-Control-Max-Age", "86400");
      response.headers.set("x-response-id", responseId);
      return response;
    }
  }

  const token =
    req.cookies.get("access_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      await JWTService.verifyAccessToken(token);
    } catch {
      // Identity verification failed; route handler will handle authorization.
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Vary", "Accept-Encoding");

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("x-response-id", responseId);

  return response;
}

export const config = {
  matcher: "/api/v1/:path*",
};

