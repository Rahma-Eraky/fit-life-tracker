import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { mealsTable, diaryEntriesTable } from "@workspace/db/schema";
import { eq, like, and } from "drizzle-orm";
import {
  GetMealsResponse,
  GetFoodDiaryResponse,
  AddFoodDiaryEntryBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /meals
router.get("/", async (req, res) => {
  const { goal, search } = req.query as Record<string, string>;

  const conditions = [];
  if (goal) conditions.push(eq(mealsTable.goal, goal));
  if (search) conditions.push(like(mealsTable.title, `%${search}%`));

  const rows = conditions.length
    ? await db.select().from(mealsTable).where(and(...conditions))
    : await db.select().from(mealsTable);

  const meals = rows.map((m) => ({
    ...m,
    ingredients: JSON.parse(m.ingredients) as string[],
  }));

  res.json(GetMealsResponse.parse(meals));
});

// GET /meals/diary
router.get("/diary", async (req, res) => {
  const { date } = req.query as Record<string, string>;

  const rows = date
    ? await db
        .select()
        .from(diaryEntriesTable)
        .where(eq(diaryEntriesTable.date, date))
    : await db.select().from(diaryEntriesTable);

  res.json(GetFoodDiaryResponse.parse(rows));
});

// POST /meals/diary
router.post("/diary", async (req, res) => {
  const body = AddFoodDiaryEntryBody.parse(req.body);

  // Fetch the meal to get its details
  const meals = await db
    .select()
    .from(mealsTable)
    .where(eq(mealsTable.id, body.mealId))
    .limit(1);

  const meal = meals[0];
  if (!meal) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  const [entry] = await db
    .insert(diaryEntriesTable)
    .values({
      mealId: body.mealId,
      mealTitle: meal.title,
      calories: meal.calories,
      date: body.date,
      mealType: body.mealType,
    })
    .returning();

  res.status(201).json(entry);
});

export default router;
