import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CalendarCheck, Clock, DollarSign, Download, Fuel, Users, Wrench } from "lucide-react";
import { format } from "date-fns";

export default function History() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("365");

  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  const historicalBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((booking: any) => {
      if (booking.status !== "completed" && booking.status !== "approved") {
        return false;
      }
      const bookingDate = new Date(booking.updatedAt);
      const now = new Date();
      if (timeRange === "all") return true;
      const daysAgo = parseInt(timeRange);
      const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return bookingDate >= filterDate;
    });
  }, [bookings, timeRange]);

  const {
    totalBookings,
    totalHours,
    totalCosts,
    totalFuelUsed,
    userUtilization,
    toolAnalytics
  } = useMemo(() => {
    if (!historicalBookings) {
      return { totalBookings: 0, totalHours: 0, totalCosts: 0, totalFuelUsed: 0, userUtilization: {}, toolAnalytics: {} };
    }

    const stats = historicalBookings.reduce((acc, booking) => {
      acc.totalBookings += 1;
      acc.totalHours += booking.duration || 0;
      acc.totalCosts += parseFloat(booking.cost) || 0;
      acc.totalFuelUsed += parseFloat(booking.fuelUsed) || 0;

      // User Utilization
      if (booking.user) {
        if (!acc.userUtilization[booking.user.id]) {
          acc.userUtilization[booking.user.id] = { ...booking.user, totalBookings: 0, totalHours: 0 };
        }
        acc.userUtilization[booking.user.id].totalBookings += 1;
        acc.userUtilization[booking.user.id].totalHours += booking.duration;
      }

      // Tool Analytics
      if (booking.tool) {
        if (!acc.toolAnalytics[booking.tool.id]) {
          acc.toolAnalytics[booking.tool.id] = { ...booking.tool, totalBookings: 0, totalCost: 0, totalFuel: 0 };
        }
        acc.toolAnalytics[booking.tool.id].totalBookings += 1;
        acc.toolAnalytics[booking.tool.id].totalCost += parseFloat(booking.cost) || 0;
        acc.toolAnalytics[booking.tool.id].totalFuel += parseFloat(booking.fuelUsed) || 0;
      }

      return acc;
    }, {
      totalBookings: 0,
      totalHours: 0,
      totalCosts: 0,
      totalFuelUsed: 0,
      userUtilization: {} as any,
      toolAnalytics: {} as any
    });

    return stats;
  }, [historicalBookings]);

  const userChartData = Object.values(userUtilization).map((user: any) => ({
    name: `${user.firstName} ${user.lastName}`,
    bookings: user.totalBookings,
  }));

  const toolCostChartData = Object.values(toolAnalytics).map((tool: any) => ({
    name: tool.name,
    cost: tool.totalCost,
  }));

  const toolFuelChartData = Object.values(toolAnalytics).map((tool: any) => ({
    name: tool.name,
    fuel: tool.totalFuel,
  }));

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`;
  };

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Your usage report is being generated...",
    });
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Booking History & Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">View completed bookings and usage reports</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Cards for Total Bookings, Hours, Costs, Fuel */}
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
              <CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalBookings}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalHours}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Costs</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">${totalCosts.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg mr-4">
              <Fuel className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fuel Used</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalFuelUsed.toFixed(1)} L</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Per Tool</CardTitle>
            <CardDescription>Total cost incurred for each tool.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <ResponsiveContainer>
                <BarChart data={toolCostChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fuel Usage Per Tool</CardTitle>
            <CardDescription>Total fuel consumed by each tool.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <ResponsiveContainer>
                <BarChart data={toolFuelChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}L`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="fuel" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tool and User Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Wrench className="h-5 w-5 mr-2" />Tool Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? <p>Loading...</p> : Object.keys(toolAnalytics).length === 0 ? <p>No tool usage data.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Bookings</TableHead><TableHead>Total Cost</TableHead><TableHead>Total Fuel</TableHead></TableRow></TableHeader>
                <TableBody>
                  {Object.values(toolAnalytics).map((tool: any) => (
                    <TableRow key={tool.id}>
                      <TableCell>{tool.name}</TableCell>
                      <TableCell>{tool.totalBookings}</TableCell>
                      <TableCell>${tool.totalCost.toFixed(2)}</TableCell>
                      <TableCell>{tool.totalFuel.toFixed(1)} L</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="h-5 w-5 mr-2" />User Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? <p>Loading...</p> : Object.keys(userUtilization).length === 0 ? <p>No user activity data.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Total Bookings</TableHead><TableHead>Total Hours</TableHead></TableRow></TableHeader>
                <TableBody>
                  {Object.values(userUtilization).map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.totalBookings}</TableCell>
                      <TableCell>{user.totalHours} hours</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}