import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "./components/layout/Layout";
import { AuthProvider } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-context";
import { LanguageProvider } from "./lib/language-context";
import { RequireAuth } from "./components/RequireAuth";
import Home from "./pages/home";
import Workouts from "./pages/workouts";
import WorkoutDetail from "./pages/workout-detail";
import WorkoutSession from "./pages/workout-session";
import Nutrition from "./pages/nutrition";
import Blog from "./pages/blog";
import BlogDetail from "./pages/blog-detail";
import Profile from "./pages/profile";
import Login from "./pages/login";
import Register from "./pages/register";
import NotFound from "./pages/not-found";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Small helper that wraps a page component in the auth gate. Keeps the
// route table readable while preserving wouter's `component` prop API.
function protectedRoute(Component: React.ComponentType) {
  return function Protected() {
    return (
      <RequireAuth>
        <Component />
      </RequireAuth>
    );
  };
}

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/workouts" component={Workouts} />
        <Route path="/blog" component={Blog} />

        {/* Auth-gated routes — hit /login and bounce back after sign-in */}
        <Route path="/workouts/:id" component={protectedRoute(WorkoutDetail)} />
        <Route
          path="/workouts/:id/session"
          component={protectedRoute(WorkoutSession)}
        />
        <Route path="/nutrition" component={protectedRoute(Nutrition)} />
        <Route path="/blog/:id" component={protectedRoute(BlogDetail)} />
        <Route path="/profile" component={protectedRoute(Profile)} />

        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ThemeProvider + LanguageProvider sit above everything that renders
          UI so the dark/light class and the lang/dir attributes on <html>
          are both owned by single sources of truth. Neither depends on
          auth/router/query, so they're safe up here. */}
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AuthProvider>
                <Layout>
                  <Router />
                </Layout>
              </AuthProvider>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
