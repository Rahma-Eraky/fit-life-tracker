import { useState } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { useGetWorkouts, useCompleteWorkout, getGetWorkoutsQueryKey, getGetProgressQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Play, CheckCircle, Clock, Flame, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All", "Strength", "Cardio", "Yoga", "Home"];
const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

export default function Workouts() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workouts, isLoading } = useGetWorkouts({
    search: search || undefined,
    category: category !== "All" ? category.toLowerCase() : undefined,
    difficulty: difficulty !== "All" ? difficulty.toLowerCase() : undefined,
  });

  const completeMutation = useCompleteWorkout({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Workout Completed! 🎉",
          description: `You earned ${data.pointsEarned} points. Total points: ${data.totalPoints}`,
        });
        queryClient.invalidateQueries({ queryKey: getGetWorkoutsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProgressQueryKey() });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not complete workout. Please try again.",
        });
      }
    }
  });

  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-3">
            <Dumbbell className="w-10 h-10 text-primary" />
            WORKOUTS
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Choose your battle. Crush it. Earn points. Filter by category or difficulty to find the perfect routine.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-12 bg-card p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search workouts..." 
            className="pl-12 h-14 bg-background border-white/10 rounded-xl text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className={`rounded-full h-14 px-6 font-bold ${category === cat ? "neon-glow" : "border-white/10"}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card rounded-3xl h-[400px] animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {workouts?.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center"
              >
                <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">No workouts found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              </motion.div>
            ) : (
              workouts?.map((workout, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  key={workout.id}
                  className="bg-card rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 group flex flex-col"
                >
                  <div className="relative h-56 overflow-hidden">
                    {/* workout fitness training gym */}
                    <img 
                      src={workout.imageUrl || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"} 
                      alt={workout.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge className="bg-black/50 backdrop-blur-md border-none text-white uppercase font-bold tracking-wider">
                        {workout.category}
                      </Badge>
                      <Badge className="bg-primary/80 backdrop-blur-md border-none text-primary-foreground uppercase font-bold tracking-wider">
                        {workout.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{workout.title}</h3>
                    <p className="text-muted-foreground line-clamp-2 mb-6 flex-1">
                      {workout.description}
                    </p>

                    <div className="flex items-center justify-between py-4 border-y border-white/5 mb-6">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Clock className="w-5 h-5 text-primary" />
                        {workout.duration} min
                      </div>
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Flame className="w-5 h-5 text-orange-500" />
                        {workout.calories} kcal
                      </div>
                    </div>

                    <Button 
                      onClick={() => completeMutation.mutate({ id: workout.id })}
                      disabled={workout.completed || completeMutation.isPending}
                      className={`w-full h-14 rounded-xl font-bold text-lg ${
                        workout.completed 
                          ? "bg-secondary text-white opacity-50 cursor-not-allowed" 
                          : "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                      }`}
                    >
                      {workout.completed ? (
                        <>
                          <CheckCircle className="mr-2 w-5 h-5" /> Completed
                        </>
                      ) : completeMutation.isPending ? (
                        "Saving..."
                      ) : (
                        <>
                          <Play className="mr-2 w-5 h-5 fill-current" /> Mark Complete
                        </>
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
