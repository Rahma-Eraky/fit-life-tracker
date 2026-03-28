import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profileTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /profile
router.get("/", async (req, res) => {
  const profiles = await db.select().from(profileTable).limit(1);
  const profile = profiles[0];

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(GetProfileResponse.parse({ ...profile, avatarUrl: profile.avatarUrl ?? undefined }));
});

// PUT /profile
router.put("/", async (req, res) => {
  const body = UpdateProfileBody.parse(req.body);

  const profiles = await db.select().from(profileTable).limit(1);
  const profile = profiles[0];

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const [updated] = await db
    .update(profileTable)
    .set({
      ...(body.name && { name: body.name }),
      ...(body.age && { age: body.age }),
      ...(body.weight && { weight: body.weight }),
      ...(body.height && { height: body.height }),
      ...(body.goal && { goal: body.goal }),
    })
    .where(eq(profileTable.id, profile.id))
    .returning();

  res.json(UpdateProfileResponse.parse({ ...updated, avatarUrl: updated.avatarUrl ?? undefined }));
});

export default router;
