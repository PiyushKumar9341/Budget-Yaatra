import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import DestinationPage from "@/pages/DestinationPage";
import PlannerPage from "@/pages/PlannerPage";
import MyTripsPage from "@/pages/MyTripsPage";
import AuthCallback from "@/pages/AuthCallback";
import StoriesPage from "@/pages/StoriesPage";
import StoryDetail from "@/pages/StoryDetail";
import StoryEditor from "@/pages/StoryEditor";

function AppRouter() {
    const location = useLocation();
    // CRITICAL: detect session_id in URL fragment synchronously (before ProtectedRoute)
    if (location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/destination/:slug" element={<DestinationPage />} />
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/mine" element={<MyTripsPage />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/stories/new" element={<StoryEditor />} />
                <Route path="/stories/:id" element={<StoryDetail />} />
                <Route path="*" element={<Landing />} />
            </Routes>
        </Layout>
    );
}

function App() {
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
