import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { getQueryFn } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Wrench, CheckCircle, Clock, CalendarX, Plus, ClipboardCheck, Calendar, BarChart3, TrendingUp, ShieldCheck, PieChart, AreaChart } from "lucide-react";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const recentRequests = recentBookings?.slice(0, 3) || [];

  const bookingStatusData = [
    { name: 'Pending', value: stats?.pendingRequests || 0 },
    { name: 'Active', value: stats?.activeBookings || 0 },
  ];
  
  const COLORS = ['#FF8042', '#0088FE'];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Monitor tool bookings and system activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Availability</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : `${stats?.toolAvailability || 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Utilization</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {statsLoading ? "..." : `${stats?.toolUtilization || 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Requests */}
        <Card className="lg:col-span-2">
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
                  className="w-full justify-start gap-3"
                  onClick={() => setLocation("/tools")}
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add New Tool</span>
                </Button>
              )}

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => setLocation("/requests")}
              >
                <div className="flex items-center space-x-3">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="font-medium">Review Requests</span>
                </div>
                {stats?.pendingRequests > 0 && (
                  <Badge variant="destructive">{stats.pendingRequests}</Badge>
                )}
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={() => setLocation("/calendar")}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Booking Calendar</span>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start gap-3"
                onClick={() => setLocation("/history")}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Usage Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* New Graphs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Analytics</CardTitle>
          <CardDescription>
            Here are some additional graphs for deeper insights into your operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bookingStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Peak Usage Hours</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-center text-gray-500 py-16">Peak usage graph coming soon!</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </>
  );
}
