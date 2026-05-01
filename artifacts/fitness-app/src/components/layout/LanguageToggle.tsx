import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-context";

/**
 * Small ghost-style language switcher that mirrors ThemeToggle's shape so
 * both controls feel like the same family in the navbar.
 *
 * Why text-only (EN / AR) instead of flags: flags represent countries,
 * not languages. Arabic isn't "Saudi Arabia" and English isn't "UK", and
 * using flags here would misrepresent speakers who don't identify with
 * any one nation. The small Globe icon signals "language" unambiguously.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, toggleLang, t } = useTranslation();
  // Short label shown in the pill — always the OTHER language, so the
  // user reads "click me to go to AR" / "click me to go to EN".
  const nextLabel = lang === "en" ? "AR" : "EN";
  const ariaLabel =
    lang === "en" ? t("nav.switchToArabic") : t("nav.switchToEnglish");

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={toggleLang}
      className={`rounded-full hover:bg-muted/60 dark:hover:bg-white/5 h-10 px-3 gap-1.5 font-bold text-xs ${className}`}
    >
      <Globe className="w-4 h-4" />
      {/* Animate only the letters — Globe stays put so the control feels
          anchored. `mode="wait"` avoids the two labels stacking during
          the fade. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={nextLabel}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="tabular-nums tracking-wider"
        >
          {nextLabel}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
