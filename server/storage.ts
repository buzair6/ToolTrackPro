// buzair6/tooltrackpro/ToolTrackPro-8a5ce222c6a9b31c2381b39645d88b4ea0eb842e/server/storage.ts
import {
  users,
  tools,
  bookings,
  checklistTemplates,
  checklistTemplateItems,
  toolChecklists,
  checklistInspections,
  checklistInspectionItems,
  chats,
  type User,
  type UpsertUser,
  type Tool,
  type InsertTool,
  type Booking,
  type InsertBooking,
  type UpdateBooking,
  type BookingWithRelations,
  type ChecklistTemplate,
  type ChecklistTemplateItem,
  type InsertChecklistTemplate,
  type InsertChecklistTemplateItem,
  type ChecklistTemplateWithItems,
  type Chat,
  type InsertChat,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, desc, asc, lt, gt, ne, sql } from "drizzle-orm";

// Define extended type for inspection with relations
export type InspectionWithRelations = typeof checklistInspections.$inferSelect & {
  tool: Tool;
  template: ChecklistTemplate;
  inspector: User;
  items: (typeof checklistInspectionItems.$inferSelect & {
    templateItem: ChecklistTemplateItem;
  })[];
};

// Helper function to get number of working days in a month (Monday-Friday)
function getWorkingDaysInMonth(year: number, month: number): number {
    let workingDays = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek > 0 && dayOfWeek < 6) { // Monday to Friday
            workingDays++;
        }
    }
    return workingDays;
}

export interface IStorage {
  // Checklist Template Operations
  createChecklistTemplate(templateData: InsertChecklistTemplate, itemsData: Omit<InsertChecklistTemplateItem, 'templateId'>[]): Promise<ChecklistTemplate>;
  updateChecklistTemplate(templateId: number, templateData: Partial<InsertChecklistTemplate>, itemsData: Omit<InsertChecklistTemplateItem, 'templateId'>[]): Promise<ChecklistTemplate>;
  getAllChecklistTemplates(): Promise<ChecklistTemplateWithItems[]>;
  getChecklistForTool(toolId: number): Promise<ChecklistTemplateWithItems | undefined>;
  assignChecklistToTool(toolId: number, templateId: number): Promise<void>;

  // Inspection Operations
  createInspection(inspectionData: { toolId: number; templateId: number; inspectedByUserId: string; items: { templateItemId: number; valueText?: string; valueBoolean?: boolean; valueImageUrl?: string }[] }): Promise<any>;
  getInspectionsForTool(toolId: number): Promise<any[]>;
  getAllInspections(): Promise<any[]>;
  
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
    toolAvailability: number;
    toolUtilization: number;
  }>;

  // AI Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getChatsByUserId(userId: string): Promise<Chat[]>;
}

export class DatabaseStorage implements IStorage {
  // ... (existing methods are the same)
  // Checklist Template Operations
  async createChecklistTemplate(templateData: InsertChecklistTemplate, itemsData: Omit<InsertChecklistTemplateItem, 'templateId'>[]): Promise<ChecklistTemplate> {
    return db.transaction(async (tx) => {
      const [newTemplate] = await tx.insert(checklistTemplates).values(templateData).returning();
      if (itemsData && itemsData.length > 0) {
        const itemsToInsert = itemsData.map(item => ({ ...item, templateId: newTemplate.id }));
        await tx.insert(checklistTemplateItems).values(itemsToInsert);
      }
      return newTemplate;
    });
  }
  
