import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  workoutsTable,
  profileTable,
  diaryEntriesTable,
} from "@workspace/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { GetProgressResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

// Helper: format a Date as YYYY-MM-DD in the server's local time. This
// matches how `diary_entries.date` is stored by the nutrition page (plain
// date, no timezone suffix), so the join-by-string works correctly.
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Helper: map JS Date.getDay() (0=Sun..6=Sat) to the "Mon".."Sun" string
// the frontend's DAY_T_KEY already knows how to translate. Keeping this
// alignment avoids any client-side change.
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// GET /progress
router.get("/", async (req, res) => {
  const allWorkouts = await db.select().from(workoutsTable);
  const completed = allWorkouts.filter((w) => w.completed);
  const totalCalories = completed.reduce((sum, w) => sum + w.calories, 0);

  const profiles = await db
    .select()
    .from(profileTable)
    .where(eq(profileTable.userId, req.user!.id))
    .limit(1);
  const profile = profiles[0];

  // Build a rolling 7-day window ending today (inclusive). We intentionally
  // do NOT use a fixed Mon..Sun calendar week so the rightmost bar is always
  // "today" regardless of what day of the week it happens to be — which
  // matches how users actually read a progress chart.
  const today = new Date();
  const windowDays: { iso: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    windowDays.push({
      iso: formatLocalDate(d),
      label: WEEKDAY_LABELS[d.getDay()],
    });
  }
  const windowIsoDates = windowDays.map((d) => d.iso);

  // Real aggregation from the user's food diary. One grouped query: sum of
  // calories and number of entries per date, scoped to the authenticated
  // user and to the 7-day window. Unlogged days won't appear in the result
  // set at all — we backfill those as zeros when we shape the response.
  //
  // NOTE: this graph currently reflects calories *consumed* (diary), not
  // calories *burned* (workout completions). Per-completion history is
  // not tracked yet (workouts.completion_count is a cumulative integer),
  // so burned-calorie history would need a new table; that's deliberately
  // out of scope for this feature.
  const diaryRows = await db
    .select({
      date: diaryEntriesTable.date,
      calories: sql<number>`COALESCE(SUM(${diaryEntriesTable.calories}), 0)`.mapWith(Number),
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(diaryEntriesTable)
    .where(
      and(
        eq(diaryEntriesTable.userId, req.user!.id),
        inArray(diaryEntriesTable.date, windowIsoDates)
      )
    )
    .groupBy(diaryEntriesTable.date);

  const diaryByDate = new Map<string, { calories: number; count: number }>();
  for (const row of diaryRows) {
    diaryByDate.set(row.date, { calories: row.calories, count: row.count });
  }

  // Preserve the existing response shape exactly — `{ day, count, calories }`
  // per element — so the profile page's BarChart keeps working without any
  // frontend change. Missing days are filled with zeros, not omitted, so
  // all 7 bars always render.
  const weeklyWorkouts = windowDays.map(({ iso, label }) => {
    const agg = diaryByDate.get(iso);
    return {
      day: label,
      count: agg?.count ?? 0,
      calories: agg?.calories ?? 0,
    };
  });

  const achievements = [
    {
      id: 1,
      title: "First Step",
      description: "Completed your first workout",
      icon: "🏃",
      earnedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Week Warrior",
      description: "Worked out 5 days in a row",
      icon: "🔥",
      earnedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Calorie Crusher",
      description: "Burned 1000 calories total",
      icon: "⚡",
      earnedAt: new Date().toISOString(),
    },
  ].slice(0, completed.length > 0 ? 3 : 1);

  res.json(
    GetProgressResponse.parse({
      totalWorkouts: allWorkouts.length,
      completedWorkouts: completed.length,
      totalCaloriesBurned: totalCalories,
      totalPoints: profile?.points ?? 0,
      level: profile?.level ?? 1,
      weeklyStreak: Math.min(completed.length, 7),
      weeklyWorkouts,
      recentAchievements: achievements,
    })
  );
});

export default router;
