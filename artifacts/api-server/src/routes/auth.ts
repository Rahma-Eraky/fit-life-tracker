import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, profileTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { signJwt } from "../lib/jwt";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function buildAuthResponse(user: { id: number; email: string; name: string }) {
  return {
    token: signJwt(user.id),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

// POST /auth/register — create a new user and immediately return an auth
// token so the frontend can skip an extra login round-trip. Also scaffolds
// an empty-ish profile row so downstream /profile GETs have something to
// return; the user fills in weight/goal/etc. from the profile page.
router.post("/register", async (req, res) => {
  const body = RegisterBody.parse(req.body);

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, body.email))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(body.password);
  const [user] = await db
    .insert(usersTable)
    .values({ email: body.email, passwordHash, name: body.name })
    .returning();

  // Best-effort profile scaffold. Values are placeholders the user can
  // update from the profile page; none of the numeric fields are meant
  // to be accurate until they do.
  await db.insert(profileTable).values({
    userId: user.id,
    name: body.name,
    email: body.email,
    age: 0,
    weight: 0,
    height: 0,
    goal: "maintenance",
    points: 0,
    level: 1,
    joinedAt: new Date().toISOString().slice(0, 10),
  });

  res.status(201).json(buildAuthResponse(user));
});

// POST /auth/login — verify credentials, issue a JWT. Response shape is
// identical to register so the frontend can treat both the same way.
router.post("/login", async (req, res) => {
  const body = LoginBody.parse(req.body);

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, body.email))
    .limit(1);
  const user = users[0];
  // Constant-ish 401 regardless of whether the email exists, so callers
  // can't enumerate accounts from the error.
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.json(buildAuthResponse(user));
});

// GET /auth/me — handy for refreshing the auth context after a page reload.
// The frontend stores the token in localStorage; on boot it calls /me to
// confirm the token is still good before flipping to "signed in".
router.get("/me", requireAuth, async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
  });
});

export default router;
