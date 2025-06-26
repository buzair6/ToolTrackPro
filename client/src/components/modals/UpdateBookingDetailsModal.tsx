import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingWithRelations } from "@shared/schema";

interface UpdateBookingDetailsModalProps {
  booking: BookingWithRelations;
  onClose: () => void;
}

export default function UpdateBookingDetailsModal({ booking, onClose }: UpdateBookingDetailsModalProps) {
  const { toast } = useToast();
  const [cost, setCost] = useState(booking.cost || "");
  const [fuelUsed, setFuelUsed] = useState(booking.fuelUsed || "");

  const mutation = useMutation({
    mutationFn: async (details: { cost?: string; fuelUsed?: string }) => {
      const updateData: { cost?: number; fuelUsed?: number } = {};
      if (details.cost) updateData.cost = parseFloat(details.cost);
      if (details.fuelUsed) updateData.fuelUsed = parseFloat(details.fuelUsed);

      await apiRequest("PUT", `/api/bookings/${booking.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Success",
        description: "Booking details updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update booking: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ cost, fuelUsed });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Booking Details</DialogTitle>
          <DialogDescription>
            Add cost and fuel usage for the booking of "{booking.tool?.name}" by {booking.user?.firstName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="cost">Total Cost ($)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="e.g., 25.50"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fuelUsed">Fuel Used (Liters)</Label>
            <Input
              id="fuelUsed"
              type="number"
              step="0.1"
              placeholder="e.g., 5.5"
              value={fuelUsed}
              onChange={(e) => setFuelUsed(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}