import jwt from "jsonwebtoken";

/**
 * JWT helpers. The token carries only the user's id — email/name are looked
 * up from the `users` table on every authenticated request so changes take
 * effect without re-issuing tokens. Tokens are intentionally short (7 days)
 * so a stolen token's window is bounded; the frontend just re-logs-in on
 * expiry.
 */

export interface JwtPayload {
  sub: number; // user id
}

const DEFAULT_DEV_SECRET = "dev-only-jwt-secret-change-me";

function getSecret(): string {
  const fromEnv = process.env["JWT_SECRET"];
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "JWT_SECRET must be set in production; refusing to start with a default secret."
    );
  }
  return DEFAULT_DEV_SECRET;
}

export function signJwt(userId: number): string {
  return jwt.sign({ sub: userId } satisfies JwtPayload, getSecret(), {
    expiresIn: "7d",
  });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === "object" && decoded && typeof (decoded as JwtPayload).sub === "number") {
      return { sub: (decoded as JwtPayload).sub };
    }
    return null;
  } catch {
    return null;
  }
}
