import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Tools from "@/pages/tools";
import Requests from "@/pages/requests";
import History from "@/pages/history";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";

/**
 * MainLayout component wraps all authenticated pages, providing the sidebar and top bar.
 */
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a loading screen while the initial user fetch is in progress
  if (isLoading) {
    return <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900" />;
  }

  // Once loading is complete, render the application routes
  return (
    <Switch>
      <Route path="/">
        <MainLayout><Dashboard /></MainLayout>
      </Route>
      <Route path="/calendar">
        <MainLayout><Calendar /></MainLayout>
      </Route>
      <Route path="/tools">
        <MainLayout><Tools /></MainLayout>
      </Route>
      <Route path="/requests">
        <MainLayout><Requests /></MainLayout>
      </Route>
      <Route path="/history">
        <MainLayout><History /></MainLayout>
      </Route>
      {/* Fallback for any other route */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function AppWrapper() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="toolbooker-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <App />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
