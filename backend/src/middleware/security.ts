import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import Logger from "../config/logger";

interface CSRFRequest extends Request {
  csrfToken?: () => string;
  session: any;
}

// CSRF Token Generation
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// CSRF Token Validation Middleware
export const csrfProtection = (
  req: CSRFRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API routes with valid JWT
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return next();
  }

  const token = (req.headers["x-csrf-token"] as string) || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    Logger.warn(
      `CSRF attack detected from ${req.ip} - ${req.method} ${req.url}`
    );
    return res.status(403).json({
      success: false,
      error: "Invalid CSRF token",
    });
  }

  next();
};

// CSRF Token Provider Middleware
export const provideSRFToken = (
  req: CSRFRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  req.csrfToken = () => req.session.csrfToken;

  // Add CSRF token to response headers for SPA
  res.setHeader("X-CSRF-Token", req.session.csrfToken);

  next();
};

// Input Sanitization
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      return obj
        .replace(/[<>]/g, "") // Remove potential HTML tags
        .trim(); // Remove extra whitespace
    }
    if (typeof obj === "object" && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };
  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    const sanitizedQuery = sanitize(req.query);
    // Replace query object properties instead of the whole object
    Object.keys(req.query).forEach((key) => {
      delete req.query[key];
    });
    Object.assign(req.query, sanitizedQuery);
  }

  next();
};

// Rate Limiting by IP
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();

export const advancedRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    let rateLimitInfo = ipRateLimits.get(ip);

    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      rateLimitInfo = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      rateLimitInfo.count++;
    }

    ipRateLimits.set(ip, rateLimitInfo);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to clean up
      for (const [key, value] of ipRateLimits.entries()) {
        if (now > value.resetTime) {
          ipRateLimits.delete(key);
        }
      }
    }

    if (rateLimitInfo.count > maxRequests) {
      Logger.warn(
        `Rate limit exceeded for IP ${ip}: ${rateLimitInfo.count} requests`
      );
      return res.status(429).json({
        success: false,
        error: "Too many requests",
        retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000),
      });
    }

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - rateLimitInfo.count)
    );
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(rateLimitInfo.resetTime / 1000)
    );

    next();
  };
};

// Security Headers
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Feature policy
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  next();
};
