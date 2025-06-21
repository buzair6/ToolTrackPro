import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardStats {
  pendingRequests?: number;
}

export default function TopBar() {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const { data: stats } = useQuery<DashboardStats | null>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }));
      setCurrentDate(now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }));
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const getBreadcrumb = () => {
    const path = location;
    if (path.startsWith("/calendar")) return { parent: "Dashboard", current: "Calendar" };
    if (path.startsWith("/tools")) return { parent: "Dashboard", current: "Tools" };
    if (path.startsWith("/requests")) return { parent: "Dashboard", current: "Requests" };
    if (path.startsWith("/history")) return { parent: "Dashboard", current: "History" };
    if (path.startsWith("/settings")) return { parent: "Dashboard", current: "Settings" };
    if (path === "/") return { parent: "Dashboard", current: "Overview" };
    return { parent: "Dashboard", current: "Page" };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <nav className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{breadcrumb.parent}</span>
            <span>/</span>
            <span className="text-foreground font-medium">
              {breadcrumb.current}
            </span>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {stats && stats.pendingRequests != null && stats.pendingRequests > 0 && (
               <span className="absolute top-0 right-0 flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
               </span>
            )}
          </Button>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}