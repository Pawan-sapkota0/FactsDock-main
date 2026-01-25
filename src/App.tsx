import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
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
import Facts from "./pages/Facts";
import QuizCountry from "./pages/QuizCountry";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
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
  <AdminAuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/country/:slug" element={<Country />} />
            <Route path="/fun-facts" element={<FunFacts />} />
            <Route path="/fun-zone" element={<FunZone />} />
            <Route path="/games/:categoryId" element={<GamesList />} />
            <Route path="/fun-facts/:slug" element={<CategoryView />} />
            <Route path="/world-facts" element={<WorldFacts />} />
            <Route path="/world-facts/:slug" element={<CategoryView />} />
            <Route path="/the-world" element={<TheWorld />} />
            <Route
              path="/countries/:country/:category"
              element={<CountryCategoryPage />}
            />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/:slug" element={<QuizCountry />} />
            <Route path="/facts/:category" element={<Facts />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            {/* Admin routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="facts" element={<FactsAdmin />} />
              <Route path="quizzes" element={<QuizzesAdmin />} />
              <Route path="categories" element={<CategoriesAdmin />} />
              <Route path="categories/new" element={<CategoryEdit />} />
              <Route path="categories/:id/edit" element={<CategoryEdit />} />
              <Route path="quizzes/new" element={<QuizEdit />} />
              <Route path="quizzes/:id/edit" element={<QuizEdit />} />
              <Route path="facts/new" element={<FactsEdit />} />
              <Route path="facts/:id/edit" element={<FactsEdit />} />
              <Route path="messages" element={<ContactMessages />} />
              <Route path="settings" element={<SettingsAdmin />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AdminAuthProvider>
);

export default App;
