import { Navbar } from "./Navbar";
import { useTranslation } from "@/lib/language-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        {children}
      </main>
      <footer className="border-t border-border/50 py-8 text-center text-muted-foreground text-sm">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} FitTrack. {t("layout.footerTagline")}</p>
        </div>
      </footer>
    </div>
  );
}
