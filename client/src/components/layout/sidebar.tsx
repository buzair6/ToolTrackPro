import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Wrench,
  Home,
  Calendar,
  Settings,
  ClipboardList,
  History,
  LogOut,
  Hammer as Toolbox,
} from "lucide-react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface DashboardStats {
  pendingRequests?: number;
}

export default function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats } = useQuery<DashboardStats | null>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`;
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/", roles: ["admin", "user"] },
    { id: "calendar", label: "Booking Calendar", icon: Calendar, path: "/calendar", roles: ["admin", "user"] },
    { id: "tools", label: "Tools Management", icon: Toolbox, path: "/tools", roles: ["admin", "user"] },
    { id: "requests", label: "Booking Requests", icon: ClipboardList, path: "/requests", badge: stats?.pendingRequests, roles: ["admin", "user"] },
    { id: "history", label: "Booking History", icon: History, path: "/history", roles: ["admin", "user"] },
  ];

  const bottomMenuItems = [
    { id: "settings", label: "Settings", icon: Settings, path: "/settings", action: () => setLocation('/settings') },
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center space-x-3 p-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-medium text-sidebar-foreground">ToolBooker Pro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center space-x-3 p-2">
              <Avatar className="h-9 w-9">
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
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={isActive(item.path)}
                onClick={() => setLocation(item.path)}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {bottomMenuItems.map(item => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton onClick={item.action} tooltip={item.label}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              tooltip="Sign Out"
            >
              <LogOut />
              <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
