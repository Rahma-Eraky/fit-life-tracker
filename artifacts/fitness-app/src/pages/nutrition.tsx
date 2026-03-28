import { useState } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { useGetMeals, useGetFoodDiary, useAddFoodDiaryEntry, getGetFoodDiaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Apple, Calendar, Target, Flame } from "lucide-react";
import { format } from "date-fns";

const GOALS = ["All", "Weight Loss", "Muscle Gain", "Maintenance"];

export default function Nutrition() {
  const [search, setSearch] = useState("");
  const [goal, setGoal] = useState("All");
  const today = format(new Date(), 'yyyy-MM-dd');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meals, isLoading: mealsLoading } = useGetMeals({
    search: search || undefined,
    goal: goal !== "All" ? goal.toLowerCase().replace(' ', '-') : undefined,
  });

  const { data: diary } = useGetFoodDiary({ date: today });

  const addDiaryMutation = useAddFoodDiaryEntry({
    mutation: {
      onSuccess: () => {
        toast({ title: "Added to diary", description: "Meal logged successfully." });
        queryClient.invalidateQueries({ queryKey: getGetFoodDiaryQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to log meal." });
      }
    }
  });

  const totalCalories = diary?.reduce((sum, entry) => sum + entry.calories, 0) || 0;

  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-3">
          <Apple className="w-10 h-10 text-primary" />
          NUTRITION & DIARY
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Fuel your body. Log your meals and discover recipes crafted for your specific goals.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Left Col: Recipes / Meals */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-2xl border border-white/5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search recipes..." 
                className="pl-12 h-12 bg-background border-white/10 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
              {GOALS.map(g => (
                <Button
                  key={g}
                  variant={goal === g ? "default" : "outline"}
                  className={`rounded-xl h-12 px-5 font-bold ${goal === g ? "neon-glow" : "border-white/10"}`}
                  onClick={() => setGoal(g)}
                >
                  {g}
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
              {meals?.map((meal) => (
                <div key={meal.id} className="bg-card rounded-3xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all flex flex-col group">
                  <div className="relative h-48">
                    {/* healthy food bowl recipe */}
                    <img 
                      src={meal.imageUrl || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"} 
                      alt={meal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-black/60 backdrop-blur-md text-white font-bold">{meal.mealType}</Badge>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{meal.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="border-primary/20 text-primary">{meal.calories} kcal</Badge>
                      <Badge variant="outline" className="border-blue-500/20 text-blue-400">{meal.protein}g Protein</Badge>
                      <Badge variant="outline" className="border-yellow-500/20 text-yellow-400">{meal.carbs}g Carbs</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
                      {meal.description}
                    </p>
                    <Button 
                      onClick={() => addDiaryMutation.mutate({ data: { mealId: meal.id, date: today, mealType: meal.mealType }})}
                      disabled={addDiaryMutation.isPending}
                      className="w-full font-bold bg-secondary hover:bg-primary hover:text-primary-foreground text-white transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add to Diary
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Food Diary */}
        <div className="xl:col-span-1">
          <div className="bg-card rounded-3xl border border-white/5 p-6 sticky top-28">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" /> Today's Diary
              </h3>
            </div>

            <div className="bg-background rounded-2xl p-6 mb-8 text-center border border-white/5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <p className="text-muted-foreground font-semibold uppercase tracking-wider text-sm mb-2">Total Consumed</p>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
                {totalCalories}
              </div>
              <p className="text-primary font-bold text-sm flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" /> Kcal
              </p>
            </div>

            <div className="space-y-4">
              {diary?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No meals logged yet today.</p>
                </div>
              ) : (
                diary?.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-white/5 hover:border-primary/20 transition-colors">
                    <div>
                      <p className="font-bold">{entry.mealTitle}</p>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{entry.mealType}</p>
                    </div>
                    <div className="text-right font-black text-lg text-primary">
                      {entry.calories}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
