import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import BookingCalendar from "@/components/calendar/booking-calendar";

export default function Calendar() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Booking Calendar</h2>
            <p className="text-gray-600 dark:text-gray-400">View tool availability and existing bookings</p>
          </div>

          <BookingCalendar />
        </div>
      </div>
    </div>
  );
}
