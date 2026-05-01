import { Link, useParams } from "wouter";
import { useGetBlogArticles } from "@workspace/api-client-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/language-context";
import { translateArticle } from "@/lib/translate-content";
import { translateTag, translateAuthor } from "@/lib/content-translations";

/**
 * BlogDetail — full-article view at `/blog/:id`.
 *
 * We deliberately reuse `useGetBlogArticles()` (the list query) instead of
 * introducing a dedicated `GET /blog/:id` endpoint. Two reasons:
 *   1. The list response already includes the full `content` field, so a
 *      detail endpoint would duplicate data the client already fetches.
 *   2. Sharing the query key with the list page means navigating from list
 *      → detail is served instantly from the React Query cache; no refetch.
 *
 * If the blog ever grows past a few hundred articles we can trivially add a
 * `GET /blog/:id` endpoint and swap the hook — nothing else on this page
 * would need to change.
 */
export default function BlogDetail() {
  const params = useParams<{ id: string }>();
  const articleId = Number(params.id);
  const { t, lang } = useTranslation();

  const { data: articles, isLoading } = useGetBlogArticles();
  const articlesList = Array.isArray(articles) ? articles : [];
  const rawArticle = articlesList.find((a) => a.id === articleId);
  // Overlay Arabic content for `ar`. In English mode this is a no-op
  // pass-through by reference.
  const article = rawArticle ? translateArticle(rawArticle, lang) : undefined;

  // Loading skeleton — matches the list page's shimmer style so the
  // transition feels continuous in the dark theme.
  if (isLoading) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-32 bg-card animate-pulse rounded-full mb-6" />
          <div className="h-[400px] bg-card animate-pulse rounded-3xl mb-8" />
          <div className="h-12 bg-card animate-pulse rounded-xl mb-4 w-3/4" />
          <div className="h-5 bg-card animate-pulse rounded-xl w-1/2" />
        </div>
      </PageTransition>
    );
  }

  // 404-style fallback when the id is unknown or non-numeric.
  if (!article || Number.isNaN(articleId)) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center py-24">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-3xl font-bold mb-2">{t("blogDetail.notFound")}</h2>
          <p className="text-muted-foreground mb-8">
            {t("blogDetail.notFoundDesc")}
          </p>
          <Link href="/blog">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow">
              <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" /> {t("blogDetail.backToBlog")}
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link — ghost variant matches the dark-theme navigation feel */}
        <Link href="/blog">
          <Button
            variant="ghost"
            className="mb-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-card"
          >
            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" /> {t("blogDetail.backToBlog")}
          </Button>
        </Link>

        {/* Hero image with gradient fade into background (same pattern as
            the workout card hero so the dark theme stays consistent). */}
        <div className="relative h-[320px] md:h-[420px] rounded-3xl overflow-hidden mb-8 border border-border dark:border-white/5">
          <img
            src={
              article.imageUrl ||
              "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80"
            }
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-secondary/50 text-xs font-bold uppercase tracking-wider"
              >
                {translateTag(tag, lang)}
              </Badge>
            ))}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 pb-6 mb-10 border-b border-border dark:border-white/5">
          {/* Translate author once so the avatar initial and the
              displayed name agree (otherwise an Arabic name would
              still show a Latin initial). */}
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-primary text-lg">
            {translateAuthor(article.author, lang).charAt(0)}
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{translateAuthor(article.author, lang)}</p>
            <p className="text-sm text-muted-foreground flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {format(new Date(article.publishedAt), "MMMM d, yyyy", {
                locale: lang === "ar" ? ar : enUS,
              })}
            </p>
          </div>
        </div>

        {/* Article body. Content is stored as plain text with `\n\n`
            separating paragraphs, so we split and render each block as a
            real <p>. Tailwind Typography's `prose` then gives paragraph
            rhythm (spacing, font-size, line-height). `dark:prose-invert`
            swaps to lighter colours in dark mode; in light mode the
            default prose colours render on the bg-background surface.
            Empty blocks (stray blank lines) are filtered so we don't
            emit empty <p> tags that break vertical rhythm. */}
        <article className="prose dark:prose-invert max-w-none leading-relaxed">
          {article.content
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter((paragraph) => paragraph.length > 0)
            .map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
        </article>
      </div>
    </PageTransition>
  );
}
