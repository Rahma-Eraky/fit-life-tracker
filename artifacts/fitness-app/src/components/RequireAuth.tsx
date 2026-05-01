import { type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";

/**
 * RequireAuth — wrap protected pages with this component. If the user
 * is not signed in we send them to /login, preserving their intended
 * destination in a `?redirect=` query param so the login page can bounce
 * them back after sign-in. While the initial /auth/me probe is still
 * running we show a small spinner rather than flashing the login page.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();

  if (isBootstrapping) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2
          className="w-6 h-6 text-primary animate-spin"
          aria-label={t("common.loading")}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location || "/");
    return <Redirect to={`/login?redirect=${redirect}`} />;
  }

  return <>{children}</>;
}
