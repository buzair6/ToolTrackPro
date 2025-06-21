import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import BookingModal from "@/components/modals/booking-modal";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns";

export default function BookingCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTool, setSelectedTool] = useState("all");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Get calendar date range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Extend to show full weeks
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - getDay(monthStart));
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - getDay(monthEnd)));

  const { data: tools } = useQuery({
    queryKey: ["/api/tools"],
    retry: false,
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings/calendar", format(calendarStart, "yyyy-MM-dd"), format(calendarEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const response = await fetch(
        `/api/bookings/calendar?start=${calendarStart.toISOString()}&end=${calendarEnd.toISOString()}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    retry: false,
  });

  // Generate calendar days
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Filter bookings for selected tool
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    return bookings.filter((booking: any) => {
      if (selectedTool === "all") return true;
      return booking.tool?.id?.toString() === selectedTool;
    });
  }, [bookings, selectedTool]);

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter((booking: any) => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      return day >= bookingStart && day <= bookingEnd;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-orange-500 text-white";
      case "denied":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentMonth.getMonth();
  };

  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };

  const handleDayClick = (day: Date) => {
    if (!isCurrentMonth(day)) return;
    setSelectedDate(day);
    setShowBookingModal(true);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedTool} onValueChange={setSelectedTool}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Tools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tools</SelectItem>
                {tools?.map((tool: any) => (
                  <SelectItem key={tool.id} value={tool.id.toString()}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={() => setShowBookingModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayBookings = getBookingsForDay(day);
              const isCurrentMonthDay = isCurrentMonth(day);
              const isTodayDay = isToday(day);
              
              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !isCurrentMonthDay ? "bg-gray-50 dark:bg-gray-900" : ""
                  } ${isTodayDay ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className={`text-sm ${
                    !isCurrentMonthDay 
                      ? "text-gray-400 dark:text-gray-600" 
                      : isTodayDay
                      ? "text-primary font-medium"
                      : "text-gray-900 dark:text-white"
                  }`}>
                    {format(day, "d")}
                  </span>
                  
                  {isTodayDay && (
                    <div className="mt-1">
                      <Badge className="text-xs bg-primary text-primary-foreground">
                        Today
                      </Badge>
                    </div>
                  )}
                  
                  <div className="mt-1 space-y-1">
                    {dayBookings.slice(0, 3).map((booking: any) => (
                      <div
                        key={booking.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(booking.status)}`}
                        title={`${booking.tool?.name} - ${booking.user?.firstName} ${booking.user?.lastName} (${booking.status})`}
                      >
                        {selectedTool === "all" 
                          ? `${booking.tool?.name?.split(' ')[0] || 'Tool'} - ${booking.duration}h`
                          : `${booking.duration}h - ${booking.user?.firstName || 'User'}`
                        }
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Denied</span>
          </div>
        </div>
      </CardContent>

      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDate(undefined);
          }}
          selectedDate={selectedDate}
        />
      )}
    </Card>
  );
}
