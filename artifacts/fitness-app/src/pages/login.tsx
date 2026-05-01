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
 * Login page.
 *
 * Reads a `?redirect=<path>` query param and bounces the user there after a
 * successful sign-in. Falls back to `/` when absent or unsafe.
 *
 * Demo credentials are shown in a small hint below the form so an empty
 * install can be explored in one click without having to remember the
 * seeded values.
 */

function getSafeRedirect(search: string): string {
  try {
    const params = new URLSearchParams(search);
    const raw = params.get("redirect");
    // Allow only relative paths to avoid open-redirect surprises.
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  } catch {
    /* ignore malformed query */
  }
  return "/";
}

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("login.pleaseFillFields"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      const target = getSafeRedirect(window.location.search);
      navigate(target);
      toast({
        title: t("login.welcomeBackToast"),
        description: t("login.signedInToast"),
      });
    } catch (err) {
      const apiErr = err as ApiError;
      const msg =
        apiErr?.status === 401
          ? t("login.invalidCredentials")
          : t("login.signInFailed");
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
            <h1 className="text-3xl font-black font-display mb-2">{t("login.title")}</h1>
            <p className="text-muted-foreground text-sm mb-8">
              {t("login.subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="login-email"
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("login.emailLabel")}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="login-password"
                  className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {t("login.passwordLabel")}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
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
                    {t("login.signingIn")}
                  </>
                ) : (
                  t("login.signInButton")
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              {t("login.newHere")}{" "}
              <Link
                href="/register"
                className="text-primary font-bold hover:underline"
              >
                {t("login.createAccount")}
              </Link>
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            {t("login.demoLabel")} <span className="font-mono">demo@fitlife.com</span> /{" "}
            <span className="font-mono">demo1234</span>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
