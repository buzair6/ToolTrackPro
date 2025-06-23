import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingModal from "@/components/modals/booking-modal";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay } from "date-fns";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { BookingWithRelations, Tool } from "@shared/schema";

export default function BookingCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedTool, setSelectedTool] = useState<string>();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>();

  const { data: tools } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  useEffect(() => {
    if (tools && tools.length > 0 && !selectedTool) {
      setSelectedTool(tools[0].id.toString());
    }
  }, [tools, selectedTool]);

  const getDateRange = () => {
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return { start: weekStart, end: weekEnd };
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const calendarStart = new Date(monthStart);
      calendarStart.setDate(calendarStart.getDate() - getDay(monthStart));
      
      const calendarEnd = new Date(monthEnd);
      calendarEnd.setDate(calendarEnd.getDate() + (6 - getDay(monthEnd)));
      
      return { start: calendarStart, end: calendarEnd };
    }
  };

  const { start: calendarStart, end: calendarEnd } = getDateRange();

  const { data: bookings } = useQuery<BookingWithRelations[]>({
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

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const filteredBookings = useMemo(() => {
    if (!bookings || !selectedTool) return [];
    
    return bookings.filter((booking: BookingWithRelations) => {
      return booking.tool?.id?.toString() === selectedTool;
    });
  }, [bookings, selectedTool]);

  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter((booking: BookingWithRelations) => {
      const bookingStart = startOfDay(new Date(booking.startDate));
      const bookingEnd = startOfDay(new Date(booking.endDate));
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

  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    };
  });

  const getBookingsForTimeSlot = (day: Date, timeSlot: string) => {
    const [hour] = timeSlot.split(':').map(Number);
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return filteredBookings.filter((booking: BookingWithRelations) => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return (bookingStart < slotEnd && bookingEnd > slotStart);
    });
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`;
  };

  const handleDayClick = (day: Date, timeSlot?: string) => {
    if (viewMode === "month" && !isCurrentMonth(day)) return;
    setSelectedDate(day);
    setSelectedTimeSlot(timeSlot);
    setShowBookingModal(true);
  };

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentDate.getMonth();
  };

  const renderMonthView = () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day: string) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {calendarDays.map((day: Date, index: number) => {
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
                {dayBookings.slice(0, 3).map((booking: BookingWithRelations) => (
                   <HoverCard key={booking.id}>
                    <HoverCardTrigger asChild>
                      <div className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(booking.status)}`}>
                        {getUserInitials(booking.user?.firstName, booking.user?.lastName)} - {booking.duration}h
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="font-bold">{booking.tool.name}</p>
                      <p>Booked by: {booking.user.firstName} {booking.user.lastName}</p>
                      <p>Purpose: {booking.purpose || 'N/A'}</p>
                      <p>Status: <span className="capitalize">{booking.status}</span></p>
                    </HoverCardContent>
                  </HoverCard>
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
  );

  const renderWeekView = () => {
    const weekDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-800">
          <div className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
            Time
          </div>
          {weekDays.map((day: Date) => (
            <div key={day.toISOString()} className="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format(day, "EEE")}
              </div>
              <div className={`text-lg font-semibold ${
                isToday(day) ? "text-primary" : "text-gray-900 dark:text-white"
              }`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        
        {timeSlots.map((slot: { time: string; label: string }) => (
          <div key={slot.time} className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="p-3 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {slot.label}
            </div>
            {weekDays.map((day: Date) => {
              const slotBookings = getBookingsForTimeSlot(day, slot.time);
              
              return (
                <div
                  key={`${day.toISOString()}-${slot.time}`}
                  className="p-2 min-h-16 border-r border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => slotBookings.length === 0 && handleDayClick(day, slot.time)}
                >
                  {slotBookings.map((booking: BookingWithRelations) => (
                     <HoverCard key={booking.id}>
                        <HoverCardTrigger asChild>
                          <div className={`text-xs px-2 py-1 rounded mb-1 truncate ${getStatusColor(booking.status)}`}>
                            {getUserInitials(booking.user?.firstName, booking.user?.lastName)} - {booking.duration}h
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <p className="font-bold">{booking.tool.name}</p>
                          <p>Booked by: {booking.user.firstName} {booking.user.lastName}</p>
                           <p>Duration: {booking.duration} hours</p>
                           <p>Purpose: {booking.purpose || 'N/A'}</p>
                           <p>Status: <span className="capitalize">{booking.status}</span></p>
                        </HoverCardContent>
                      </HoverCard>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
              {viewMode === "week" 
                ? `Week of ${format(calendarStart, "MMM dd,HDROff")}`
                : format(currentDate, "MMMM Yfine")
              }
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="month" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Month</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Week</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select value={selectedTool || ''} onValueChange={setSelectedTool}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a tool..." />
              </SelectTrigger>
              <SelectContent>
                {tools?.map((tool: Tool) => (
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
        {viewMode === "month" ? renderMonthView() : renderWeekView()}

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
          {viewMode === "week" && (
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              Working hours: 8:00 AM - 7:00 PM
            </div>
          )}
        </div>
      </CardContent>

      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDate(undefined);
            setSelectedTimeSlot(undefined);
          }}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
          selectedToolId={selectedTool ? parseInt(selectedTool, 10) : undefined}
        />
      )}
    </Card>
  );
}