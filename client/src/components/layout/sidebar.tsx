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
  ClipboardList, 
  History,
  Hammer as Toolbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getQueryFn } from "@/lib/queryClient";

// Define an interface for the stats for better type safety
interface DashboardStats {
  pendingRequests?: number;
}

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  // Securely fetch dashboard stats and handle authentication errors gracefully
  const { data: stats } = useQuery<DashboardStats | null>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "returnNull" }), // This prevents crashes on auth errors
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
    <div className="w-64 bg-sidebar-background shadow-lg border-r border-sidebar-border fixed h-full z-30">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-medium text-sidebar-foreground">ToolBooker Pro</h1>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        <div className="mb-4">
          <div className="flex items-center space-x-3 p-3 bg-sidebar-accent rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-gradient-to-br from-green-600 to-blue-600 text-white text-sm">
                {getUserInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
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
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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

        <div className="border-t border-sidebar-border pt-4 mt-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-2.5 px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Settings className="h-5 w-5 mr-3" />
            <span>Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
