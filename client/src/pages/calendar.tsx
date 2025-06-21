import BookingCalendar from "@/components/calendar/booking-calendar";

export default function Calendar() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Booking Calendar</h2>
        <p className="text-gray-600 dark:text-gray-400">View tool availability and existing bookings</p>
      </div>

      <BookingCalendar />
    </>
  );
}
