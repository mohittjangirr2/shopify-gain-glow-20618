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
import NDR from "./pages/NDR";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import DeliveredOrders from "./pages/DeliveredOrders";
import VendorPayments from "./pages/VendorPayments";
import NotificationSettings from "./pages/NotificationSettings";
import PerformanceDoc from "./pages/PerformanceDoc";
import Home from "./pages/Home";
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
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={
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
          <Route path="/ndr" element={
            <ProtectedRoute>
              <Navigation />
              <NDR />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/vendor-payments" element={
            <ProtectedRoute>
              <Navigation />
              <VendorPayments />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/delivered" element={
            <ProtectedRoute>
              <Navigation />
              <DeliveredOrders />
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
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Navigation />
              <NotificationSettings />
              <Footer />
            </ProtectedRoute>
          } />
          <Route path="/performance" element={
            <ProtectedRoute>
              <Navigation />
              <PerformanceDoc />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
