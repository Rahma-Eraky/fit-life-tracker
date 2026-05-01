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
import { useTranslation } from "@/lib/language-context";

// Maps the backend's stable English short-day strings to translation
// keys so the recharts XAxis ticks are locale-aware. Backend continues
// to return "Mon".."Sun"; this mapping lives on the client so no API
// change is required.
const DAY_T_KEY: Record<string, string> = {
  Mon: "days.mon",
  Tue: "days.tue",
  Wed: "days.wed",
  Thu: "days.thu",
  Fri: "days.fri",
  Sat: "days.sat",
  Sun: "days.sun",
};

// Maps the backend's stable achievement numeric ids to translation
// key prefixes. Backend continues to return its own `title`/`description`
// strings; we deliberately ignore them in favour of the t() lookup so
// the copy flips with the active locale.
const ACHIEVEMENT_T_PREFIX: Record<number, string> = {
  1: "achievements.firstStep",
  2: "achievements.weekWarrior",
  3: "achievements.calorieCrusher",
};

// The zod message is a translation key — the form renderer below runs it
// through `t()` so the error displayed in the UI is locale-aware without
// requiring us to rebuild the resolver on every locale change.
const profileSchema = z.object({
  name: z.string().min(2, "profile.nameRequired"),
  age: z.coerce.number().min(10).max(120),
  weight: z.coerce.number().min(30),
  height: z.coerce.number().min(100),
  goal: z.enum(["weight-loss", "muscle-gain", "maintenance", "endurance"])
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: progress, isLoading: progressLoading } = useGetProgress();

  const updateMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: t("profile.profileUpdated") });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: t("profile.updateFailed") })
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
    return <div className="p-20 text-center animate-pulse text-xl font-bold">{t("profile.loadingProfile")}</div>;
  }

  const levelProgress = ((profile?.points || 0) % 1000) / 10; // Assuming 1000 pts per level

  return (
    <PageTransition className="container mx-auto px-4 md:px-6 space-y-12">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-border dark:border-white/5 flex items-center gap-6 col-span-1 md:col-span-2">
          <div className="w-24 h-24 rounded-full bg-secondary border-2 border-primary overflow-hidden flex-shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black">{profile?.name}</h2>
            <p className="text-primary font-bold tracking-widest uppercase mb-3">{t("profile.levelPrefix")} {profile?.level}</p>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${levelProgress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right rtl:text-left">
              {t("profile.pointsOf", {
                points: profile?.points ?? 0,
                total: (profile?.level || 1) * 1000,
              })}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border dark:border-white/5 flex flex-col justify-center items-center text-center">
          <Flame className="w-8 h-8 text-orange-500 mb-2" />
          <p className="text-3xl font-black">{progress?.weeklyStreak}</p>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">{t("profile.dayStreak")}</p>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border dark:border-white/5 flex flex-col justify-center items-center text-center">
          <CheckCircle className="w-8 h-8 text-primary mb-2" />
          <p className="text-3xl font-black">{progress?.completedWorkouts}</p>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">{t("profile.workouts")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Form */}
        <div className="lg:col-span-1 bg-card p-8 rounded-3xl border border-border dark:border-white/5">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-primary" /> {t("profile.editProfile")}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t("profile.fullName")}</label>
              <Input {...register("name")} className="bg-background border-border dark:border-white/10 h-12" />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {/* The zod message we set is a translation key, so run it
                      through t() at render time. If it doesn't resolve we
                      fall back to the raw string (shouldn't happen). */}
                  {errors.name.message ? t(errors.name.message) : ""}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t("profile.age")}</label>
                <Input type="number" {...register("age")} className="bg-background border-border dark:border-white/10 h-12" />
              </div>
              <div>
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t("profile.weightKg")}</label>
                <Input type="number" step="0.1" {...register("weight")} className="bg-background border-border dark:border-white/10 h-12" />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t("profile.heightCm")}</label>
              <Input type="number" {...register("height")} className="bg-background border-border dark:border-white/10 h-12" />
            </div>

            <div>
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{t("profile.primaryGoal")}</label>
              <Select onValueChange={(val) => setValue("goal", val as any)} defaultValue={profile?.goal}>
                <SelectTrigger className="bg-background border-border dark:border-white/10 h-12">
                  <SelectValue placeholder={t("profile.selectGoal")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-loss">{t("profile.goalWeightLoss")}</SelectItem>
                  <SelectItem value="muscle-gain">{t("profile.goalMuscleGain")}</SelectItem>
                  <SelectItem value="maintenance">{t("profile.goalMaintenance")}</SelectItem>
                  <SelectItem value="endurance">{t("profile.goalEndurance")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={updateMutation.isPending} className="w-full h-14 font-bold text-lg bg-primary hover:bg-primary/90 text-primary-foreground neon-glow">
              {updateMutation.isPending ? t("common.saving") : t("profile.saveChanges")}
            </Button>
          </form>
        </div>

        {/* Charts & Achievements */}
        <div className="lg:col-span-2 space-y-12">
          
          <div className="bg-card p-8 rounded-3xl border border-border dark:border-white/5">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> {t("profile.weeklyCaloriesBurned")}
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress?.weeklyWorkouts || []}>
                  <XAxis
                    dataKey="day"
                    stroke="#71717a"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: string) =>
                      DAY_T_KEY[value] ? t(DAY_T_KEY[value]) : value
                    }
                  />
                  <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted-foreground) / 0.1)' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="calories" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Medal className="w-6 h-6 text-primary" /> {t("profile.recentAchievements")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress?.recentAchievements?.map(ach => {
                // Prefer the client-side translation keyed by the
                // achievement's stable id. Fall back to the backend
                // strings for ids we don't recognise so newly added
                // achievements still render (just in English until
                // their dictionary entry is added).
                const prefix = ACHIEVEMENT_T_PREFIX[ach.id];
                const title = prefix ? t(`${prefix}.title`) : ach.title;
                const description = prefix
                  ? t(`${prefix}.description`)
                  : ach.description;
                return (
                  <div key={ach.id} className="bg-card p-5 rounded-2xl border border-border dark:border-white/5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                      {ach.icon}
                    </div>
                    <div>
                      <h4 className="font-bold">{title}</h4>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                  </div>
                );
              })}
              {(!progress?.recentAchievements || progress.recentAchievements.length === 0) && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  {t("profile.keepTraining")}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
