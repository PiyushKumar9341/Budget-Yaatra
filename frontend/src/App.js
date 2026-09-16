import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import "@/App.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { ScrollProgress, PageFade } from "@/components/motion-helpers";
import Landing from "@/pages/Landing";
import DestinationPage from "@/pages/DestinationPage";
import PlannerPage from "@/pages/PlannerPage";
import MyTripsPage from "@/pages/MyTripsPage";
import AuthCallback from "@/pages/AuthCallback";
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
  // CRITICAL: detect session_id in URL fragment synchronously (before ProtectedRoute)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
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
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Yaha se tab ka title force ho jayega
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