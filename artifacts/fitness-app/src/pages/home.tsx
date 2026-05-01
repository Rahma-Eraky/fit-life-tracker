import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Trophy, Zap } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-context";

export default function Home() {
  const { t } = useTranslation();
  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary font-bold text-sm tracking-wider mb-6 border border-primary/30">
                {t("home.heroKicker")}
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-display leading-[1.1] mb-6">
                {t("home.heroTitleLine1")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
                  {t("home.heroTitleLine2")}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                {t("home.heroDescription")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/workouts">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-full bg-primary hover:bg-primary/90 text-primary-foreground neon-glow group">
                    {t("home.startTrainingNow")}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-full border-border dark:border-white/20 hover:bg-muted/60 dark:hover:bg-white/5">
                    {t("home.viewYourProfile")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">{t("home.featuresTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home.featuresSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Flame className="w-8 h-8 text-primary" />,
                title: t("home.eliteWorkoutsTitle"),
                description: t("home.eliteWorkoutsDesc"),
                link: "/workouts"
              },
              {
                icon: <Zap className="w-8 h-8 text-primary" />,
                title: t("home.smartNutritionTitle"),
                description: t("home.smartNutritionDesc"),
                link: "/nutrition"
              },
              {
                icon: <Trophy className="w-8 h-8 text-primary" />,
                title: t("home.gamifiedProgressTitle"),
                description: t("home.gamifiedProgressDesc"),
                link: "/profile"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-card p-8 rounded-3xl border border-border dark:border-white/5 hover:border-primary/30 transition-colors group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <Link href={feature.link} className="text-primary font-bold flex items-center hover:underline">
                  {t("home.explore")} <ArrowRight className="ml-1 w-4 h-4 rtl:rotate-180" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border dark:border-white/5 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: t("home.statActiveUsers"), value: "10K+" },
              { label: t("home.statWorkoutsLogged"), value: "500K" },
              { label: t("home.statMealsTracked"), value: "1.2M" },
              { label: t("home.statCaloriesBurned"), value: "50M+" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center space-y-2">
                <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-200">
                  {stat.value}
                </span>
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
