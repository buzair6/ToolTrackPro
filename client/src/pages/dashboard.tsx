import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle, Clock, CalendarX, Plus, ClipboardCheck, Calendar, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  const recentRequests = recentBookings?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Dashboard Overview</h2>
            <p className="text-gray-600 dark:text-gray-400">Monitor tool bookings and system activity</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Wrench className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tools</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {statsLoading ? "..." : stats?.totalTools || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Tools</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {statsLoading ? "..." : stats?.availableTools || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Requests</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {statsLoading ? "..." : stats?.pendingRequests || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <CalendarX className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Bookings</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {statsLoading ? "..." : stats?.activeBookings || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Recent Requests</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/requests")}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingsLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                  ) : recentRequests.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent requests</p>
                  ) : (
                    recentRequests.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {request.user?.firstName?.[0] || 'U'}{request.user?.lastName?.[0] || ''}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.user?.firstName} {request.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {request.tool?.name} - {request.duration} hours
                            </p>
                          </div>
                        </div>
                        <Badge className={`status-${request.status}`}>
                          {request.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user?.role === "admin" && (
                    <Button 
                      className="w-full justify-between bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => setLocation("/tools")}
                    >
                      <div className="flex items-center space-x-3">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Add New Tool</span>
                      </div>
                    </Button>
                  )}

                  {user?.role === "admin" && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      onClick={() => setLocation("/requests")}
                    >
                      <div className="flex items-center space-x-3">
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="font-medium">Review Pending Requests</span>
                      </div>
                      {stats?.pendingRequests > 0 && (
                        <Badge variant="destructive">{stats.pendingRequests}</Badge>
                      )}
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => setLocation("/calendar")}
                  >
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">View Booking Calendar</span>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => setLocation("/history")}
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-4 w-4" />
                      <span className="font-medium">Generate Usage Report</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
