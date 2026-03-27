import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeProfile from "./pages/EmployeeProfile";
import CommandBoard from "./pages/CommandBoard";
import Performance from "./pages/Performance";
import TaskHistory from "./pages/TaskHistory";
import VoiceCommand from "./pages/VoiceCommand";
import NotFound from "./pages/NotFound";
import AudioTest from "./pages/AudioTest";
import ProtectedRoute from "./components/ProtectedRoute";

import AITaskAssistant from "./components/AITaskAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" theme="dark" richColors />

      <BrowserRouter>
        <AITaskAssistant />
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          
          {/* Command Board - Accessible to all authenticated users */}
          <Route 
            path="/command-board" 
            element={
              <ProtectedRoute>
                <CommandBoard />
              </ProtectedRoute>
            } 
          />

          {/* Protected routes - Owner only */}
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
              <ProtectedRoute requiredRole="owner">
                <EmployeeProfile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/performance" 
            element={
              <ProtectedRoute requiredRole="owner">
                <Performance />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/voice-command/:id" 
            element={
              <ProtectedRoute requiredRole="owner">
                <VoiceCommand />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/history" 
            element={
              <ProtectedRoute requiredRole="owner">
                <TaskHistory />
              </ProtectedRoute>
            } 
          />

          <Route path="/audio-test" element={<AudioTest />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;