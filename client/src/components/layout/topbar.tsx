import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";

export default function TopBar() {
  const [location] = useLocation();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

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
    const intervalId = setInterval(updateDateTime, 1000); // Update time every second

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Improved breadcrumb logic for nested routes
  const getBreadcrumb = () => {
    const path = location;
    if (path.startsWith("/calendar")) {
      return { parent: "Dashboard", current: "Calendar" };
    }
    if (path.startsWith("/tools")) {
      return { parent: "Dashboard", current: "Tools" };
    }
    if (path.startsWith("/requests")) {
      return { parent: "Dashboard", current: "Requests" };
    }
    if (path.startsWith("/history")) {
      return { parent: "Dashboard", current: "History" };
    }
    if (path === "/") {
      return { parent: "Dashboard", current: "Overview" };
    }
    return { parent: "Dashboard", current: "Page" }; // Fallback
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{breadcrumb.parent}</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {breadcrumb.current}
            </span>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
          
          <ThemeToggle />
          
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-700 dark:text-gray-300">{currentTime}</span>
            <span className="text-gray-500 dark:text-gray-400">{currentDate}</span>
          </div>
        </div>
      </div>
    </header>
  );
}