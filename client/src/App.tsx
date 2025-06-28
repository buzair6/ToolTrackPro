// <reference types="wouter/switch" />

import { Route, Redirect, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/error-boundary";

// Import page components
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Tools from "@/pages/tools";
import Requests from "@/pages/requests";
import History from "@/pages/history";
import SettingsPage from "@/pages/settings";
import Auth from "@/pages/auth";
import ChecklistTemplates from "@/pages/checklist-templates";
import InspectTool from "@/pages/inspect-tool";
import AiInsightPage from "@/pages/ai-insight";


// Import layout components
import AppSidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Auth} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/tools" component={Tools} />
        <Route path="/requests" component={Requests} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/checklist-templates" component={ChecklistTemplates} />
        <Route path="/inspect-tool" component={InspectTool} />
        <Route path="/ai-insight" component={AiInsightPage} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default function AppWrapper() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="toolbooker-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}