  async updateChecklistTemplate(templateId: number, templateData: Partial<InsertChecklistTemplate>, itemsData: Omit<InsertChecklistTemplateItem, 'templateId'>[]): Promise<ChecklistTemplate> {
    return db.transaction(async (tx) => {
      // Update the template details
      const [updatedTemplate] = await tx.update(checklistTemplates)
        .set({ ...templateData, updatedAt: new Date() })
        .where(eq(checklistTemplates.id, templateId))
        .returning();

      // Clear existing items and insert the new ones
      await tx.delete(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, templateId));
      if (itemsData && itemsData.length > 0) {
        const itemsToInsert = itemsData.map(item => ({ ...item, templateId: updatedTemplate.id }));
        await tx.insert(checklistTemplateItems).values(itemsToInsert);
      }

      return updatedTemplate;
    });
  }

  async getAllChecklistTemplates(): Promise<ChecklistTemplateWithItems[]> {
    const templates = await db.select().from(checklistTemplates).orderBy(asc(checklistTemplates.name));
    const result: ChecklistTemplateWithItems[] = [];
    for (const template of templates) {
      const items = await db.select().from(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, template.id)).orderBy(asc(checklistTemplateItems.itemOrder));
      result.push({ ...template, items });
    }
    return result;
  }
  
  async assignChecklistToTool(toolId: number, templateId: number): Promise<void> {
    await db.insert(toolChecklists)
      .values({ toolId, templateId })
      .onConflictDoUpdate({
        target: toolChecklists.toolId,
        set: { templateId },
      });
  }
  
  async getChecklistForTool(toolId: number): Promise<ChecklistTemplateWithItems | undefined> {
    const [toolChecklist] = await db.select().from(toolChecklists).where(eq(toolChecklists.toolId, toolId));
    if (!toolChecklist) return undefined;
    
    const [template] = await db.select().from(checklistTemplates).where(eq(checklistTemplates.id, toolChecklist.templateId));
    if (!template) return undefined;
    
    const items = await db.select().from(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, template.id)).orderBy(asc(checklistTemplateItems.itemOrder));
    
    return { ...template, items };
  }

  // Inspection Operations
  async createInspection(inspectionData: { toolId: number; templateId: number; inspectedByUserId: string; items: { templateItemId: number; valueText?: string; valueBoolean?: boolean; valueImageUrl?: string }[] }): Promise<any> {
    return db.transaction(async (tx) => {
      const [newInspection] = await tx.insert(checklistInspections).values({
        toolId: inspectionData.toolId,
        templateId: inspectionData.templateId,
        inspectedByUserId: inspectionData.inspectedByUserId,
      }).returning();
      
      if (inspectionData.items && inspectionData.items.length > 0) {
        const itemsToInsert = inspectionData.items.map(item => ({
          ...item,
          inspectionId: newInspection.id,
        }));
        await tx.insert(checklistInspectionItems).values(itemsToInsert);
      }
      return newInspection;
    });
  }

  async getInspectionsForTool(toolId: number): Promise<any[]> {
    const inspections = await db.select().from(checklistInspections).where(eq(checklistInspections.toolId, toolId)).orderBy(desc(checklistInspections.inspectionDate));
    // This could be expanded to return items for each inspection as well
    return inspections;
  }

  async getAllInspections(): Promise<any[]> {
    return await db.query.checklistInspections.findMany({
      with: {
        tool: true,
        template: true,
        inspector: true,
      },
      orderBy: [desc(checklistInspections.inspectionDate)],
    });
  }
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
    toolAvailability: number;
    toolUtilization: number;
  }> {
    const [totalToolsResult] = await db
      .select({ count: sql<number>`cast(count(${tools.id}) as int)` })
      .from(tools);
    
    const [availableToolsResult] = await db
      .select({ count: sql<number>`cast(count(${tools.id}) as int)` })
      .from(tools)
      .where(eq(tools.status, "available"));
    
    const [pendingRequestsResult] = await db
      .select({ count: sql<number>`cast(count(${bookings.id}) as int)` })
      .from(bookings)
      .where(eq(bookings.status, "pending"));
    
    const now = new Date();
    const [activeBookingsResult] = await db
      .select({ count: sql<number>`cast(count(${bookings.id}) as int)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "approved"),
          lte(bookings.startDate, now),
          gte(bookings.endDate, now)
        )
      );
      
    const year = now.getFullYear();
    const month = now.getMonth();
    const workingDays = getWorkingDaysInMonth(year, month);
    const shiftHours = 11; // 8:00 to 19:00

    const totalAvailableHours = (totalToolsResult.count || 0) * workingDays * shiftHours;
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const monthlyBookings = await db
        .select({ duration: bookings.duration })
        .from(bookings)
        .where(
            and(
                eq(bookings.status, 'approved'),
                gte(bookings.startDate, startOfMonth),
                lte(bookings.startDate, endOfMonth)
            )
        );

    const totalBookedHours = monthlyBookings.reduce((sum, b) => sum + (b.duration || 0), 0);

    const toolUtilization = totalAvailableHours > 0 ? (totalBookedHours / totalAvailableHours) * 100 : 0;
    const toolAvailability = 100 - toolUtilization;

    return {
      totalTools: totalToolsResult.count || 0,
      availableTools: availableToolsResult.count || 0,
      pendingRequests: pendingRequestsResult.count || 0,
      activeBookings: activeBookingsResult.count || 0,
      toolAvailability: parseFloat(toolAvailability.toFixed(2)),
      toolUtilization: parseFloat(toolUtilization.toFixed(2)),
    };
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async getChatsByUserId(userId: string): Promise<Chat[]> {
    return await db.select().from(chats).where(eq(chats.userId, userId)).orderBy(asc(chats.createdAt));
  }
}

export const storage = new DatabaseStorage();