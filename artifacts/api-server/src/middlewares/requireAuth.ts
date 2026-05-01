import type { RequestHandler } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { verifyJwt } from "../lib/jwt";

/**
 * Express middleware that:
 *   1. Reads the `Authorization: Bearer <token>` header.
 *   2. Verifies the JWT.
 *   3. Loads the user row to confirm it still exists.
 *   4. Attaches `req.user = { id, email, name }` for downstream handlers.
 *
 * Responds with 401 on any failure path. Keep handlers downstream simple —
 * they can trust `req.user` is present and well-formed.
 */

// Augment Express's Request type so handlers see `req.user` without casts.
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email: string;
      name: string;
    };
  }
}

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = extractBearer(req.header("authorization"));
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const payload = verifyJwt(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.sub))
    .limit(1);
  const user = users[0];
  if (!user) {
    // Token is valid but the user row was deleted.
    res.status(401).json({ error: "User no longer exists" });
    return;
  }

  req.user = { id: user.id, email: user.email, name: user.name };
  next();
};
