import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Wrench, 
  Home, 
  Calendar, 
  Settings, 
  LogOut, 
  ClipboardList, 
  History,
  Hammer as Toolbox
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`;
  };

  const menuItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: Home, 
      path: "/",
      roles: ["admin", "user"]
    },
    { 
      id: "calendar", 
      label: "Booking Calendar", 
      icon: Calendar, 
      path: "/calendar",
      roles: ["admin", "user"]
    },
    { 
      id: "tools", 
      label: "Tools Management", 
      icon: Toolbox, 
      path: "/tools",
      roles: ["admin", "user"]
    },
    { 
      id: "requests", 
      label: "Booking Requests", 
      icon: ClipboardList, 
      path: "/requests",
      badge: stats?.pendingRequests,
      roles: ["admin", "user"]
    },
    { 
      id: "history", 
      label: "Booking History", 
      icon: History, 
      path: "/history",
      roles: ["admin", "user"]
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "user")
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 fixed h-full z-30">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-medium text-gray-900 dark:text-white">ToolBooker</h1>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        <div className="mb-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getUserInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role === "admin" ? "Administrator" : "User"}
              </p>
            </div>
          </div>
        </div>

        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto py-2.5 px-3",
                active 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              onClick={() => setLocation(item.path)}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-2.5 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Settings className="h-5 w-5 mr-3" />
            <span>Settings</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-2.5 px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => window.location.href = "/api/logout"}
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
