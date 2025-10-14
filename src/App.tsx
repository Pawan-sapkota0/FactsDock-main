import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Country from "./pages/Country";
import FunFacts from "./pages/FunFacts";
import WorldFacts from "./pages/WorldFacts";
import CategoryView from "./pages/CategoryView";
import CountryCategoryPage from "./pages/CountryCategoryPage";
import Quiz from "./pages/Quiz";
import Facts from "./pages/Facts";
import QuizCountry from "./pages/QuizCountry";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/country/:slug" element={<Country />} />
          <Route path="/fun-facts" element={<FunFacts />} />
          <Route path="/fun-facts/:slug" element={<CategoryView />} />
          <Route path="/world-facts" element={<WorldFacts />} />
          <Route path="/world-facts/:slug" element={<CategoryView />} />
          <Route path="/countries/:country/:category" element={<CountryCategoryPage />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/:slug" element={<QuizCountry />} />
          <Route path="/facts/:category" element={<Facts />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
