import { Link, useLocation } from "wouter";
import { Menu, X, Activity, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

// Nav link hrefs are stable; labels come from the translations dictionary
// via the i18n key so the nav reflows when the user flips languages.
const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/workouts", labelKey: "nav.workouts" },
  { href: "/nutrition", labelKey: "nav.nutrition" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/profile", labelKey: "nav.profile" },
];

export function Navbar() {
  const [location, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  // Show an abbreviated nav set on the auth pages themselves — the
  // Start Training / user menu would look odd next to "Welcome back".
  const onAuthPage = location === "/login" || location === "/register";

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "glass-panel py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-display font-black text-foreground hover:text-primary transition-colors"
        >
          <Activity className="w-8 h-8 text-primary" />
          FIT<span className="text-primary">TRACK</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative font-medium text-sm transition-colors hover:text-foreground ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t(link.labelKey)}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full neon-glow"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          {/* Theme + language toggles are always visible — including on
              /login and /register — since both are preferences, not auth
              controls. Grouped in a single flex so they sit together. */}
          <div className="ml-4 flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          {!onAuthPage && (
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full border-border hover:bg-muted/60 dark:border-white/20 dark:hover:bg-white/5 font-bold px-4"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {user?.name ?? t("nav.account")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-card border-border text-foreground dark:border-white/10 dark:text-white"
                  >
                    <DropdownMenuLabel className="text-muted-foreground">
                      {user?.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border dark:bg-white/10" />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        {t("nav.profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-400 focus:text-red-400"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("nav.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="rounded-full hover:bg-muted/60 dark:hover:bg-white/5 font-bold px-4"
                    >
                      {t("nav.signIn")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6 rounded-full neon-glow">
                      {t("nav.getStarted")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Mobile: both toggles sit next to the hamburger so users can
            flip language/theme without opening the sheet. */}
        <div className="md:hidden flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <button
            className="text-foreground p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-panel border-t border-border dark:border-white/10"
          >
            <nav className="flex flex-col p-4 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-3 rounded-lg font-medium ${
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 dark:hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}

              {/* Auth controls pushed into the mobile menu too. */}
              <div className="border-t border-border dark:border-white/10 pt-3 mt-1">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left p-3 rounded-lg font-medium text-red-500 dark:text-red-400 hover:bg-muted/60 dark:hover:bg-white/5 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("nav.signOut")} ({user?.name})
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-3 rounded-lg font-medium text-muted-foreground hover:bg-muted/60 dark:hover:bg-white/5 hover:text-foreground"
                    >
                      {t("nav.signIn")}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-3 rounded-lg font-bold text-primary bg-primary/10 hover:bg-primary/20"
                    >
                      {t("nav.getStarted")}
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
