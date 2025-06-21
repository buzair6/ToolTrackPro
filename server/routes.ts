import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertToolSchema, insertBookingSchema, updateBookingSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth } from "./middleware";

// --- Authentication Logic (moved here to fix import error) ---

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string(),
  lastName: z.string(),
});

function registerAuthRoutes(app: Express) {
  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      res.json({ message: "Logged in successfully", user });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = signupSchema.parse(req.body);
      let existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const newUser = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        role: email.endsWith('@admin.com') ? 'admin' : 'user',
      });

      res.status(201).json({ message: "User created successfully", user: newUser });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/logout', (req: any, res) => {
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
  });
}

// --- Main Route Registration ---

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected API routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/tools", requireAuth, async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req: any, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const hasConflict = await storage.checkBookingConflict(bookingData.toolId, bookingData.startDate, bookingData.endDate);
      if (hasConflict) {
        return res.status(409).json({ message: "Tool is already booked for this time period" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", requireAuth, async (req: any, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  
  app.put("/api/bookings/:id", requireAuth, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const booking = await storage.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        const updateData = updateBookingSchema.parse(req.body);
        const updatedBooking = await storage.updateBooking(id, updateData);
        res.json(updatedBooking);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update booking" });
    }
});


  const httpServer = createServer(app);
  return httpServer;
}