import { randomBytes } from "crypto";

// Cache the derived secret to ensure consistency across invocations
let cachedSecret: string | null = null;

/**
 * Get the JWT secret for token signing/verification
 * - In production: JWT_SECRET is required
 * - In development: Falls back to SESSION_SECRET or generates a random secret (cached)
 */
export function getJwtSecret(): string {
  // Return cached secret if available
  if (cachedSecret) {
    return cachedSecret;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  
  if (process.env.JWT_SECRET) {
    cachedSecret = process.env.JWT_SECRET;
    return cachedSecret;
  }
  
  if (isProduction) {
    throw new Error(
      "JWT_SECRET environment variable must be set in production. " +
      "Generate a secure random secret and set it in your deployment environment."
    );
  }
  
  // Development fallbacks
  if (process.env.SESSION_SECRET) {
    console.warn("⚠️  Using SESSION_SECRET as JWT_SECRET in development. Set JWT_SECRET for production.");
    cachedSecret = process.env.SESSION_SECRET;
    return cachedSecret;
  }
  
  // Generate a random secret for this development session (cached)
  cachedSecret = randomBytes(32).toString('hex');
  console.warn("⚠️  Generated random JWT_SECRET for development. Tokens will not persist across restarts.");
  return cachedSecret;
}
