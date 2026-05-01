import { Link, useParams } from "wouter";
import {
  useGetWorkouts,
  useCompleteWorkout,
  getGetWorkoutsQueryKey,
  getGetProgressQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/layout/PageTransition";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/language-context";
import { translateWorkout } from "@/lib/translate-content";
import { CATEGORY_T_KEY, DIFFICULTY_T_KEY } from "@/lib/content-translations";
import {
  ArrowLeft,
  Clock,
  Flame,
  Dumbbell,
  Play,
  CheckCircle,
} from "lucide-react";

/**
 * WorkoutDetail — full workout view at `/workouts/:id`.
 *
 * Data source: we reuse `useGetWorkouts()` (the list query) rather than
 * adding a dedicated `GET /workouts/:id` endpoint. Same reasoning as the
 * blog detail page:
 *   1. The list response already includes every field we need here
 *      (description, steps, videoUrl, etc.).
 *   2. Sharing the query key with the list page means list → detail
 *      navigation is served instantly from the React Query cache with
 *      no refetch.
 *
 * If the workouts table ever grows past a few hundred rows we can
 * trivially add a `GET /workouts/:id` endpoint and swap the hook —
 * nothing else in this file would change.
 *
 * The Mark Complete button reuses `useCompleteWorkout` with the same
 * cache-invalidation + toast pattern as the list page, so completing
 * here is behaviourally identical to completing from the card grid.
 */
export default function WorkoutDetail() {
  const params = useParams<{ id: string }>();
  const workoutId = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();

  const { data: workouts, isLoading } = useGetWorkouts();
  const workoutsList = Array.isArray(workouts) ? workouts : [];
  const rawWorkout = workoutsList.find((w) => w.id === workoutId);
  // Overlay Arabic content for `ar`; in English mode this is a no-op
  // (`translateWorkout` returns the input by reference).
  const workout = rawWorkout ? translateWorkout(rawWorkout, lang) : undefined;

  const completeMutation = useCompleteWorkout({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: t("workouts.workoutCompletedTitle"),
          description: t("workouts.workoutCompletedDesc", {
            points: data.pointsEarned,
            total: data.totalPoints,
          }),
        });
        queryClient.invalidateQueries({ queryKey: getGetWorkoutsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("workouts.errorCompleteDesc"),
        });
      },
    },
  });

  // Loading skeleton — shape mirrors the rendered layout so the
  // transition into the real content feels stable on the dark theme.
  if (isLoading) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-40 bg-card animate-pulse rounded-full mb-6" />
          <div className="h-[360px] bg-card animate-pulse rounded-3xl mb-8" />
          <div className="h-12 bg-card animate-pulse rounded-xl mb-4 w-3/4" />
          <div className="h-5 bg-card animate-pulse rounded-xl w-1/2" />
        </div>
      </PageTransition>
    );
  }

  // 404-style fallback when the id is unknown or non-numeric.
  if (!workout || Number.isNaN(workoutId)) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center py-24">
          <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-3xl font-bold mb-2">{t("workoutDetail.notFound")}</h2>
          <p className="text-muted-foreground mb-8">
            {t("workoutDetail.notFoundDesc")}
          </p>
          <Link href="/workouts">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
              <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" /> {t("workoutDetail.backToWorkouts")}
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link — ghost variant matches the dark-theme nav feel. */}
        <Link href="/workouts">
          <Button
            variant="ghost"
            className="mb-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" /> {t("workoutDetail.backToWorkouts")}
          </Button>
        </Link>

        {/* Hero image with the same gradient + badge treatment used on the
            workout card, so the transition between list and detail feels
            like a natural zoom-in. */}
        <div className="relative h-[320px] md:h-[420px] rounded-3xl overflow-hidden mb-8 border border-border dark:border-white/5">
          <img
            src={
              workout.imageUrl ||
              "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80"
            }
            alt={workout.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge className="bg-black/50 backdrop-blur-md border-none text-white uppercase font-bold tracking-wider">
              {CATEGORY_T_KEY[workout.category]
                ? t(CATEGORY_T_KEY[workout.category])
                : workout.category}
            </Badge>
            <Badge className="bg-primary/80 backdrop-blur-md border-none text-primary-foreground uppercase font-bold tracking-wider">
              {DIFFICULTY_T_KEY[workout.difficulty]
                ? t(DIFFICULTY_T_KEY[workout.difficulty])
                : workout.difficulty}
            </Badge>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          {workout.title}
        </h1>

        {/* Duration + calories strip — same icons/colors as the card so the
            visual vocabulary stays consistent between pages. */}
        <div className="flex items-center gap-8 pb-6 mb-8 border-b border-border dark:border-white/5">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Clock className="w-5 h-5 text-primary" />
            {workout.duration} {t("workouts.minutesShort")}
          </div>
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Flame className="w-5 h-5 text-orange-500" />
            {workout.calories} {t("workouts.kcal")}
          </div>
          {workout.completionCount > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {workout.completionCount === 1
                ? t("workouts.completedOnce")
                : t("workouts.completedMany", { count: workout.completionCount })}
            </div>
          )}
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          {workout.description}
        </p>

        {/* Video section — YouTubeEmbed returns null if videoUrl is missing
            or unparseable, so we only render the heading when we actually
            have something to show. */}
        {workout.videoUrl && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-primary fill-current" />
              {t("workoutDetail.followAlong")}
            </h2>
            <YouTubeEmbed url={workout.videoUrl} title={workout.title} />
          </section>
        )}

        {/* Steps — numbered list styled for the dark theme. Using a
            semantic <ol> so screen readers announce order correctly. */}
        {workout.steps.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              {t("workoutDetail.steps")}
            </h2>
            <ol className="space-y-3">
              {workout.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-4 items-start bg-card border border-border dark:border-white/5 rounded-2xl p-4"
                >
                  <span className="shrink-0 w-9 h-9 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Mark Complete — same behaviour as the list card: reuses the
            existing mutation, so points awarding + completionCount
            increment + cache invalidation all go through the exact
            code path we've already proven works. */}
        <Button
          onClick={() => completeMutation.mutate({ id: workout.id })}
          disabled={completeMutation.isPending}
          className="w-full h-14 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 neon-glow flex flex-col gap-0 leading-tight"
        >
          {completeMutation.isPending ? (
            t("common.saving")
          ) : workout.completionCount > 0 ? (
            <>
              <span className="flex items-center">
                <CheckCircle className="mr-2 rtl:mr-0 rtl:ml-2 w-5 h-5" /> {t("workouts.markCompleteAgain")}
              </span>
              <span className="text-xs font-medium opacity-80">
                {workout.completionCount === 1
                  ? t("workouts.completedOnce")
                  : t("workouts.completedMany", { count: workout.completionCount })}
              </span>
            </>
          ) : (
            <span className="flex items-center">
              <Play className="mr-2 rtl:mr-0 rtl:ml-2 w-5 h-5 fill-current" /> {t("workouts.markComplete")}
            </span>
          )}
        </Button>
      </div>
    </PageTransition>
  );
}
