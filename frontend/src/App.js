import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import "@/App.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import { ScrollProgress, PageFade } from "@/components/motion-helpers";
import Landing from "@/pages/Landing";
import DestinationPage from "@/pages/DestinationPage";
import PlannerPage from "@/pages/PlannerPage";
import MyTripsPage from "@/pages/MyTripsPage";
import StoriesPage from "@/pages/StoriesPage";
import StoryDetail from "@/pages/StoryDetail";
import StoryEditor from "@/pages/StoryEditor";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRouter() {
  const location = useLocation();
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  return (
    <Layout>
      <ScrollToTop />
      <ScrollProgress />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageFade><Landing /></PageFade>} />
          <Route path="/destination/:slug" element={<PageFade><DestinationPage /></PageFade>} />
          <Route path="/planner" element={<PageFade><PlannerPage /></PageFade>} />
          <Route path="/mine" element={<PageFade><MyTripsPage /></PageFade>} />
          <Route path="/stories" element={<PageFade><StoriesPage /></PageFade>} />
          <Route path="/stories/new" element={<PageFade><StoryEditor /></PageFade>} />
          <Route path="/stories/:id" element={<PageFade><StoryDetail /></PageFade>} />
          <Route path="*" element={<PageFade><Landing /></PageFade>} />
        </Routes>
      </AnimatePresence>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.title = "Budget Yaatra";
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="bottom-right" theme="light" richColors />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;