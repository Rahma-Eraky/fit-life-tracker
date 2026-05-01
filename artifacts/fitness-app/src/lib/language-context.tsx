import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Locale } from "./translations";

/**
 * Language context — owns the active locale (`en` | `ar`), persists the
 * user's choice to localStorage, and keeps the `dir` + `lang` attributes
 * on <html> in sync so CSS and native browser behaviour (text selection,
 * form controls, etc.) flip between LTR and RTL correctly.
 *
 * Default is English. A matching inline script in index.html applies the
 * correct attributes before the first paint so there's no flash of the
 * wrong direction — same pattern used for the theme bootstrap.
 */

const STORAGE_KEY = "fittrack.lang";
const DEFAULT_LOCALE: Locale = "en";

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "en" || raw === "ar" ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

type Direction = "ltr" | "rtl";

function directionFor(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}

function applyHtmlAttrs(locale: Locale) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("lang", locale);
  html.setAttribute("dir", directionFor(locale));
}

/**
 * Resolve a dotted path against a translations object, falling back to the
 * English dictionary when a key is missing in Arabic. Returns the literal
 * path (e.g. "nav.home") if neither locale has it — that makes missing
 * keys obvious during development without crashing the UI.
 */
function resolvePath(
  dict: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let node: unknown = dict;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Substitute `{name}` placeholders in a template with values from `params`.
 * Leaves unknown placeholders untouched so a typo doesn't silently swallow
 * content — useful during dev.
 */
function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key as keyof typeof params]) : match,
  );
}

interface LanguageContextValue {
  lang: Locale;
  dir: Direction;
  setLang: (next: Locale) => void;
  toggleLang: () => void;
  /** Dotted-path translation lookup with {param} interpolation. */
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>(() => readStoredLocale());

  // Keep <html lang/dir> + localStorage in sync whenever the locale changes.
  useEffect(() => {
    applyHtmlAttrs(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage can throw (quota, privacy mode); harmless to skip.
    }
  }, [lang]);

  const setLang = useCallback((next: Locale) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  /**
   * Translation lookup. Stable reference: `t` only changes when `lang`
   * changes, so consumers can safely include it in effect deps without
   * causing re-runs on every render.
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const active = translations[lang] as unknown as Record<string, unknown>;
      const fallback = translations.en as unknown as Record<string, unknown>;
      const value = resolvePath(active, key) ?? resolvePath(fallback, key);
      if (value === undefined) return key;
      return interpolate(value, params);
    },
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, dir: directionFor(lang), setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return ctx;
}
