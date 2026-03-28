import { PageTransition } from "@/components/layout/PageTransition";
import { useGetProfile, useGetProgress, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { User, Medal, Flame, Activity, CheckCircle, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(2, "Name required"),
  age: z.coerce.number().min(10).max(120),
  weight: z.coerce.number().min(30),
  height: z.coerce.number().min(100),
  goal: z.enum(["weight-loss", "muscle-gain", "maintenance", "endurance"])
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: progress, isLoading: progressLoading } = useGetProgress();

  const updateMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile updated successfully!" });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Update failed" })
    }
  });

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate({ data });
  };

  if (profileLoading || progressLoading) {
    return <div className="p-20 text-center animate-pulse text-xl font-bold">Loading Profile...</div>;
  }

  const levelProgress = ((profile?.points || 0) % 1000) / 10; // Assuming 1000 pts per level

  return (
    <PageTransition className="container mx-auto px-4 md:px-6 space-y-12">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-white/5 flex items-center gap-6 col-span-1 md:col-span-2">
          <div className="w-24 h-24 rounded-full bg-secondary border-2 border-primary overflow-hidden flex-shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black">{profile?.name}</h2>
            <p className="text-primary font-bold tracking-widest uppercase mb-3">Level {profile?.level}</p>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${levelProgress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right">{profile?.points} / {((profile?.level || 1) * 1000)} pts</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-white/5 flex flex-col justify-center items-center text-center">
          <Flame className="w-8 h-8 text-orange-500 mb-2" />
          <p className="text-3xl font-black">{progress?.weeklyStreak}</p>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Day Streak</p>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-white/5 flex flex-col justify-center items-center text-center">
          <CheckCircle className="w-8 h-8 text-primary mb-2" />
          <p className="text-3xl font-black">{progress?.completedWorkouts}</p>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Workouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Form */}
        <div className="lg:col-span-1 bg-card p-8 rounded-3xl border border-white/5">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-primary" /> Edit Profile
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Full Name</label>
              <Input {...register("name")} className="bg-background border-white/10 h-12" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Age</label>
                <Input type="number" {...register("age")} className="bg-background border-white/10 h-12" />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Weight (kg)</label>
                <Input type="number" step="0.1" {...register("weight")} className="bg-background border-white/10 h-12" />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Height (cm)</label>
              <Input type="number" {...register("height")} className="bg-background border-white/10 h-12" />
            </div>

            <div>
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Primary Goal</label>
              <Select onValueChange={(val) => setValue("goal", val as any)} defaultValue={profile?.goal}>
                <SelectTrigger className="bg-background border-white/10 h-12">
                  <SelectValue placeholder="Select Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={updateMutation.isPending} className="w-full h-14 font-bold text-lg bg-primary hover:bg-primary/90 text-primary-foreground neon-glow">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        {/* Charts & Achievements */}
        <div className="lg:col-span-2 space-y-12">
          
          <div className="bg-card p-8 rounded-3xl border border-white/5">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> Weekly Calories Burned
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress?.weeklyWorkouts || []}>
                  <XAxis dataKey="day" stroke="#71717a" tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="calories" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Medal className="w-6 h-6 text-primary" /> Recent Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress?.recentAchievements?.map(ach => (
                <div key={ach.id} className="bg-card p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    {ach.icon}
                  </div>
                  <div>
                    <h4 className="font-bold">{ach.title}</h4>
                    <p className="text-sm text-muted-foreground">{ach.description}</p>
                  </div>
                </div>
              ))}
              {(!progress?.recentAchievements || progress.recentAchievements.length === 0) && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Keep training to unlock your first achievements!
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
