// buzair6/tooltrackpro/ToolTrackPro-6f84785a6a149e311d88bfdf7ddafe3f8e316550/server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertToolSchema, insertBookingSchema, updateBookingSchema, insertChecklistTemplateItemSchema } from "@shared/schema";
import { z } from "zod";
import { getAiResponse } from "./gemini";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

// Zod schema for creating/updating a checklist template
const checklistTemplateBodySchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }),
  description: z.string().optional(),
  items: z.array(insertChecklistTemplateItemSchema.omit({ id: true, templateId: true })).optional().default([]),
});


// Simple session store for demo purposes
const sessions = new Map<string, { userId: string; expires: Date }>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createSession(userId: string): string {
  const sessionId = generateSessionId();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  sessions.set(sessionId, { userId, expires });
  return sessionId;
}

function getSessionUser(sessionId: string): string | null {
  const session = sessions.get(sessionId);
  if (!session || session.expires < new Date()) {
    if (session) sessions.delete(sessionId);
    return null;
  }
  return session.userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.upsertUser({
        id: `user_${email.replace('@', '_').replace('.', '_')}`,
        email,
        firstName: email.split('@')[0],
        lastName: 'User',
        profileImageUrl: '',
        role: email.includes('admin') ? 'admin' : 'user',
      });

      const sessionId = createSession(user.id);
      res.cookie('session', sessionId, { 
        httpOnly: true, 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
      });
      
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid credentials" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { firstName, lastName, email, password } = registerSchema.parse(req.body);
      
      const user = await storage.upsertUser({
        id: `user_${email.replace('@', '_').replace('.', '_')}`,
        email,
        firstName,
        lastName,
        profileImageUrl: '',
        role: 'user',
      });

      res.json({ user, message: "Account created successfully" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      sessions.delete(sessionId);
      res.clearCookie('session');
    }
    res.json({ message: "Logged out successfully" });
  });

  app.get('/api/auth/user', async (req, res) => {
    try {
      const sessionId = req.cookies?.session;
      if (!sessionId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = getSessionUser(sessionId);
      if (!userId) {
        return res.status(401).json({ message: "Session expired" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  // AI Chat Routes
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const sessionId = req.cookies?.session;
      if (!sessionId) return res.status(401).json({ message: "Not authenticated" });
      const userId = getSessionUser(sessionId);
      if (!userId) return res.status(401).json({ message: "Session expired" });

      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get all bookings and tools data to provide context to the AI
      const bookings = await storage.getAllBookings();
      const tools = await storage.getAllTools();

      // Construct a detailed prompt for the AI
      const detailedPrompt = `
        You are an AI assistant for a tool booking system called ToolBooker Pro.
        Here is the current data from the system:
        Tools: ${JSON.stringify(tools, null, 2)}
        Bookings: ${JSON.stringify(bookings, null, 2)}

        The user is asking: "${message}"

        Please provide a helpful and insightful response based on the provided data.
      `;

      const aiResponse = await getAiResponse(detailedPrompt);

      const chat = await storage.createChat({
        userId,
        message,
        response: aiResponse,
      });

      res.status(201).json(chat);
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  app.get("/api/ai/chats", async (req, res) => {
    try {
      const sessionId = req.cookies?.session;
      if (!sessionId) return res.status(401).json({ message: "Not authenticated" });
      const userId = getSessionUser(sessionId);
      if (!userId) return res.status(401).json({ message: "Session expired" });

      const chats = await storage.getChatsByUserId(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Tool routes
  app.get("/api/tools", async (req, res) => {
    try {
      const tools = await storage.getAllTools();
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Failed to fetch tools" });
    }
  });

  app.get("/api/tools/:id", async (req, res) => {
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

  app.post("/api/tools", async (req: any, res) => {
    try {
      const toolData = insertToolSchema.parse(req.body);
      
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

  app.put("/api/tools/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const toolData = insertToolSchema.partial().parse(req.body);
      
      const existingTool = await storage.getToolById(id);
      if (!existingTool) {
        return res.status(404).json({ message: "Tool not found" });
      }

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

  app.delete("/api/tools/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTool(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tool:", error);
      res.status(500).json({ message: "Failed to delete tool" });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req: any, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/pending", async (req: any, res) => {
    try {
      const bookings = await storage.getPendingBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      res.status(500).json({ message: "Failed to fetch pending bookings" });
    }
  });

  app.get("/api/bookings/calendar", async (req, res) => {
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

  app.post("/api/bookings", async (req: any, res) => {
    try {
      const sessionId = req.cookies?.session;
      if (!sessionId) return res.status(401).json({ message: "Not authenticated" });
      const userId = getSessionUser(sessionId);
      if (!userId) return res.status(401).json({ message: "Session expired" });

      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: userId,
      });

      const hasConflict = await storage.checkBookingConflict(
        bookingData.toolId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (hasConflict) {
        return res.status(409).json({ message: "Tool is already booked for this time period" });
      }

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

  app.put("/api/bookings/:id", async (req: any, res) => {
    try {
      const sessionId = req.cookies?.session;
      if (!sessionId) return res.status(401).json({ message: "Not authenticated" });
      const adminId = getSessionUser(sessionId);
      if (!adminId) return res.status(401).json({ message: "Session expired" });
      
      const id = parseInt(req.params.id);
      const booking = await storage.getBookingById(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const updateData = updateBookingSchema.parse(req.body);

      // If admin is approving/denying
      if (updateData.status) {
        const adminUser = await storage.getUser(adminId);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Not an admin" });
        }
        
        if (updateData.status === "approved") {
          updateData.approvedBy = adminId;
          updateData.approvedAt = new Date();
        }
      }

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

  app.delete("/api/bookings/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBooking(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete tool" });
    }
  });

  // Check tool availability
  app.post("/api/tools/:id/check-availability", async (req, res) => {
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
  
  // Checklist Template Routes
  app.get("/api/checklist-templates", async (req, res) => {
    try {
      const templates = await storage.getAllChecklistTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching checklist templates:", error);
      res.status(500).json({ message: "Failed to fetch checklist templates" });
    }
  });

  app.post("/api/checklist-templates", async (req, res) => {
    try {
      const { name, description, items } = checklistTemplateBodySchema.parse(req.body);
      const template = await storage.createChecklistTemplate({ name, description }, items);
      res.status(201).json(template);
    } catch (error) {
       if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid checklist data", errors: error.errors });
      }
      console.error("Error creating checklist template:", error);
      res.status(500).json({ message: "Failed to create checklist template" });
    }
  });
  
  app.put("/api/checklist-templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id, 10);
      const { name, description, items } = checklistTemplateBodySchema.parse(req.body);
      const template = await storage.updateChecklistTemplate(templateId, { name, description }, items);
      res.status(200).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid checklist data", errors: error.errors });
      }
      console.error("Error updating checklist template:", error);
      res.status(500).json({ message: "Failed to update checklist template" });
    }
  });

  // Tool-Checklist Association
  app.post("/api/tools/:id/checklist", async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const { templateId } = req.body;
      await storage.assignChecklistToTool(toolId, templateId);
      res.status(200).json({ message: "Checklist assigned successfully" });
    } catch (error) {
      console.error("Error assigning checklist:", error);
      res.status(500).json({ message: "Failed to assign checklist" });
    }
  });
  
  app.get("/api/tools/:id/checklist", async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const checklist = await storage.getChecklistForTool(toolId);
      if (!checklist) {
        return res.status(404).json({ message: "No checklist assigned to this tool." });
      }
      res.json(checklist);
    } catch (error) {
      console.error("Error fetching checklist for tool:", error);
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });
  
  // Inspection Routes
  app.get("/api/inspections", async (req, res) => {
    try {
      const inspections = await storage.getAllInspections();
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  app.post("/api/inspections", async (req, res) => {
    try {
      const sessionId = req.cookies?.session;
      if (!sessionId) return res.status(401).json({ message: "Not authenticated" });
      const userId = getSessionUser(sessionId);
      if (!userId) return res.status(401).json({ message: "Session expired" });

      const inspectionData = { ...req.body, inspectedByUserId: userId };
      const inspection = await storage.createInspection(inspectionData);
      res.status(201).json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      res.status(500).json({ message: "Failed to create inspection" });
    }
  });

  app.get("/api/tools/:id/inspections", async (req, res) => {
    try {
      const toolId = parseInt(req.params.id);
      const inspections = await storage.getInspectionsForTool(toolId);
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching inspections for tool:", error);
      res.status(500).json({ message: "Failed to fetch inspections" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}