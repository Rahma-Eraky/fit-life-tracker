import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { mealsTable, diaryEntriesTable } from "@workspace/db/schema";
import { eq, ilike, and, or, isNull } from "drizzle-orm";
import {
  GetMealsResponse,
  GetFoodDiaryResponse,
  AddFoodDiaryEntryBody,
  CreateMealBody,
  UpdateMealBody,
  UpdateFoodDiaryEntryBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// All meal + diary operations are user-scoped. Seeded recipes live with
// `userId = NULL` and are treated as a shared library visible to every
// authenticated user; custom meals carry their owner's id.
router.use(requireAuth);

/**
 * Ingredients are stored as a JSON-encoded string for seed recipes but
 * null for user-created quick meals. This helper keeps the response
 * shape consistent — always a string[] or null — without crashing on null.
 */
function parseIngredients(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

/**
 * Normalize an optional text field coming from the client. Treats
 * undefined, null, and empty/whitespace-only strings all as "no value"
 * so the column ends up as NULL rather than an empty string. Keeps the
 * frontend's nullish-aware rendering simple.
 */
function normalizeOptionalText(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

// GET /meals — returns the shared library (userId IS NULL) plus whatever
// custom meals the authenticated user owns. One query via OR so we don't
// have to paginate two result sets.
router.get("/", async (req, res) => {
  const { goal, search } = req.query as Record<string, string>;

  const ownership = or(
    isNull(mealsTable.userId),
    eq(mealsTable.userId, req.user!.id)
  );

  const conditions = [ownership];
  if (goal) conditions.push(eq(mealsTable.goal, goal));
  // Case-insensitive search so "Chicken" and "chicken" match the same rows.
  if (search) conditions.push(ilike(mealsTable.title, `%${search}%`));

  const rows = await db
    .select()
    .from(mealsTable)
    .where(and(...conditions));

  const meals = rows.map((m) => ({
    ...m,
    ingredients: parseIngredients(m.ingredients),
  }));

  res.json(GetMealsResponse.parse(meals));
});

// GET /meals/diary — only the authenticated user's entries.
router.get("/diary", async (req, res) => {
  const { date } = req.query as Record<string, string>;

  const userCond = eq(diaryEntriesTable.userId, req.user!.id);
  const rows = date
    ? await db
        .select()
        .from(diaryEntriesTable)
        .where(and(userCond, eq(diaryEntriesTable.date, date)))
    : await db.select().from(diaryEntriesTable).where(userCond);

  res.json(GetFoodDiaryResponse.parse(rows));
});

// POST /meals/diary — attaches userId so the entry is scoped. The meal
// being logged may be a shared seeded one (userId = null) or the user's
// own custom meal; both are fine to log.
router.post("/diary", async (req, res) => {
  const body = AddFoodDiaryEntryBody.parse(req.body);

  const meals = await db
    .select()
    .from(mealsTable)
    .where(
      and(
        eq(mealsTable.id, body.mealId),
        or(isNull(mealsTable.userId), eq(mealsTable.userId, req.user!.id))
      )
    )
    .limit(1);

  const meal = meals[0];
  if (!meal) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  const [entry] = await db
    .insert(diaryEntriesTable)
    .values({
      userId: req.user!.id,
      mealId: body.mealId,
      mealTitle: meal.title,
      calories: meal.calories,
      date: body.date,
      mealType: body.mealType,
    })
    .returning();

  res.status(201).json(entry);
});

// PUT /meals/diary/:id — partial update for an individual diary row.
// Both mealType and calories are inline-editable from the diary
// sidebar; either may be sent on its own. We intentionally still
// don't accept date/mealId here (changing those would silently move
// or rewire the entry — better modeled as delete + re-add).
// Scoped to the owning user so one user can't tamper with another's
// diary.
//
// IMPORTANT: this handler is registered BEFORE `/:id` (meal routes) so
// Express matches `/diary/:id` as a diary operation, not a meal one.
router.put("/diary/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = UpdateFoodDiaryEntryBody.parse(req.body);

  // Build a partial set so we only touch the columns the client
  // actually sent — `undefined` would otherwise overwrite a column
  // with `null` (Drizzle treats undefined as "set to null" in some
  // adapter combinations; safer to omit the key entirely).
  const patch: { mealType?: typeof body.mealType; calories?: number } = {};
  if (body.mealType !== undefined) patch.mealType = body.mealType;
  if (body.calories !== undefined) patch.calories = body.calories;

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No editable fields supplied" });
    return;
  }

  const updated = await db
    .update(diaryEntriesTable)
    .set(patch)
    .where(
      and(
        eq(diaryEntriesTable.id, id),
        eq(diaryEntriesTable.userId, req.user!.id)
      )
    )
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Diary entry not found" });
    return;
  }

  res.json(updated[0]);
});

