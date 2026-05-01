import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Activity, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/language-context";
import type { ApiError } from "@workspace/api-client-react";

/**
 * Register page. Mirrors the login page's layout + dark-theme styling.
 * Enforces the same 8-char minimum that the backend validates so users
 * see the rule before hitting submit.
 */

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError(t("register.pleaseFillFields"));
      return;
    }
    if (password.length < 8) {
      setError(t("register.passwordTooShort"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate("/");
      toast({
        title: t("register.welcomeToast"),
        description: t("register.accountReadyToast"),
      });
    } catch (err) {
      const apiErr = err as ApiError;
      const msg =
        apiErr?.status === 409
          ? t("register.emailExists")
          : t("register.signUpFailed");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 md:px-6 py-12 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-2xl font-display font-black text-foreground">
              FIT<span className="text-primary">TRACK</span>
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h1 className="text-3xl font-black font-display mb-2">{t("register.title")}</h1>
            <p className="text-muted-foreground text-sm mb-8">
              {t("register.subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="register-name"
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("register.nameLabel")}
                </Label>
                <Input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("register.namePlaceholder")}
                  className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-email"
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("register.emailLabel")}
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("register.emailPlaceholder")}
                  className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-password"
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("register.passwordLabel")}
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("register.passwordPlaceholder")}
                  className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                    {t("register.creatingAccount")}
                  </>
                ) : (
                  t("register.createAccountButton")
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              {t("register.alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="text-primary font-bold hover:underline"
              >
                {t("register.signIn")}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
