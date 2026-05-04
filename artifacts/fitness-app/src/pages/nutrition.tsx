import { useState } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import {
  useGetMeals,
  useGetFoodDiary,
  useAddFoodDiaryEntry,
  useCreateMeal,
  useUpdateMeal,
  useDeleteMeal,
  useDeleteFoodDiaryEntry,
  useUpdateFoodDiaryEntry,
  getGetFoodDiaryQueryKey,
  getGetMealsQueryKey,
  getGetProgressQueryKey,
  type Meal,
  type DiaryEntry,
  type UpdateDiaryEntryMealType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MealFormDialog, type MealFormValues } from "@/components/MealFormDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Search, Plus, Apple, Calendar, Target, Flame, Pencil, Trash2, Check } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/language-context";
import { translateMeal } from "@/lib/translate-content";
import { MEAL_TYPE_T_KEY } from "@/lib/content-translations";

// Goal values stay in English — they're sent to the API which expects the
// canonical values. Labels come from the translations dictionary via the
// key map below; values stay unchanged.
const GOAL_KEYS = ["All", "Weight Loss", "Muscle Gain", "Maintenance"] as const;
const GOAL_LABEL_KEY: Record<(typeof GOAL_KEYS)[number], string> = {
  All: "nutrition.goalAll",
  "Weight Loss": "nutrition.goalWeightLoss",
  "Muscle Gain": "nutrition.goalMuscleGain",
  Maintenance: "nutrition.goalMaintenance",
};

