import {
  users,
  tools,
  bookings,
  type User,
  type UpsertUser,
  type Tool,
  type InsertTool,
  type Booking,
  type InsertBooking,
  type UpdateBooking,
  type BookingWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, desc, asc, lt, gt, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Tool operations
  getAllTools(): Promise<Tool[]>;
  getToolById(id: number): Promise<Tool | undefined>;
  getToolByToolId(toolId: string): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateTool(id: number, tool: Partial<InsertTool>): Promise<Tool>;
  deleteTool(id: number): Promise<void>;

  // Booking operations
  getAllBookings(): Promise<BookingWithRelations[]>;
  getBookingById(id: number): Promise<BookingWithRelations | undefined>;
  getBookingsByUserId(userId: string): Promise<BookingWithRelations[]>;
  getBookingsByToolId(toolId: number): Promise<BookingWithRelations[]>;
  getPendingBookings(): Promise<BookingWithRelations[]>;
  getBookingsByDateRange(startDate: Date, endDate: Date): Promise<BookingWithRelations[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: UpdateBooking): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;
  
  // Conflict checking
  checkBookingConflict(toolId: number, startDate: Date, endDate: Date, excludeBookingId?: number): Promise<boolean>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalTools: number;
    availableTools: number;
    pendingRequests: number;
    activeBookings: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tool operations
  async getAllTools(): Promise<Tool[]> {
    return await db.select().from(tools).orderBy(asc(tools.name));
  }

  async getToolById(id: number): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  }

  async getToolByToolId(toolId: string): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.toolId, toolId));
    return tool;
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [newTool] = await db.insert(tools).values(tool).returning();
    return newTool;
  }

  async updateTool(id: number, tool: Partial<InsertTool>): Promise<Tool> {
    const [updatedTool] = await db
      .update(tools)
      .set({ ...tool, updatedAt: new Date() })
      .where(eq(tools.id, id))
      .returning();
    return updatedTool;
  }

  async deleteTool(id: number): Promise<void> {
    await db.delete(tools).where(eq(tools.id, id));
  }

  // Booking operations
  async getAllBookings(): Promise<BookingWithRelations[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(tools, eq(bookings.toolId, tools.id))
      .orderBy(desc(bookings.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.bookings,
          user: row.users!,
          tool: row.tools!,
        }))
      );
  }

  async getBookingById(id: number): Promise<BookingWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(tools, eq(bookings.toolId, tools.id))
      .where(eq(bookings.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.bookings,
      user: result.users!,
      tool: result.tools!,
    };
  }

  async getBookingsByUserId(userId: string): Promise<BookingWithRelations[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(tools, eq(bookings.toolId, tools.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.startDate))
      .then(rows => 
        rows.map(row => ({
          ...row.bookings,
          user: row.users!,
          tool: row.tools!,
        }))
      );
  }

  async getBookingsByToolId(toolId: number): Promise<BookingWithRelations[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(tools, eq(bookings.toolId, tools.id))
      .where(eq(bookings.toolId, toolId))
      .orderBy(desc(bookings.startDate))
      .then(rows => 
        rows.map(row => ({
          ...row.bookings,
          user: row.users!,
          tool: row.tools!,
        }))
      );
  }

  async getPendingBookings(): Promise<BookingWithRelations[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(tools, eq(bookings.toolId, tools.id))
      .where(eq(bookings.status, "pending"))
      .orderBy(asc(bookings.startDate))
      .then(rows => 
        rows.map(row => ({
          ...row.bookings,
          user: row.users!,
          tool: row.tools!,
        }))
      );
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<BookingWithRelations[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(tools, eq(bookings.toolId, tools.id))
      .where(
        and(
          // Correct logic for overlapping intervals
          lte(bookings.startDate, endDate),
          gte(bookings.endDate, startDate),
          // Only show relevant bookings on the calendar
          or(
            eq(bookings.status, "approved"),
            eq(bookings.status, "pending")
          )
        )
      )
      .orderBy(asc(bookings.startDate))
      .then(rows => 
        rows.map(row => ({
          ...row.bookings,
          user: row.users!,
          tool: row.tools!,
        }))
      );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, booking: UpdateBooking): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async checkBookingConflict(toolId: number, startDate: Date, endDate: Date, excludeBookingId?: number): Promise<boolean> {
    const conditions = [
        eq(bookings.toolId, toolId),
        or(
            eq(bookings.status, "approved"),
            eq(bookings.status, "pending")
        ),
        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        lt(bookings.startDate, endDate),
        gt(bookings.endDate, startDate)
    ];

    if (excludeBookingId) {
        conditions.push(ne(bookings.id, excludeBookingId));
    }

    const conflictingBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(and(...conditions));

    return conflictingBookings.length > 0;
  }

  async getDashboardStats(): Promise<{
    totalTools: number;
    availableTools: number;
    pendingRequests: number;
    activeBookings: number;
  }> {
    const [totalToolsResult] = await db
      .select({ count: tools.id })
      .from(tools);
    
    const [availableToolsResult] = await db
      .select({ count: tools.id })
      .from(tools)
      .where(eq(tools.status, "available"));
    
    const [pendingRequestsResult] = await db
      .select({ count: bookings.id })
      .from(bookings)
      .where(eq(bookings.status, "pending"));
    
    const now = new Date();
    const [activeBookingsResult] = await db
      .select({ count: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "approved"),
          lte(bookings.startDate, now),
          gte(bookings.endDate, now)
        )
      );

    return {
      totalTools: Number(totalToolsResult?.count) || 0,
      availableTools: Number(availableToolsResult?.count) || 0,
      pendingRequests: Number(pendingRequestsResult?.count) || 0,
      activeBookings: Number(activeBookingsResult?.count) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
