import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeProfile from "./pages/EmployeeProfile";
import CommandBoard from "./pages/CommandBoard";
import VoiceCommand from "./pages/VoiceCommand";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          
          {/* Command Board - PUBLIC */}
          <Route path="/command-board" element={<CommandBoard />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole="owner">
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/employee/:id" 
            element={
              <ProtectedRoute>
                <EmployeeProfile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/voice-command/:id" 
            element={
              <ProtectedRoute>
                <VoiceCommand />
              </ProtectedRoute>
            } 
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;