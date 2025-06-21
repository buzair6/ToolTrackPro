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
import Auth from "@/pages/auth";

// Import layout components
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
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

  // If the user is not authenticated, show the auth page.
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Auth} />
        {/* Redirect any other path to the auth page if not authenticated */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  // If authenticated, show the main application layout and routes.
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/tools" component={Tools} />
        <Route path="/requests" component={Requests} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

export default function AppWrapper() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="toolbooker-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          {/* Wrap the main App component with the ErrorBoundary */}
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}