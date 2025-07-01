import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { format } from "date-fns";
  import type { BookingWithRelations } from "@shared/schema";
  
  interface ViewBookingModalProps {
    booking: BookingWithRelations;
    onClose: () => void;
  }
  
  export default function ViewBookingModal({
    booking,
    onClose,
  }: ViewBookingModalProps) {
    if (!booking) return null;
  
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
  
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking for {booking.tool?.name}</DialogTitle>
            <DialogDescription>
              Requested by {booking.user?.firstName} {booking.user?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge className={getStatusBadgeClass(booking.status)}>
                {booking.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">
                {format(new Date(booking.startDate), "MMM dd, yyyy, HH:mm")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">
                {format(new Date(booking.endDate), "MMM dd, yyyy, HH:mm")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{booking.duration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium">${booking.cost || "0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Used:</span>
              <span className="font-medium">{booking.fuelUsed || "0.0"} L</span>
            </div>
            <div>
              <span className="text-muted-foreground">Purpose/Notes:</span>
              <p className="font-medium mt-1">
                {booking.purpose || "No purpose provided."}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }