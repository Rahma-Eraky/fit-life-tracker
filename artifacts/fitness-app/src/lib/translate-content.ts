/**
 * Content translation helpers — thin wrappers that apply the Arabic
 * overlays from `content-translations.ts` on top of API-sourced data.
 *
 * Design:
 *   - Hooks (useTranslatedWorkout, useTranslatedMeal, useTranslatedArticle)
 *     read the current locale from `useTranslation()` and merge the
 *     matching overlay.
 *   - When the locale is English, or when no overlay exists for the id,
 *     the original object is returned by reference — zero cost, no new
 *     allocations, render stability preserved.
 *   - When the locale is Arabic and an overlay exists, a shallow copy
 *     is returned with the translated fields swapped in. Non-listed
 *     fields pass through.
 *
 * The helpers are typed with generics so the returned object is the
 * same shape as the input (callers keep every field they already had,
 * including React Query's query-key metadata, etc.).
 */

import { useTranslation } from "./language-context";
import {
  getWorkoutOverlay,
  getMealOverlay,
  getArticleOverlay,
  translateTag,
  type Locale,
} from "./content-translations";

/** Minimum shape we need from a workout to translate it. */
interface WorkoutLike {
  id: number;
  title: string;
  description: string;
  steps: string[];
}

/** Minimum shape we need from a meal to translate it. */
interface MealLike {
  id: number;
  title: string;
  description?: string | null;
  ingredients?: string | string[] | null;
}

/** Minimum shape we need from a blog article to translate it. */
interface ArticleLike {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export function useTranslatedWorkout<T extends WorkoutLike>(workout: T): T {
  const { lang } = useTranslation();
  return translateWorkout(workout, lang);
}

export function useTranslatedMeal<T extends MealLike>(meal: T): T {
  const { lang } = useTranslation();
  return translateMeal(meal, lang);
}

export function useTranslatedArticle<T extends ArticleLike>(article: T): T {
  const { lang } = useTranslation();
  return translateArticle(article, lang);
}

/**
 * Non-hook variants — same logic, locale passed explicitly. Useful when
 * you need to translate many items inside a map() where calling a hook
 * per row would violate the rules of hooks (hooks must run in the same
 * order on every render).
 */
export function translateWorkout<T extends WorkoutLike>(
  workout: T,
  lang: Locale,
): T {
  // Look up by English title — stable across re-seeds even when Postgres
  // identity sequences reassign new numeric ids. See content-translations.ts
  // for rationale.
  const overlay = getWorkoutOverlay(workout.title, lang);
  if (!overlay) return workout;
  return {
    ...workout,
    title: overlay.title,
    description: overlay.description,
    steps: overlay.steps,
  };
}

export function translateMeal<T extends MealLike>(meal: T, lang: Locale): T {
  const overlay = getMealOverlay(meal.title, lang);
  if (!overlay) return meal;
  return {
    ...meal,
    title: overlay.title,
    description: overlay.description,
    // Preserve the stored shape: the API returns ingredients as a JSON
    // string or array depending on the row. We only swap when the input
    // was already an array; otherwise we leave it untouched so callers
    // that parse the JSON still get something sensible.
    ingredients: Array.isArray(meal.ingredients)
      ? overlay.ingredients
      : meal.ingredients,
  };
}

export function translateArticle<T extends ArticleLike>(
  article: T,
  lang: Locale,
): T {
  const overlay = getArticleOverlay(article.title, lang);
  if (!overlay) return article;
  return {
    ...article,
    title: overlay.title,
    excerpt: overlay.excerpt,
    content: overlay.content,
    tags: overlay.tags,
  };
}

/**
 * Translate a blog tag string (free-text, but in practice a small known
 * set). Falls through untouched for unknown tags so the UI doesn't
 * blow up if the seed adds a new tag.
 */
export function useTranslatedTag(tag: string): string {
  const { lang } = useTranslation();
  return translateTag(tag, lang);
}
