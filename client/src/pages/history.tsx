import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { CalendarCheck, Clock, DollarSign, Download, Fuel, Users, Wrench, ChevronDown } from "lucide-react";

export default function History() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("365");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  const { uniqueTools, uniqueUsers } = useMemo(() => {
    if (!bookings) return { uniqueTools: [], uniqueUsers: [] };
    const toolMap = new Map();
    const userMap = new Map();
    bookings.forEach(booking => {
      if (booking.tool) toolMap.set(booking.tool.id, booking.tool);
      if (booking.user) userMap.set(booking.user.id, booking.user);
    });
    return { uniqueTools: Array.from(toolMap.values()), uniqueUsers: Array.from(userMap.values()) };
  }, [bookings]);

  const historicalBookings = useMemo(() => {
    return bookings?.filter((booking: any) => {
      // **FIX:** Added a guard to handle cases where a booking's tool or user might be null.
      if (!booking || !booking.tool || !booking.user) {
        return false;
      }

      const isHistorical = booking.status === "completed" || booking.status === "approved";
      if (!isHistorical) return false;

      const matchesTime = (() => {
        if (timeRange === "all") return true;
        const bookingDate = new Date(booking.updatedAt);
        const now = new Date();
        const daysAgo = parseInt(timeRange);
        const filterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return bookingDate >= filterDate;
      })();

      const matchesTool = selectedTools.length === 0 || selectedTools.includes(booking.tool.id.toString());
      const matchesUser = selectedUsers.length === 0 || selectedUsers.includes(booking.user.id);
      
      return matchesTime && matchesTool && matchesUser;
    }) || [];
  }, [bookings, timeRange, selectedTools, selectedUsers]);

  const {
    totalBookings, totalHours, totalCosts, totalFuelUsed, userUtilization, toolAnalytics
  } = useMemo(() => {
    return historicalBookings.reduce((acc, booking) => {
      acc.totalBookings += 1;
      acc.totalHours += booking.duration || 0;
      acc.totalCosts += parseFloat(booking.cost) || 0;
      acc.totalFuelUsed += parseFloat(booking.fuelUsed) || 0;

      if (booking.user) {
        if (!acc.userUtilization[booking.user.id]) acc.userUtilization[booking.user.id] = { ...booking.user, totalBookings: 0, totalHours: 0 };
        acc.userUtilization[booking.user.id].totalBookings += 1;
        acc.userUtilization[booking.user.id].totalHours += booking.duration;
      }
      if (booking.tool) {
        if (!acc.toolAnalytics[booking.tool.id]) acc.toolAnalytics[booking.tool.id] = { ...booking.tool, totalBookings: 0, totalCost: 0, totalFuel: 0 };
        acc.toolAnalytics[booking.tool.id].totalBookings += 1;
        acc.toolAnalytics[booking.tool.id].totalCost += parseFloat(booking.cost) || 0;
        acc.toolAnalytics[booking.tool.id].totalFuel += parseFloat(booking.fuelUsed) || 0;
      }
      return acc;
    }, {
      totalBookings: 0, totalHours: 0, totalCosts: 0, totalFuelUsed: 0,
      userUtilization: {} as any, toolAnalytics: {} as any
    });
  }, [historicalBookings]);

  const userChartData = Object.values(userUtilization).map((u: any) => ({ name: `${u.firstName}`, bookings: u.totalBookings }));
  const toolCostChartData = Object.values(toolAnalytics).map((t: any) => ({ name: t.name, cost: t.totalCost }));
  const toolFuelChartData = Object.values(toolAnalytics).map((t: any) => ({ name: t.name, fuel: t.totalFuel }));

  const handleExportReport = () => toast({ title: "Export Started", description: "Your usage report is being generated..." });

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };
  
  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Booking History & Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">View usage reports and filter by tools, users, and date ranges.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Filter by Tool ({selectedTools.length || 'All'}) <ChevronDown className="h-4 w-4 ml-2" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {uniqueTools.map(tool => (
                  <DropdownMenuCheckboxItem key={tool.id} checked={selectedTools.includes(tool.id.toString())} onCheckedChange={() => toggleSelection(setSelectedTools, tool.id.toString())}>
                    {tool.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Filter by User ({selectedUsers.length || 'All'}) <ChevronDown className="h-4 w-4 ml-2" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Users</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {uniqueUsers.map(user => (
                  <DropdownMenuCheckboxItem key={user.id} checked={selectedUsers.includes(user.id)} onCheckedChange={() => toggleSelection(setSelectedUsers, user.id)}>
                    {user.firstName} {user.lastName}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Time Range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportReport}><Download className="h-4 w-4 mr-2" />Export</Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card><CardContent className="p-6 flex items-center"><div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4"><CalendarCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm font-medium text-muted-foreground">Total Bookings</p><p className="text-2xl font-semibold">{totalBookings}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center"><div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4"><Clock className="h-6 w-6 text-green-600 dark:text-green-400" /></div><div><p className="text-sm font-medium text-muted-foreground">Total Hours</p><p className="text-2xl font-semibold">{totalHours}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center"><div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg mr-4"><DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" /></div><div><p className="text-sm font-medium text-muted-foreground">Total Costs</p><p className="text-2xl font-semibold">${totalCosts.toFixed(2)}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center"><div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg mr-4"><Fuel className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /></div><div><p className="text-sm font-medium text-muted-foreground">Total Fuel Used</p><p className="text-2xl font-semibold">{totalFuelUsed.toFixed(1)} L</p></div></CardContent></Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Cost Per Tool</CardTitle><CardDescription>Total cost incurred for each tool.</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <ResponsiveContainer>
                <BarChart data={toolCostChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<ChartTooltipContent />} cursor={false}/>
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bookings Per User</CardTitle><CardDescription>Total number of bookings made by each user.</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <ResponsiveContainer>
                <BarChart data={userChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} cursor={false}/>
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}