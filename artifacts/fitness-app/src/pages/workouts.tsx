import { PageTransition } from "@/components/layout/PageTransition";
import {
  useGetWorkouts,
  useCompleteWorkout,
  getGetWorkoutsQueryKey,
  getGetProgressQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Play, CheckCircle, Clock, Flame, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { translateWorkout } from "@/lib/translate-content";
import { CATEGORY_T_KEY, DIFFICULTY_T_KEY } from "@/lib/content-translations";

// Filter values stay in English — they're sent to the API which expects
// the canonical english enum values. Labels come from the translations
// dictionary via the key below; values stay unchanged.
const CATEGORY_KEYS = ["All", "Strength", "Cardio", "Yoga", "Home"] as const;
const DIFFICULTY_KEYS = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export default function Workouts() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_KEYS)[number]>("All");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY_KEYS)[number]>("All");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t, lang } = useTranslation();

  // Mark-complete is user-scoped on the backend; if the browser isn't
  // signed in we send them to /login with a redirect hint so they land
  // back here afterwards rather than on a generic mystery page.
  const handleComplete = (workoutId: number) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent("/workouts")}`);
      return;
    }
    completeMutation.mutate({ id: workoutId });
  };

  const { data: workouts, isLoading } = useGetWorkouts({
    search: search || undefined,
    category: category !== "All" ? category.toLowerCase() : undefined,
    difficulty: difficulty !== "All" ? difficulty.toLowerCase() : undefined,
  });

  const workoutsList = Array.isArray(workouts) ? workouts : [];
  // Overlay Arabic content when the active locale is `ar`. In English
  // mode `translateWorkout` returns the input by reference so this is a
  // no-op. We map once at the top of render so the rest of the JSX
  // reads from a single localized source of truth.
  const localizedList = workoutsList.map((w) => translateWorkout(w, lang));
  console.log(
  "workout titles =",
    workoutsList.map((w) => ({
      id: w.id,
      title: w.title,
      imageUrl: w.imageUrl,
    }))
  );

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


  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-3">
            <Dumbbell className="w-10 h-10 text-primary" />
            {t("workouts.title")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            {t("workouts.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-12 bg-card p-4 rounded-2xl border border-border dark:border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("workouts.searchPlaceholder")}
            className="pl-12 rtl:pr-12 rtl:pl-4 h-14 bg-background border-border dark:border-white/10 rounded-xl text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">
          {CATEGORY_KEYS.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className={`rounded-full h-14 px-6 font-bold ${category === cat ? "neon-glow" : "border-border dark:border-white/10"}`}
              onClick={() => setCategory(cat)}
            >
              {t(`workouts.category${cat}`)}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">
          {DIFFICULTY_KEYS.map((level) => (
            <Button
              key={level}
              variant={difficulty === level ? "default" : "outline"}
              className={`rounded-full h-14 px-6 font-bold ${difficulty === level ? "neon-glow" : "border-border dark:border-white/10"}`}
              onClick={() => setDifficulty(level)}
            >
              {t(`workouts.difficulty${level}`)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card rounded-3xl h-[400px] animate-pulse border border-border dark:border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {localizedList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center"
              >
                <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">{t("workouts.noWorkoutsFound")}</h3>
                <p className="text-muted-foreground">{t("workouts.noWorkoutsHint")}</p>
              </motion.div>
            ) : (
              localizedList.map((workout, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={workout.id}
                  className="bg-card rounded-3xl overflow-hidden border border-border dark:border-white/5 hover:border-primary/50 transition-all duration-300 group flex flex-col"
                >
                  {/* Image wrapped in a Link so clicking the hero opens the
                      detail page. The whole card isn't wrapped because it
                      contains an interactive Mark Complete <button>, and
                      nesting a button inside an <a> is invalid HTML. */}
                  <Link href={`/workouts/${workout.id}`}>
                    <div className="relative h-56 overflow-hidden cursor-pointer">
                      <img
                        src={workout.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"}
                        alt={workout.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
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
                  </Link>

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Title is also a link — people expect titles to be
                        clickable. Uses block display so the padding/margin
                        of the surrounding column is preserved. */}
                    <Link href={`/workouts/${workout.id}`}>
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors cursor-pointer">
                        {workout.title}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground line-clamp-2 mb-6 flex-1">
                      {workout.description}
                    </p>

                    <div className="flex items-center justify-between py-4 border-y border-border dark:border-white/5 mb-6">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Clock className="w-5 h-5 text-primary" />
                        {workout.duration} {t("workouts.minutesShort")}
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Flame className="w-5 h-5 text-orange-500" />
                        {workout.calories} {t("workouts.kcal")}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleComplete(workout.id)}
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
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </PageTransition>
  );
}