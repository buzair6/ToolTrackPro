import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarCheck, Clock, DollarSign, Download, Fuel, Users } from "lucide-react";
import { format } from "date-fns";

export default function History() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("365"); // Default to last year to show all sample data

  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  // Filter for approved and completed bookings based on time range
  const historicalBookings = bookings?.filter((booking: any) => {
    // Show both approved and completed bookings in history
    if (booking.status !== "completed" && booking.status !== "approved") {
      return false;
    }
    
    const bookingDate = new Date(booking.updatedAt);
    const now = new Date();
    
    if (timeRange === "all") return true;

    const daysAgo = parseInt(timeRange);
    const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return bookingDate >= filterDate;
  }) || [];

  // Calculate summary statistics from the filtered bookings
  const totalBookings = historicalBookings.length;
  const totalHours = historicalBookings.reduce((sum: number, booking: any) => sum + booking.duration, 0);
  const totalCosts = historicalBookings.reduce((sum: number, booking: any) => {
    return sum + (parseFloat(booking.cost) || 0);
  }, 0);
  const totalFuelUsed = historicalBookings.reduce((sum: number, booking: any) => {
    return sum + (parseFloat(booking.fuelUsed) || 0);
  }, 0);

  // Calculate user utilization
  const userUtilization = historicalBookings.reduce((acc: any, booking: any) => {
    const userId = booking.user?.id;
    if (!userId) return acc;

    if (!acc[userId]) {
      acc[userId] = { ...booking.user, totalBookings: 0, totalHours: 0 };
    }
    acc[userId].totalBookings += 1;
    acc[userId].totalHours += booking.duration;

    return acc;
  }, {});

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`;
  };

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Your usage report is being generated...",
    });
    // TODO: Implement actual export functionality
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Booking History</h2>
            <p className="text-gray-600 dark:text-gray-400">View completed bookings and usage reports</p>
          </div>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Costs</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalCosts.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Fuel className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fuel Used</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalFuelUsed.toFixed(1)} L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Historical Bookings
            </CardTitle>
            
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {bookingsLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading history...</p>
          ) : historicalBookings.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No historical bookings found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Fuel Used</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalBookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.user?.profileImageUrl} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getUserInitials(booking.user?.firstName, booking.user?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {booking.user?.firstName} {booking.user?.lastName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {booking.tool?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {booking.tool?.toolId}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        {booking.duration} hours
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        {booking.cost ? `$${parseFloat(booking.cost).toFixed(2)}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        {booking.fuelUsed ? `${parseFloat(booking.fuelUsed).toFixed(1)}L` : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(booking.updatedAt), "MMM dd, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Utilization Report */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Utilization</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading utilization data...</p>
          ) : Object.keys(userUtilization).length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No user activity found for this period</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Total Hours</TableHead>
                </TableRow>
              </TableHeader>
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
    </>
  );
}