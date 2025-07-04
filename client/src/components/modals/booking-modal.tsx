import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tool, BookingWithRelations } from "@shared/schema";
import { format } from "date-fns";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedToolId?: number;
  selectedTimeSlot?: string;
  bookingToEdit?: BookingWithRelations | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedDate,
  selectedToolId,
  selectedTimeSlot,
  bookingToEdit,
}: BookingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    toolId: "",
    startDate: "",
    startTime: "09:00",
    duration: "",
    purpose: "",
    cost: "",
    fuelUsed: "",
  });

  const isEditMode = !!bookingToEdit;

  const { data: tools } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  // Reset form state when the modal opens or its initial props change
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && bookingToEdit) {
        setFormData({
          toolId: bookingToEdit.toolId.toString(),
          startDate: format(new Date(bookingToEdit.startDate), "yyyy-MM-dd"),
          startTime: format(new Date(bookingToEdit.startDate), "HH:mm"),
          duration: bookingToEdit.duration.toString(),
          purpose: bookingToEdit.purpose || "",
          cost: bookingToEdit.cost || "",
          fuelUsed: bookingToEdit.fuelUsed || "",
        });
      } else {
        setFormData({
          toolId: selectedToolId?.toString() || "",
          startDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
          startTime: selectedTimeSlot || "09:00",
          duration: "",
          purpose: "",
          cost: "",
          fuelUsed: "",
        });
      }
    }
  }, [isOpen, selectedDate, selectedToolId, selectedTimeSlot, bookingToEdit, isEditMode]);

  const mutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const startDateTime = new Date(
        `${bookingData.startDate}T${bookingData.startTime}`
      );
      const endDateTime = new Date(
        startDateTime.getTime() + bookingData.duration * 60 * 60 * 1000
      );

      const payload: any = {
        toolId: parseInt(bookingData.toolId, 10),
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        duration: parseInt(bookingData.duration, 10),
        purpose: bookingData.purpose,
      };

      if (bookingData.cost) {
        payload.cost = parseFloat(bookingData.cost);
      }
      if (bookingData.fuelUsed) {
        payload.fuelUsed = parseFloat(bookingData.fuelUsed);
      }
      
      const endpoint = isEditMode ? `/api/bookings/${bookingToEdit!.id}` : "/api/bookings";
      const method = isEditMode ? "PUT" : "POST";
      await apiRequest(method, endpoint, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: `Booking ${isEditMode ? 'updated' : 'request submitted'} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      const message = error.message?.includes("already booked")
        ? "Tool is already booked for this time period"
        : `Failed to ${isEditMode ? 'update' : 'submit'} booking`;

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.toolId || !formData.startDate || !formData.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(formData.duration) < 2) {
      toast({
        title: "Error",
        description: "Minimum booking duration is 2 hours",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Booking" : "New Tool Booking"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tool">Select Tool *</Label>
            <Select
              value={formData.toolId}
              onValueChange={(value) => setFormData({ ...formData, toolId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a tool..." />
              </SelectTrigger>
              <SelectContent>
                {tools?.map((tool) => (
                  <SelectItem
                    key={tool.id}
                    value={tool.id.toString()}
                    disabled={tool.status !== "available" && bookingToEdit?.toolId !== tool.id}
                  >
                    <div className="flex justify-between w-full">
                      <span>
                        {tool.name} ({tool.toolId})
                      </span>
                      {tool.status !== "available" && (
                        <span className="text-muted-foreground capitalize ml-2">
                          ({tool.status.replace("-", " ")})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minimum 2 hours) *</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) =>
                setFormData({ ...formData, duration: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose/Notes</Label>
            <Textarea
              id="purpose"
              rows={3}
              placeholder="Describe the intended use..."
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cost">Cost ($) (Optional)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                placeholder="e.g., 10.50"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="fuelUsed">Fuel Used (L) (Optional)</Label>
              <Input
                id="fuelUsed"
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={formData.fuelUsed}
                onChange={(e) =>
                  setFormData({ ...formData, fuelUsed: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : (isEditMode ? "Save Changes" : "Submit Request")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}