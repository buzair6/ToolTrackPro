import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Eye, DollarSign, Edit3, Trash2 } from "lucide-react";
import { format } from "date-fns";
import UpdateBookingDetailsModal from "@/components/modals/UpdateBookingDetailsModal";
import BookingModal from "@/components/modals/booking-modal";
import ViewBookingModal from "@/components/modals/ViewBookingModal";
import type { BookingWithRelations } from "@shared/schema";

export default function Requests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [bookingToUpdateDetails, setBookingToUpdateDetails] =
    useState<any | null>(null);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [viewingBooking, setViewingBooking] = useState<any | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  const { data: tools } = useQuery<any[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  const uniqueUsers = useMemo(() => {
    if (!bookings) return [];
    const usersMap = new Map();
    bookings.forEach((booking) => {
      if (booking.user) {
        usersMap.set(booking.user.id, booking.user);
      }
    });
    return Array.from(usersMap.values());
  }, [bookings]);

  const approveBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("PUT", `/api/bookings/${bookingId}`, {
        status: "approved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Booking approved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve booking",
        variant: "destructive",
      });
    },
  });

  const denyBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("PUT", `/api/bookings/${bookingId}`, {
        status: "denied",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Booking denied",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to deny booking",
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId: number) =>
      apiRequest("DELETE", `/api/bookings/${bookingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Booking deleted successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are not authorized to perform this action.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete booking.",
        variant: "destructive",
      });
    },
  });

  const filteredBookings =
    bookings?.filter((booking: any) => {
      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;
      const matchesTool =
        toolFilter === "all" || booking.tool?.id.toString() === toolFilter;
      const matchesUser =
        userFilter === "all" || booking.user?.id.toString() === userFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const bookingDate = new Date(booking.startDate);
        const now = new Date();

        switch (dateFilter) {
          case "today":
            matchesDate = bookingDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = bookingDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = bookingDate >= monthAgo;
            break;
        }
      }

      return matchesStatus && matchesDate && matchesTool && matchesUser;
    }) || [];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "denied":
        return "status-denied";
      case "completed":
        return "status-completed";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || "U"}${lastName?.[0] || ""}`;
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">
          Booking Requests
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage tool booking requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={toolFilter} onValueChange={setToolFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Tools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tools</SelectItem>
                  {tools?.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id.toString()}>
                      {tool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredBookings.length} total requests
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {bookingsLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Loading requests...
            </p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No requests found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requester</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.user?.profileImageUrl} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getUserInitials(
                                booking.user?.firstName,
                                booking.user?.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {booking.user?.firstName} {booking.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {booking.user?.email}
                            </div>
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
                      <TableCell>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {format(new Date(booking.startDate), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(booking.startDate), "HH:mm")} -{" "}
                          {format(new Date(booking.endDate), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        {booking.duration} hours
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user?.role === "admin" &&
                            booking.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() =>
                                    approveBookingMutation.mutate(booking.id)
                                  }
                                  disabled={approveBookingMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    denyBookingMutation.mutate(booking.id)
                                  }
                                  disabled={denyBookingMutation.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          {user?.role === "admin" &&
                            (booking.status === "approved" ||
                              booking.status === "completed") && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() =>
                                    setBookingToUpdateDetails(booking)
                                  }
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                  onClick={() => setEditingBooking(booking)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Are you sure you want to delete this booking?"
                                      )
                                    ) {
                                      deleteBookingMutation.mutate(booking.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            onClick={() => setViewingBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {bookingToUpdateDetails && (
        <UpdateBookingDetailsModal
          booking={bookingToUpdateDetails}
          onClose={() => setBookingToUpdateDetails(null)}
        />
      )}
      {editingBooking && (
        <BookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          bookingToEdit={editingBooking}
        />
      )}
      {viewingBooking && (
        <ViewBookingModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
        />
      )}
    </>
  );
}