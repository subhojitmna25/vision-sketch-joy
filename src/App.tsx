import LandingPage from "./pages/LandingPage";
import FloatingChat from "./components/FloatingChat";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ClientsPage from "./pages/dashboard/ClientsPage";
import InvoicesPage from "./pages/dashboard/InvoicesPage";
import ExpensesPage from "./pages/dashboard/ExpensesPage";
import AIAssistantPage from "./pages/dashboard/AIAssistantPage";
import ToolsPage from "./pages/dashboard/ToolsPage";
import CompliancePage from "./pages/dashboard/CompliancePage";
import AdminPage from "./pages/dashboard/AdminPage";
import LBOAnalysisPage from "./pages/dashboard/LBOAnalysisPage";
import InvestmentAnalysisPage from "./pages/dashboard/InvestmentAnalysisPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<ErrorBoundary fallbackTitle="Landing page error"><LandingPage /></ErrorBoundary>} />
            <Route path="/auth" element={<ErrorBoundary fallbackTitle="Authentication error"><AuthPage /></ErrorBoundary>} />
            <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary fallbackTitle="Dashboard error"><DashboardLayout /></ErrorBoundary></ProtectedRoute>}>
              <Route index element={<ErrorBoundary><DashboardOverview /></ErrorBoundary>} />
              <Route path="clients" element={<ErrorBoundary><ClientsPage /></ErrorBoundary>} />
              <Route path="invoices" element={<ErrorBoundary><InvoicesPage /></ErrorBoundary>} />
              <Route path="expenses" element={<ErrorBoundary><ExpensesPage /></ErrorBoundary>} />
              <Route path="ai" element={<ErrorBoundary><AIAssistantPage /></ErrorBoundary>} />
              <Route path="compliance" element={<ErrorBoundary><CompliancePage /></ErrorBoundary>} />
              <Route path="tools" element={<ErrorBoundary><ToolsPage /></ErrorBoundary>} />
              <Route path="tools/lbo" element={<ErrorBoundary><LBOAnalysisPage /></ErrorBoundary>} />
              <Route path="tools/investment" element={<ErrorBoundary><InvestmentAnalysisPage /></ErrorBoundary>} />
              <Route path="admin" element={<ErrorBoundary><AdminPage /></ErrorBoundary>} />
              <Route path="/tools/bank-analyzer" element={<BankAnalyzer />} />
              <Route path="/tools/lbo" element={<LBOAnalyzer />} />
              <Route path="/tools/investment" element={<InvestmentAnalyzer />} />
              <Route path="/tools/calculators" element={<FinancialCalculators />} />
             <Route path="/tools/tax-optimizer" element={<TaxOptimizer />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingChat />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
