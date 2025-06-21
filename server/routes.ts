import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertToolSchema, insertBookingSchema, updateBookingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Tool routes
  app.get("/api/tools", isAuthenticated, async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.get("/api/tools/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tool = await storage.getToolById(id);
      if (!tool) {
        return res.status(404).json({ message: "Tool not found" });
      }
      res.json(tool);
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({ message: "Failed to fetch tool" });
    }
  });

  app.post("/api/tools", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const toolData = insertToolSchema.parse(req.body);
      
      // Check if tool ID already exists
      const existingTool = await storage.getToolByToolId(toolData.toolId);
      if (existingTool) {
        return res.status(400).json({ message: "Tool ID already exists" });
      }

      const tool = await storage.createTool(toolData);
      res.status(201).json(tool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tool data", errors: error.errors });
      }
      console.error("Error creating tool:", error);
      res.status(500).json({ message: "Failed to create tool" });
    }
  });

  app.put("/api/tools/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const toolData = insertToolSchema.partial().parse(req.body);
      
      // Check if tool exists
      const existingTool = await storage.getToolById(id);
      if (!existingTool) {
        return res.status(404).json({ message: "Tool not found" });
      }

      // Check if new tool ID conflicts (if being updated)
      if (toolData.toolId && toolData.toolId !== existingTool.toolId) {
        const conflictingTool = await storage.getToolByToolId(toolData.toolId);
        if (conflictingTool) {
          return res.status(400).json({ message: "Tool ID already exists" });
        }
      }

      const tool = await storage.updateTool(id, toolData);
      res.json(tool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tool data", errors: error.errors });
      }
      console.error("Error updating tool:", error);
      res.status(500).json({ message: "Failed to update tool" });
    }
  });

  app.delete("/api/tools/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteTool(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tool:", error);
      res.status(500).json({ message: "Failed to delete tool" });
    }
  });

  // Booking routes
  app.get("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      let bookings;
      if (user?.role === "admin") {
        bookings = await storage.getAllBookings();
      } else {
        bookings = await storage.getBookingsByUserId(req.user.claims.sub);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/pending", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookings = await storage.getPendingBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      res.status(500).json({ message: "Failed to fetch pending bookings" });
    }
  });

  app.get("/api/bookings/calendar", isAuthenticated, async (req, res) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      const bookings = await storage.getBookingsByDateRange(startDate, endDate);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching calendar bookings:", error);
      res.status(500).json({ message: "Failed to fetch calendar bookings" });
    }
  });

  app.post("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });

      // Check for conflicts
      const hasConflict = await storage.checkBookingConflict(
        bookingData.toolId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (hasConflict) {
        return res.status(409).json({ message: "Tool is already booked for this time period" });
      }

      // Check if tool exists and is available
      const tool = await storage.getToolById(bookingData.toolId);
      if (!tool) {
        return res.status(404).json({ message: "Tool not found" });
      }

      if (tool.status !== "available") {
        return res.status(400).json({ message: "Tool is not available for booking" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user.claims.sub);
      const booking = await storage.getBookingById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check permissions
      if (user?.role !== "admin" && booking.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = updateBookingSchema.parse(req.body);

      // If admin is approving/denying
      if (user?.role === "admin" && updateData.status) {
        if (updateData.status === "approved") {
          updateData.approvedBy = req.user.claims.sub;
          updateData.approvedAt = new Date();

          // Update tool status if approved
          await storage.updateTool(booking.toolId, { status: "in-use" });
        }
      }

      // Check for conflicts if dates are being updated
      if (updateData.startDate || updateData.endDate || updateData.toolId) {
        const startDate = updateData.startDate || booking.startDate;
        const endDate = updateData.endDate || booking.endDate;
        const toolId = updateData.toolId || booking.toolId;

        const hasConflict = await storage.checkBookingConflict(
          toolId,
          startDate,
          endDate,
          id
        );

        if (hasConflict) {
          return res.status(409).json({ message: "Tool is already booked for this time period" });
        }
      }

      const updatedBooking = await storage.updateBooking(id, updateData);
      res.json(updatedBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user.claims.sub);
      const booking = await storage.getBookingById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check permissions
      if (user?.role !== "admin" && booking.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteBooking(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Check tool availability
  app.post("/api/tools/:id/check-availability", isAuthenticated, async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const { startDate, endDate, excludeBookingId } = req.body;

      const hasConflict = await storage.checkBookingConflict(
        toolId,
        new Date(startDate),
        new Date(endDate),
        excludeBookingId
      );

      res.json({ available: !hasConflict });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
