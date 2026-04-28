import { rateLimit } from "express-rate-limit";

function createRateLimiter(max: number, windowSec: number) {
  return rateLimit({
    windowMs: windowSec * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
}

// For authentication endpoints (sign-in, password reset, etc.)
export const authLimiter = createRateLimiter(10, 60);

// For general protected API endpoints
export const apiLimiter = createRateLimiter(100, 60);

export { createRateLimiter };
