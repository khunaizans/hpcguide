import { useLayoutEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Router, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import GraduateStudiesPage from "./pages/GraduateStudiesPage";
import ClinicalSimulationPage from "./pages/ClinicalSimulationPage";
import Home from "./pages/Home";
import PathwayDetail from "./pages/PathwayDetail";
import LocationDetail from "./pages/LocationDetail";
import AdministrativeTowerPage from "./pages/AdministrativeTowerPage";

import AdminLoginRoute from "./pages/AdminLoginRoute";
import AdminPage from "@/pages/AdminPage";
import AdminRoutesPage from "@/pages/AdminRoutesPage";
import AdminHomePage from "@/pages/AdminHomePage";
import AssistantWidget from "@/components/AssistantWidget";


function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    // Preserve navigation to homepage sections
    if (window.location.hash) return;

    // Start every new page from the top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [location]);

  return null;
}

// Website Routes
function AppRoutes() {
  return (
    <Switch>
      <Route
  path="/locations/postgraduate-studies"
  component={GraduateStudiesPage}
/>
      <Route path="/" component={Home} />

      <Route
        path="/pathways/:slug"
        component={PathwayDetail}
      />

      {/* Administrative Tower */}
      <Route
        path="/locations/administrative-tower"
        component={AdministrativeTowerPage}
      />

{/* Clinical Simulation Center */}
      <Route
      path="/locations/clinical-simulation-center"
      component={ClinicalSimulationPage}
      />

      {/* Other Locations */}
      <Route
        path="/locations/:slug"
        component={LocationDetail}
      />

      {/* Administration */}
      <Route
        path="/admin/login"
        component={AdminLoginRoute}
      />

      <Route
        path="/admin/home"
        component={AdminHomePage}
      />

      <Route
        path="/admin/routes"
        component={AdminRoutesPage}
      />

      <Route
        path="/admin"
        component={AdminPage}
      />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Assistant Widget
function PublicAssistant() {
  const [location] = useLocation();

  return location.startsWith("/admin")
    ? null
    : <AssistantWidget />;
}

// Main Application
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router base="/hpcguide">
            <ScrollToTop />
            <AppRoutes />
            <PublicAssistant />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
