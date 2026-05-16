import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { UserAuthProvider } from "@/context/UserAuthContext";
import { ProtectedRoute } from "@/lib/route-guards";
import { SessionRestoreLoader } from "@/components/layout/SessionRestoreLoader";
import { AdminAuthWrapper } from "@/components/layout/AdminAuthWrapper";
import { AdminRoutesWrapper } from "@/components/layout/AdminRoutesWrapper";
import { AdsProvider } from "@/components/ads/AdsProvider";
import Index from "./pages/Index";
import Country from "./pages/Country";
import FunFacts from "./pages/FunFacts";
import FunZone from "./pages/FunZone";
import GamesList from "./pages/GamesList";
import WorldFacts from "./pages/WorldFacts";
import TheWorld from "./pages/TheWorld";
import CategoryView from "./pages/CategoryView";
import CountryCategoryPage from "./pages/CountryCategoryPage";
import Quiz from "./pages/Quiz";
import QuizPlayPage from "./pages/QuizPlayPage";
import Facts from "./pages/Facts";
import QuizCountry from "./pages/QuizCountry";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Stories from "./pages/Stories";
import StoryDetail from "./pages/StoryDetail";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import FactsAdmin from "./pages/admin/FactsAdmin";
import FactsEdit from "./pages/admin/FactsEdit";
import QuizzesAdmin from "@/pages/admin/QuizzesAdmin";
import CategoriesAdmin from "@/pages/admin/CategoriesAdmin";
import CategoryEdit from "@/pages/admin/CategoryEdit";
import QuizEdit from "@/pages/admin/QuizEdit";
import AdminGuard from "@/pages/admin/AdminGuard";
import Login from "./pages/admin/Login";
import ContactMessages from "./pages/admin/ContactMessages";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import ReviewPending from "./pages/admin/ReviewPending";
import ImageCacheAdmin from "./pages/admin/ImageCacheAdmin";
import CountryAboutAdmin from "./pages/admin/CountryAboutAdmin";
import StoriesAdmin from "./pages/admin/StoriesAdmin";
import StoryEdit from "./pages/admin/StoryEdit";
import UserLogin from "./pages/auth/Login";
import UserSignup from "./pages/auth/Signup";
import UserProfile from "./pages/auth/Profile";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import OAuthCallback from "./pages/auth/OAuthCallback";

const queryClient = new QueryClient();

// Scroll to top on route change - instant, no animation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Temporarily disable smooth scrolling for route changes
    const html = document.documentElement;
    const originalScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    // Scroll to top immediately
    window.scrollTo(0, 0);

    // Restore original scroll behavior after a frame
    const restoreTimer = requestAnimationFrame(() => {
      html.style.scrollBehavior = originalScrollBehavior;
    });

    return () => {
      cancelAnimationFrame(restoreTimer);
      html.style.scrollBehavior = originalScrollBehavior;
    };
  }, [pathname]);

  return null;
};

const App = () => (
  <UserAuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AdsProvider />
        <SessionRestoreLoader>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* ============================================================================= */}
              {/* PUBLIC PAGES - UserAuthContext only (NO AdminAuthContext)                   */}
              {/* ============================================================================= */}
              <Route path="/" element={<Index />} />
              <Route path="/country/:slug" element={<Country />} />
              <Route path="/fun-facts" element={<FunFacts />} />
              <Route path="/fun-zone" element={<FunZone />} />
              <Route path="/games/:categoryId" element={<GamesList />} />
              <Route path="/fun-facts/:slug" element={<CategoryView />} />
              <Route path="/world-facts" element={<WorldFacts />} />
              <Route path="/world-facts/:slug" element={<CategoryView />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/stories/:slug" element={<StoryDetail />} />
              <Route path="/the-world" element={<TheWorld />} />
              <Route
                path="/countries/:country/:category"
                element={<CountryCategoryPage />}
              />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz/play/:mode" element={<QuizPlayPage />} />
              <Route
                path="/quiz/play/:mode/:country"
                element={<QuizPlayPage />}
              />
              <Route path="/quiz/:slug" element={<QuizCountry />} />
              <Route path="/facts/:category" element={<Facts />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />

              {/* ============================================================================= */}
              {/* USER AUTH PAGES - ProtectedRoute guards + UserAuthContext                   */}
              {/* ============================================================================= */}
              <Route
                path="/auth/login"
                element={
                  <ProtectedRoute requireNoAuth={true}>
                    <UserLogin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auth/signup"
                element={
                  <ProtectedRoute requireNoAuth={true}>
                    <UserSignup />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route
                path="/auth/forgot-password"
                element={<ForgotPassword />}
              />
              <Route path="/auth/reset-password" element={<ForgotPassword />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* ============================================================================= */}
              {/* ADMIN ROUTES - FULLY ISOLATED with AdminAuthWrapper + AdminRoutesWrapper   */}
              {/* AdminAuthContext ONLY mounts when visiting /admin/* routes                  */}
              {/* Normal users on / or /auth/* are NEVER affected by admin checks             */}
              {/* ============================================================================= */}

              {/* Admin login - single page with isolated admin context */}
              {process.env.NODE_ENV === "production" ? null : (
                <Route
                  path="/admin/login"
                  element={
                    <AdminAuthWrapper>
                      <Login />
                    </AdminAuthWrapper>
                  }
                />
              )}
              <Route
                path="/secret-admin-login"
                element={
                  <AdminAuthWrapper>
                    <Login />
                  </AdminAuthWrapper>
                }
              />

              {/* Admin dashboard and subpages - all under /admin/ with AdminAuthWrapper */}
              <Route
                path="/admin/*"
                element={
                  <AdminAuthWrapper>
                    <AdminRoutesWrapper>
                      <AdminLayout />
                    </AdminRoutesWrapper>
                  </AdminAuthWrapper>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="facts" element={<FactsAdmin />} />
                <Route path="stories" element={<StoriesAdmin />} />
                <Route path="stories/new" element={<StoryEdit />} />
                <Route path="stories/:id/edit" element={<StoryEdit />} />
                <Route path="quizzes" element={<QuizzesAdmin />} />
                <Route path="review/pending" element={<ReviewPending />} />
                <Route path="categories" element={<CategoriesAdmin />} />
                <Route path="categories/new" element={<CategoryEdit />} />
                <Route path="categories/:id/edit" element={<CategoryEdit />} />
                <Route path="quizzes/new" element={<QuizEdit />} />
                <Route path="quizzes/:id/edit" element={<QuizEdit />} />
                <Route path="facts/new" element={<FactsEdit />} />
                <Route path="facts/:id/edit" element={<FactsEdit />} />
                <Route path="messages" element={<ContactMessages />} />
                <Route path="country-about" element={<CountryAboutAdmin />} />
                <Route path="settings" element={<SettingsAdmin />} />
                <Route path="image-cache" element={<ImageCacheAdmin />} />
              </Route>

              {/* ============================================================================= */}
              {/* CATCH-ALL LAST */}
              {/* ============================================================================= */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SessionRestoreLoader>
      </TooltipProvider>
    </QueryClientProvider>
  </UserAuthProvider>
);

export default App;
