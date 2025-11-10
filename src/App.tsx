import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import RTO from "./pages/RTO";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CODRemittance from "./pages/CODRemittance";
import Auth from "./pages/Auth";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Navigation />
              <Index />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/rto" element={
            <ProtectedRoute>
              <Navigation />
              <RTO />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Navigation />
              <Settings />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Navigation />
              <Products />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute>
              <Navigation />
              <Customers />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/cod-remittance" element={
            <ProtectedRoute>
              <Navigation />
              <CODRemittance />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
