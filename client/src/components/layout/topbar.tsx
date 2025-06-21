import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Bell } from "lucide-react";

export default function TopBar() {
  const [location] = useLocation();

  const getBreadcrumb = () => {
    switch (location) {
      case "/":
        return { parent: "Dashboard", current: "Overview" };
      case "/calendar":
        return { parent: "Dashboard", current: "Calendar" };
      case "/tools":
        return { parent: "Dashboard", current: "Tools" };
      case "/requests":
        return { parent: "Dashboard", current: "Requests" };
      case "/history":
        return { parent: "Dashboard", current: "History" };
      default:
        return { parent: "Dashboard", current: "Overview" };
    }
  };

  const breadcrumb = getBreadcrumb();
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
