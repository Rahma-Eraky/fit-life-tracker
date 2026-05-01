import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";
import { eq, ilike } from "drizzle-orm";
import {
  GetBlogArticlesResponse,
  ToggleArticleFavoriteResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /blog
router.get("/", async (req, res) => {
  const { search } = req.query as Record<string, string>;

  // Case-insensitive search so "The" and "the" match the same rows.
  const rows = search
    ? await db
        .select()
        .from(articlesTable)
        .where(ilike(articlesTable.title, `%${search}%`))
    : await db.select().from(articlesTable);

  const articles = rows.map((a) => ({
    ...a,
    tags: JSON.parse(a.tags) as string[],
  }));

  res.json(GetBlogArticlesResponse.parse(articles));
});

// POST /blog/:id/favorite
router.post("/:id/favorite", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, id))
    .limit(1);

  const article = rows[0];
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const newFavorited = !article.favorited;
  await db
    .update(articlesTable)
    .set({ favorited: newFavorited })
    .where(eq(articlesTable.id, id));

  res.json(
    ToggleArticleFavoriteResponse.parse({ articleId: id, favorited: newFavorited })
  );
});

export default router;
