import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";
import Exercises from "./pages/Exercises";
import Nutrition from "./pages/Nutrition";
import Supplements from "./pages/Supplements";
import Progress from "./pages/Progress";
import Recovery from "./pages/Recovery";
import Periodization from "./pages/Periodization";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Coach from "./pages/Coach";
import Cardio from "./pages/Cardio";
import Groceries from "./pages/Groceries";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <InstallPrompt />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="nutrition" element={<Nutrition />} />
              <Route path="groceries" element={<div className="text-foreground">Grocery List - Coming Soon</div>} />
              <Route path="supplements" element={<Supplements />} />
              <Route path="compounds" element={<div className="text-foreground">Compounds Reference - Coming Soon</div>} />
              <Route path="progress" element={<Progress />} />
              <Route path="recovery" element={<Recovery />} />
              <Route path="periodization" element={<Periodization />} />
              <Route path="coach" element={<Coach />} />
              <Route path="settings" element={<Settings />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