// DELETE /meals/diary/:id — owner-only hard delete. The meal itself in
// the library is untouched (separate table); only this specific log
// line vanishes. Registered before `/:id` meal routes for the same
// route-matching reason as the PUT above.
router.delete("/diary/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const deleted = await db
    .delete(diaryEntriesTable)
    .where(
      and(
        eq(diaryEntriesTable.id, id),
        eq(diaryEntriesTable.userId, req.user!.id)
      )
    )
    .returning({ id: diaryEntriesTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Diary entry not found" });
    return;
  }

  res.status(204).end();
});

// POST /meals — create a custom meal. The required fields are title,
// calories, and mealType; protein, carbs and imageUrl are optional. When
// the client omits them (quick-add flow) we persist NULL, which matches
// the schema (all three columns are nullable). The new row is tagged
// with the creator's userId so it only appears in their meal list and
// only they can edit/delete it.
router.post("/", async (req, res) => {
  const body = CreateMealBody.parse(req.body);

  const [created] = await db
    .insert(mealsTable)
    .values({
      userId: req.user!.id,
      title: body.title,
      calories: body.calories,
      mealType: body.mealType,
      protein: body.protein ?? null,
      carbs: body.carbs ?? null,
      imageUrl: body.imageUrl ?? null,
      // Description is optional on the form. We trim and normalize an
      // empty string to null so the column stays clean (and so the
      // meal card's nullish render doesn't show a blank paragraph).
      description: normalizeOptionalText(body.description),
    })
    .returning();

  res.status(201).json({
    ...created,
    ingredients: parseIngredients(created.ingredients),
  });
});

// PUT /meals/:id — full replace of a meal's editable fields. Scoped to the
// owner: seeded recipes (userId = null) are read-only, and one user can't
// edit another user's custom meals. `protein`, `carbs` and `imageUrl` are
// persisted with `?? null` so the client can actively clear any of them
// (e.g. user removes the image) by sending an explicit null.
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const body = UpdateMealBody.parse(req.body);

  const updated = await db
    .update(mealsTable)
    .set({
      title: body.title,
      calories: body.calories,
      mealType: body.mealType,
      protein: body.protein ?? null,
      carbs: body.carbs ?? null,
      imageUrl: body.imageUrl ?? null,
      // Same normalization as POST so an empty edit clears the column.
      description: normalizeOptionalText(body.description),
    })
    .where(
      and(eq(mealsTable.id, id), eq(mealsTable.userId, req.user!.id))
    )
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  const meal = updated[0];
  res.json({
    ...meal,
    ingredients: parseIngredients(meal.ingredients),
  });
});

// DELETE /meals/:id — owner-only hard delete. Existing diary entries keep
// their `mealTitle`/`calories` snapshot (stored at log time), so deleting
// a meal does not rewrite diary history.
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const deleted = await db
    .delete(mealsTable)
    .where(
      and(eq(mealsTable.id, id), eq(mealsTable.userId, req.user!.id))
    )
    .returning({ id: mealsTable.id });

  if (deleted.length === 0) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  res.status(204).end();
});

export default router;
