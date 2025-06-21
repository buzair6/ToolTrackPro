import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarCheck, Clock, DollarSign, Download } from "lucide-react";
import { format } from "date-fns";

export default function History() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("30");

  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  // Filter completed bookings based on time range
  const completedBookings = bookings?.filter((booking: any) => {
    if (booking.status !== "completed") return false;
    
    const completedDate = new Date(booking.updatedAt);
    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return completedDate >= filterDate;
  }) || [];

  // Calculate summary statistics
  const totalBookings = completedBookings.length;
  const totalHours = completedBookings.reduce((sum: number, booking: any) => sum + booking.duration, 0);
  const totalCosts = completedBookings.reduce((sum: number, booking: any) => {
    return sum + (parseFloat(booking.cost) || 0);
  }, 0);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Completed Bookings
            </CardTitle>
            
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {bookingsLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading history...</p>
          ) : completedBookings.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No completed bookings found</p>
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
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedBookings.map((booking: any) => (
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
    </>
  );
}