// Order matches the natural day flow so the dropdown reads sensibly.
// Values are the API enum; labels resolve via MEAL_TYPE_T_KEY.
const DIARY_MEAL_TYPES: UpdateDiaryEntryMealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export default function Nutrition() {
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState<(typeof GOAL_KEYS)[number]>("All");
  // Selected date for the diary panel. Defaults to today, but the user
  // can pick any past day via the calendar popover so they can backfill
  // meals they forgot to log. Stored as YYYY-MM-DD to match the
  // diary_entries.date column shape (plain date, no timezone suffix).
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const selectedDateObj = parseISO(selectedDate);
  const isSelectedToday = isToday(selectedDateObj);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();

  const { data: meals, isLoading: mealsLoading } = useGetMeals({
    search: search || undefined,
    goal: goal !== "All" ? goal.toLowerCase().replace(' ', '-') : undefined,
  });

  const { data: diary } = useGetFoodDiary({ date: selectedDate });
  const mealsList = Array.isArray(meals) ? meals : [];
  const diaryList = Array.isArray(diary) ? diary : [];

  // Overlay Arabic titles/descriptions for seeded meals. In English
  // mode this is a no-op pass-through by reference. Custom meals (ids
  // not in the dictionary) fall through untouched, so user-authored
  // titles in any language render as-typed.
  const localizedMeals = mealsList.map((m) => translateMeal(m, lang));
  // Map of localized meals by id — used to re-translate diary entries'
  // snapshotted title/mealType using the current locale. Falling back
  // to the stored snapshot when the id is unknown keeps legacy /
  // custom-meal diary rows rendering correctly.
  const localizedMealsById = new Map(localizedMeals.map((m) => [m.id, m]));

  const addDiaryMutation = useAddFoodDiaryEntry({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("nutrition.addedToDiaryTitle"),
          description: t("nutrition.addedToDiaryDesc"),
        });
        // Refresh the diary AND the profile's progress chart so the
        // calorie totals and weekly bars reflect the new entry without
        // a hard reload.
        queryClient.invalidateQueries({ queryKey: getGetFoodDiaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("nutrition.errorLogMeal"),
        });
      }
    }
  });

  // -----------------------------------------------------------------------
  // Diary entry remove + edit — lets the user undo a mis-logged entry
  // or move it to a different meal slot. Both mutations invalidate the
  // diary cache on success so the sidebar rows and the derived total
  // (totalCalories below) recompute without any manual wiring.
  // -----------------------------------------------------------------------
  const [deletingEntry, setDeletingEntry] = useState<DiaryEntry | null>(null);

  // Invalidate both the diary list AND the progress aggregation so the
  // profile page's weekly chart + total-calories number stay in sync
  // with any add/edit/delete the user makes here.
  const invalidateDiary = () => {
    queryClient.invalidateQueries({ queryKey: getGetFoodDiaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
  };

  const deleteDiaryMutation = useDeleteFoodDiaryEntry({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("nutrition.entryRemovedTitle"),
          description: t("nutrition.entryRemovedDesc"),
        });
        setDeletingEntry(null);
        invalidateDiary();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("nutrition.errorRemoveEntry"),
        });
      },
    },
  });

  // PUT /meals/diary/:id — covers both inline edits exposed in the
  // sidebar (meal-type dropdown + calories tap-to-edit). The route
  // accepts a partial body so each control sends only its field.
  // Hits the diary endpoint, NOT /meals/:id, so it doesn't matter
  // whether the underlying meal is shared or owned — the diary row
  // is owner-scoped and always editable.
  const updateDiaryMutation = useUpdateFoodDiaryEntry({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("nutrition.entryUpdatedTitle"),
          description: t("nutrition.entryUpdatedDesc"),
        });
        invalidateDiary();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("nutrition.errorUpdateEntry"),
        });
      },
    },
  });

  // Fires a PUT only when the user picks a different type — clicking
  // the already-selected option is a no-op so we don't ping the server.
  const handleChangeEntryType = (
    entry: DiaryEntry,
    nextType: UpdateDiaryEntryMealType,
  ) => {
    if (entry.mealType === nextType) return;
    updateDiaryMutation.mutate({ id: entry.id, data: { mealType: nextType } });
  };

  // Inline calories editor — local state for which entry is currently
  // in edit mode and the in-progress draft string. Stored as a string
  // so the user can type freely (incl. clearing); we parse on commit.
  const [editingCaloriesId, setEditingCaloriesId] = useState<number | null>(
    null,
  );
  const [caloriesDraft, setCaloriesDraft] = useState("");

  const startEditCalories = (entry: DiaryEntry) => {
    setEditingCaloriesId(entry.id);
    setCaloriesDraft(String(entry.calories));
  };

  const commitCalories = (entry: DiaryEntry) => {
    const parsed = Number(caloriesDraft);
    // Tear down the editor first so a re-render doesn't keep the
    // input mounted while the toast/refetch is in flight.
    setEditingCaloriesId(null);
    setCaloriesDraft("");
    if (
      Number.isFinite(parsed) &&
      parsed >= 0 &&
      Math.round(parsed) !== entry.calories
    ) {
      updateDiaryMutation.mutate({
        id: entry.id,
        data: { calories: Math.round(parsed) },
      });
    }
  };

  // -----------------------------------------------------------------------
  // Meals CRUD — dialog state + mutations. The existing "Add to Diary"
  // flow above is untouched; these are additive operations on the meal
  // itself (create/edit/delete).
  // -----------------------------------------------------------------------
  const [mealDialogOpen, setMealDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | undefined>(undefined);
  const [deletingMeal, setDeletingMeal] = useState<Meal | null>(null);

  // After any meal mutation we invalidate the meals list so the grid
  // re-renders with the new data. Diary entries carry their own title
  // snapshot, so they do not need invalidation here.
  const invalidateMeals = () =>
    queryClient.invalidateQueries({ queryKey: getGetMealsQueryKey() });

  const createMealMutation = useCreateMeal({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("nutrition.mealAddedTitle"),
          description: t("nutrition.mealAddedDesc"),
        });
        setMealDialogOpen(false);
        invalidateMeals();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("nutrition.errorAddMeal"),
        });
      },
    },
  });

  const updateMealMutation = useUpdateMeal({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("nutrition.mealUpdatedTitle"),
          description: t("nutrition.mealUpdatedDesc"),
        });
        setMealDialogOpen(false);
        setEditingMeal(undefined);
        invalidateMeals();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("nutrition.errorUpdateMeal"),
        });
      },
    },
  });

  const deleteMealMutation = useDeleteMeal({
    mutation: {
      onSuccess: () => {
        toast({
          title: t("nutrition.mealDeletedTitle"),
          description: t("nutrition.mealDeletedDesc"),
        });
        setDeletingMeal(null);
        invalidateMeals();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("nutrition.errorDeleteMeal"),
        });
      },
    },
  });

  // Single submit handler branches on editingMeal so the dialog can be
  // bound to one prop. Keeps the dialog component ignorant of React Query.
  const handleMealSubmit = async (values: MealFormValues) => {
    if (editingMeal) {
      await updateMealMutation.mutateAsync({ id: editingMeal.id, data: values });
    } else {
      await createMealMutation.mutateAsync({ data: values });
    }
  };

  const openCreate = () => {
    setEditingMeal(undefined);
    setMealDialogOpen(true);
  };
  const openEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setMealDialogOpen(true);
  };

  const isMealFormSubmitting =
    createMealMutation.isPending || updateMealMutation.isPending;

  const totalCalories = diaryList.reduce(
  (sum, entry) => sum + entry.calories,
  0
);

  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-3">
          <Apple className="w-10 h-10 text-primary" />
          {t("nutrition.title")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          {t("nutrition.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Left Col: Recipes / Meals */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-2xl border border-border dark:border-white/5">
            <div className="relative flex-1">
              <Search className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t("nutrition.searchRecipes")}
                className="pl-12 rtl:pr-12 rtl:pl-4 h-12 bg-background border-border dark:border-white/10 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
              {GOAL_KEYS.map(g => (
                <Button
                  key={g}
                  variant={goal === g ? "default" : "outline"}
                  className={`rounded-xl h-12 px-5 font-bold ${goal === g ? "neon-glow" : "border-border dark:border-white/10"}`}
                  onClick={() => setGoal(g)}
                >
                  {t(GOAL_LABEL_KEY[g])}
                </Button>
              ))}
            </div>
          </div>

          {mealsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-card animate-pulse rounded-3xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {localizedMeals.map((meal) => (
                <div key={meal.id} className="bg-card rounded-3xl overflow-hidden border border-border dark:border-white/5 hover:border-primary/30 transition-all flex flex-col group">
                  <div className="relative h-48">
                    {/* healthy food bowl recipe */}
                    <img
                      src={meal.imageUrl || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"}
                      alt={meal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-black/60 backdrop-blur-md text-white font-bold">
                        {MEAL_TYPE_T_KEY[meal.mealType]
                          ? t(MEAL_TYPE_T_KEY[meal.mealType])
                          : meal.mealType}
                      </Badge>
                    </div>
                    {/* Edit / delete actions — placed opposite the meal-type
                        badge so they never overlap. Black translucent buttons
                        match the dark-theme pattern used for the blog favorite
                        button, keeping the visual vocabulary consistent. */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <button
                        onClick={() => openEdit(meal)}
                        aria-label={t("nutrition.editMealAria", { title: meal.title })}
                        className="p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 text-white transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMeal(meal)}
                        aria-label={t("nutrition.deleteMealAria", { title: meal.title })}
                        className="p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-red-500/80 text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{meal.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="border-primary/20 text-primary">{meal.calories} {t("nutrition.kcalSuffix")}</Badge>
                      {/* Macros are optional on custom meals — only render
                          when the seed row provides them so the card stays
                          clean for quick user entries. */}
                      {meal.protein != null && (
                        <Badge variant="outline" className="border-blue-500/20 text-blue-400">{meal.protein}{t("nutrition.proteinSuffix")}</Badge>
                      )}
                      {meal.carbs != null && (
                        <Badge variant="outline" className="border-yellow-500/20 text-yellow-400">{meal.carbs}{t("nutrition.carbsSuffix")}</Badge>
                      )}
                    </div>
                    {/* Description renders only when present so the card
                        visibly differentiates meals with a note from
                        bare ones. flex-1 lives on the trailing button
                        wrapper instead so the card height still expands
                        evenly when the description is empty. */}
                    {meal.description && meal.description.trim() !== "" ? (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                        {meal.description}
                      </p>
                    ) : (
                      <div className="flex-1" aria-hidden="true" />
                    )}
                    <Button
                      onClick={() => addDiaryMutation.mutate({ data: { mealId: meal.id, date: selectedDate, mealType: meal.mealType } })}
                      disabled={addDiaryMutation.isPending}
                      className="w-full font-bold bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" /> {t("nutrition.addToDiary")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Food Diary */}
        <div className="xl:col-span-1">
          <div className="bg-card rounded-3xl border border-border dark:border-white/5 p-6 sticky top-28">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="min-w-0">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {/* Calendar icon now triggers the date picker popover.
                      Tab-focusable, full keyboard support via the
                      shadcn Calendar primitive. */}
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("nutrition.changeDateAria")}
                        className="p-1 -m-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Calendar className="w-6 h-6" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="p-0 w-auto bg-card border-border dark:border-white/10"
                    >
                      <CalendarPicker
                        mode="single"
                        selected={selectedDateObj}
                        onSelect={(d) => {
                          if (!d) return;
                          setSelectedDate(format(d, "yyyy-MM-dd"));
                          setDatePickerOpen(false);
                        }}
                        // Block future dates — backfilling forgotten
                        // meals is the use case; logging future meals
                        // would muddy the progress chart.
                        disabled={(d) => d > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span>
                    {isSelectedToday
                      ? t("nutrition.todaysDiary")
                      : t("nutrition.diaryFor", {
                          date: format(selectedDateObj, "MMM d, yyyy", {
                            locale: lang === "ar" ? ar : enUS,
                          }),
                        })}
                  </span>
                </h3>
                {!isSelectedToday && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDate(format(new Date(), "yyyy-MM-dd"))
                    }
                    className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mt-1"
                  >
                    {t("nutrition.jumpToToday")}
                  </button>
                )}
              </div>
              {/* Add Meal — opens the shared MealFormDialog in create mode.
                  Lives here (next to the diary heading) per the feature
                  spec. Using size="sm" so it reads as a secondary action
                  rather than competing with the Add-to-Diary buttons on
                  the meal cards. */}
              <Button
                size="sm"
                onClick={openCreate}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-bold shrink-0"
              >
                <Plus className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" /> {t("nutrition.addMeal")}
              </Button>
            </div>

            <div className="bg-background rounded-2xl p-6 mb-8 text-center border border-border dark:border-white/5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-sm mb-2">{t("nutrition.totalConsumed")}</p>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60 mb-2">
                {totalCalories}
              </div>
              <p className="text-primary font-bold text-sm flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" /> {t("nutrition.kcalUpper")}
              </p>
            </div>

            <div className="space-y-4">
              {diaryList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{t("nutrition.noMealsLogged")}</p>
                </div>
              ) : (
                diaryList.map((entry) => {
                  // Re-translate the snapshotted title/mealType via the
                  // meal id so switching language updates the diary
                  // without needing to rewrite the persisted row.
                  // Falls back to the stored snapshot when the id is
                  // unknown (custom meals, deleted seeds).
                  const resolvedMeal = localizedMealsById.get(entry.mealId);
                  const displayTitle = resolvedMeal?.title ?? entry.mealTitle;
                  const displayType = MEAL_TYPE_T_KEY[entry.mealType]
                    ? t(MEAL_TYPE_T_KEY[entry.mealType])
                    : entry.mealType;
                  // Inline edits only — no modal. The pencil flips the
                  // meal-type dropdown; tapping the calories number
                  // turns it into an input. Both fields commit through
                  // the diary endpoint, which is owner-scoped on the
                  // entry, so it works regardless of whether the
                  // underlying meal is shared or owned (no 404).
                  const isEditingCalories = editingCaloriesId === entry.id;
                  const isUpdatingThisEntry =
                    updateDiaryMutation.isPending &&
                    updateDiaryMutation.variables?.id === entry.id;
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border dark:border-white/5 hover:border-primary/20 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{displayTitle}</p>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{displayType}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 rtl:ml-0 rtl:mr-3 shrink-0">
                        {/* Calories — click-to-edit. Renders as a
                            button by default (keyboard-focusable +
                            announces "edit calories"); on click it
                            swaps to a number input that commits on
                            Enter or blur. No modal, no extra
                            confirmation step. */}
                        {isEditingCalories ? (
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            autoFocus
                            value={caloriesDraft}
                            onChange={(e) => setCaloriesDraft(e.target.value)}
                            onBlur={() => commitCalories(entry)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur(); // triggers commit
                              }
                            }}
                            aria-label={t("nutrition.editCaloriesAria", { title: displayTitle })}
                            className="w-20 text-right font-black text-lg text-primary tabular-nums bg-card border border-primary/40 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditCalories(entry)}
                            aria-label={t("nutrition.editCaloriesAria", { title: displayTitle })}
                            className="text-right font-black text-lg text-primary tabular-nums px-2 py-0.5 rounded-md hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-text"
                          >
                            {entry.calories}
                          </button>
                        )}
                        {/* Per-row actions. Pencil = meal-type
                            dropdown; trash = remove entry. */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-card"
                              aria-label={t("nutrition.changeEntryTypeAria", { title: displayTitle })}
                              disabled={isUpdatingThisEntry}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-card border-border text-foreground dark:border-white/10 dark:text-white"
                          >
                            {DIARY_MEAL_TYPES.map((type) => {
                              const isCurrent = entry.mealType === type;
                              return (
                                <DropdownMenuItem
                                  key={type}
                                  onClick={() => handleChangeEntryType(entry, type)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={
                                      "w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 " +
                                      (isCurrent ? "opacity-100" : "opacity-0")
                                    }
                                  />
                                  {t(MEAL_TYPE_T_KEY[type])}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-400 hover:bg-card"
                          aria-label={t("nutrition.removeEntryAria", { title: displayTitle })}
                          onClick={() => setDeletingEntry(entry)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared meal create/edit dialog. Open/close and edit target are
          controlled by parent state so the same dialog serves both flows. */}
      <MealFormDialog
        open={mealDialogOpen}
        onOpenChange={(open) => {
          setMealDialogOpen(open);
          if (!open) setEditingMeal(undefined);
        }}
        initialMeal={editingMeal}
        onSubmit={handleMealSubmit}
        isSubmitting={isMealFormSubmitting}
      />

      {/* Destructive delete confirmation — existing diary entries retain
          their own title/calorie snapshot, so deleting a meal doesn't
          alter historical diary rows. We still ask the user to confirm. */}
      <AlertDialog
        open={deletingMeal !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingMeal(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border text-foreground dark:border-white/10 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">{t("nutrition.deleteMealTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {deletingMeal
                ? t("nutrition.deleteMealDesc", {
                    title: translateMeal(deletingMeal, lang).title,
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-border dark:border-white/10 bg-background hover:bg-background/80">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
              disabled={deleteMealMutation.isPending}
              onClick={(e) => {
                // Prevent the dialog from auto-closing before the
                // mutation has a chance to run. We close ourselves in
                // the mutation's onSuccess handler.
                e.preventDefault();
                if (deletingMeal) {
                  deleteMealMutation.mutate({ id: deletingMeal.id });
                }
              }}
            >
              {deleteMealMutation.isPending ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diary entry remove confirmation. Separate state from the meal
          delete dialog above so the two flows can't interfere with each
          other (e.g. user opens both, mutates one, the other stays open
          with a stale row). Same close-on-success pattern. */}
      <AlertDialog
        open={deletingEntry !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingEntry(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border text-foreground dark:border-white/10 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">
              {t("nutrition.removeEntryTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {deletingEntry
                ? t("nutrition.removeEntryDesc", {
                    // Use the localized title when we can resolve the
                    // meal id; otherwise fall back to the snapshot.
                    title:
                      localizedMealsById.get(deletingEntry.mealId)?.title ??
                      deletingEntry.mealTitle,
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-border dark:border-white/10 bg-background hover:bg-background/80">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
              disabled={deleteDiaryMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deletingEntry) {
                  deleteDiaryMutation.mutate({ id: deletingEntry.id });
                }
              }}
            >
              {deleteDiaryMutation.isPending ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
