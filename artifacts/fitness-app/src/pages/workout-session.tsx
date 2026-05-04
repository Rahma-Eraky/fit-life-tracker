import { Link, useParams } from "wouter";
import { useGetWorkouts } from "@workspace/api-client-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { StepTimer } from "@/components/StepTimer";
import { useTranslation } from "@/lib/language-context";
import { translateWorkout } from "@/lib/translate-content";

/**
 * WorkoutSession — guided step-by-step player at `/workouts/:id/session`.
 *
 * We deliberately reuse `useGetWorkouts()` (the list query) rather than
 * adding a `GET /workouts/:id` endpoint — same caching reasoning as
 * the detail page, so navigating from detail → session is instant.
 *
 * The page is a thin shell: it loads + translates the workout and
 * delegates the entire timer experience to <StepTimer />, which knows
 * nothing about routing or workouts and is reusable elsewhere.
 */
export default function WorkoutSession() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { t, lang } = useTranslation();

  const { data: workouts, isLoading } = useGetWorkouts();
  const list = Array.isArray(workouts) ? workouts : [];
  const raw = list.find((w) => w.id === id);
  // Same Arabic overlay treatment used everywhere else; in English
  // mode this is a no-op pass-through by reference.
  const workout = raw ? translateWorkout(raw, lang) : undefined;

  // Loading skeleton — mirrors the rendered shape for a calm transition.
  if (isLoading) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-40 bg-card animate-pulse rounded-full mb-6" />
          <div className="h-[520px] bg-card animate-pulse rounded-3xl" />
        </div>
      </PageTransition>
    );
  }

  // 404 fallback for unknown / non-numeric ids.
  if (!workout || Number.isNaN(id)) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center py-24">
          <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-3xl font-bold mb-2">
            {t("workoutDetail.notFound")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t("workoutDetail.notFoundDesc")}
          </p>
          <Link href="/workouts">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
              <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />{" "}
              {t("workoutDetail.backToWorkouts")}
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  // Defensive: workouts can theoretically be seeded without steps.
  // Render a friendly empty state rather than letting the timer
  // mount with an empty array.
  if (!workout.steps || workout.steps.length === 0) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center py-24">
          <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-3xl font-bold mb-2">{t("session.noSteps")}</h2>
          <Link href={`/workouts/${id}`}>
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow mt-2">
              <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />{" "}
              {t("session.backToWorkout")}
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <Link href={`/workouts/${id}`}>
          <Button
            variant="ghost"
            className="mb-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />{" "}
            {t("session.backToWorkout")}
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-black mb-2 leading-tight">
          {workout.title}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("session.followAlong")}
        </p>

        <StepTimer steps={workout.steps} />
      </div>
    </PageTransition>
  );
}
