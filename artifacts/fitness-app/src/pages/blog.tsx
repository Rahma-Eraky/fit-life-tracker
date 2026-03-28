import { useState } from "react";
import { PageTransition } from "@/components/layout/PageTransition";
import { useGetBlogArticles, useToggleArticleFavorite, getGetBlogArticlesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Search, BookOpen, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function Blog() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

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

  return (
    <PageTransition className="container mx-auto px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-6 flex justify-center items-center gap-4">
          <BookOpen className="w-12 h-12 text-primary" />
          THE KNOWLEDGE
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Expert advice, training protocols, nutrition science, and mindset strategies to level up your performance.
        </p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search articles..." 
            className="pl-12 h-14 bg-card border-white/5 rounded-full text-lg shadow-xl"
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
          {articles?.map((article) => (
            <div key={article.id} className="bg-card rounded-3xl overflow-hidden border border-white/5 hover:-translate-y-2 transition-all duration-300 group flex flex-col shadow-lg">
              <div className="relative h-60 overflow-hidden">
                {/* fitness blog header image */}
                <img 
                  src={article.imageUrl || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <button 
                  onClick={() => toggleFavMutation.mutate({ id: article.id })}
                  className="absolute top-4 right-4 p-3 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors"
                >
                  <Heart className={`w-5 h-5 transition-colors ${article.favorited ? "fill-primary text-primary" : "text-white"}`} />
                </button>
              </div>

              <div className="p-8 flex-1 flex flex-col relative">
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-secondary/50 text-xs font-bold uppercase tracking-wider">{tag}</Badge>
                  ))}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors leading-tight">
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                      {article.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{article.author}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="group-hover:bg-primary/10 group-hover:text-primary rounded-full">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
