import { useState } from "react";
import { Link, useLocation } from "wouter";
import { PageTransition } from "@/components/layout/PageTransition";
import { useGetBlogArticles, useToggleArticleFavorite, getGetBlogArticlesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Search, BookOpen, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/language-context";
import { translateArticle } from "@/lib/translate-content";
import { translateTag, translateAuthor } from "@/lib/content-translations";

export default function Blog() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();
  // Programmatic navigation for the click-anywhere-on-card behavior. Wouter
  // returns [currentPath, setLocation] from useLocation; we only need the
  // setter. Going through this hook (rather than wrapping the card in a
  // <Link>) avoids invalid HTML — the card already contains a <button>
  // (the favorite heart), and nesting <button> inside an <a> is not allowed.
  const [, navigate] = useLocation();

  const { data: articles, isLoading } = useGetBlogArticles({
    search: search || undefined,
  });

  const toggleFavMutation = useToggleArticleFavorite({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBlogArticlesQueryKey() });
      }
    }
  });


  console.log("articles =", articles);
  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-6 flex justify-center items-center gap-4">
          <BookOpen className="w-12 h-12 text-primary" />
          {t("blog.title")}
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {t("blog.subtitle")}
        </p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t("blog.searchArticles")}
            className="pl-12 rtl:pr-12 rtl:pl-4 h-14 bg-card border-border dark:border-white/5 rounded-full text-lg shadow-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-96 bg-card animate-pulse rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(Array.isArray(articles) ? articles : [])
            .map((article) => translateArticle(article, lang))
            .map((article) => (
            <div
              key={article.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/blog/${article.id}`)}
              onKeyDown={(e) => {
                // Mirror native link/button keyboard behaviour: Enter or
                // Space activates. We preventDefault on Space so the page
                // doesn't scroll while the user is "clicking" the card.
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/blog/${article.id}`);
                }
              }}
              className="bg-card rounded-3xl overflow-hidden border border-border dark:border-white/5 hover:-translate-y-2 transition-transform duration-300 transform-gpu group flex flex-col shadow-lg cursor-pointer focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="relative h-60 overflow-hidden">
                {/* fitness blog header image */}
                <img
                  src={article.imageUrl || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"}
                  alt={article.title}
                  // transform-gpu forces GPU compositing so the scale transform
                  // doesn't produce a 1px seam at the rounded corners of the
                  // overflow-hidden card (which was causing the hover flicker).
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 transform-gpu"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <button
                  onClick={(e) => {
                    // Heart sits inside the click-anywhere card; without
                    // stopPropagation, toggling the favorite would also
                    // navigate to the article. Stop the event before it
                    // bubbles up to the card's onClick.
                    e.stopPropagation();
                    toggleFavMutation.mutate({ id: article.id });
                  }}
                  className="absolute top-4 right-4 p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors"
                >
                  <Heart className={`w-5 h-5 transition-colors ${article.favorited ? "fill-primary text-primary" : "text-white"}`} />
                </button>
              </div>

              <div className="p-8 flex-1 flex flex-col relative">
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-secondary/50 text-xs font-bold uppercase tracking-wider">
                      {translateTag(tag, lang)}
                    </Badge>
                  ))}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors leading-tight">
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-border dark:border-white/5">
                  <div className="flex items-center gap-3">
                    {/* Translate author once so the avatar initial and the
                        displayed name agree (otherwise an Arabic name would
                        still show a Latin initial). */}
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                      {translateAuthor(article.author, lang).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {translateAuthor(article.author, lang)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(article.publishedAt), 'MMM d, yyyy', {
                          locale: lang === "ar" ? ar : enUS,
                        })}
                      </p>
                    </div>
                  </div>
                  {/* Arrow navigates to the full article at /blog/:id.
                      We wrap only the button (not the whole card) because the
                      card already contains a favorite <button>, and nesting
                      an interactive button inside an <a> is invalid HTML. */}
                  <Link href={`/blog/${article.id}`}>
                    <Button variant="ghost" size="icon" className="group-hover:bg-primary/10 group-hover:text-primary rounded-full">
                      <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
