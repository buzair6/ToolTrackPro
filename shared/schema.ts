import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // 'admin' or 'user'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  toolId: varchar("tool_id").notNull().unique(),
  description: text("description"),
  category: varchar("category").notNull(),
  location: varchar("location").notNull(),
  status: varchar("status").notNull().default("available"), // 'available', 'maintenance', 'out-of-order'
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  toolId: integer("tool_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  duration: integer("duration").notNull(), // in hours
  purpose: text("purpose"),
  status: varchar("status").notNull().default("pending"), // 'pending', 'approved', 'denied', 'completed'
  cost: decimal("cost", { precision: 10, scale: 2 }),
  fuelUsed: decimal("fuel_used", { precision: 10, scale: 2 }),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const checklistTemplates = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const checklistTemplateItems = pgTable("checklist_template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => checklistTemplates.id, { onDelete: 'cascade' }),
  label: varchar("label").notNull(),
  type: varchar("type").notNull(), // 'tick', 'value', 'image'
  required: boolean("required").default(false),
  itemOrder: integer("item_order").notNull(),
});

// A tool can have one checklist template
export const toolChecklists = pgTable("tool_checklists", {
  toolId: integer("tool_id").primaryKey().references(() => tools.id, { onDelete: 'cascade' }),
  templateId: integer("template_id").notNull().references(() => checklistTemplates.id, { onDelete: 'cascade' }),
});

export const checklistInspections = pgTable("checklist_inspections", {
    id: serial("id").primaryKey(),
    toolId: integer("tool_id").notNull().references(() => tools.id),
    templateId: integer("template_id").notNull().references(() => checklistTemplates.id),
    inspectedByUserId: varchar("inspected_by_user_id").notNull().references(() => users.id),
    inspectionDate: timestamp("inspection_date").defaultNow(),
});

export const checklistInspectionItems = pgTable("checklist_inspection_items", {
    id: serial("id").primaryKey(),
    inspectionId: integer("inspection_id").notNull().references(() => checklistInspections.id, { onDelete: 'cascade' }),
    templateItemId: integer("template_item_id").notNull().references(() => checklistTemplateItems.id),
    valueText: text("value_text"), // for 'value' type
    valueBoolean: boolean("value_boolean"), // for 'tick' type
    valueImageUrl: varchar("value_image_url"), // for 'image' type
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  approvedBookings: many(bookings),
  inspections: many(checklistInspections),
}));

export const toolsRelations = relations(tools, ({ many, one }) => ({
  bookings: many(bookings),
  checklist: one(toolChecklists, {
    fields: [tools.id],
    references: [toolChecklists.toolId],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  tool: one(tools, {
    fields: [bookings.toolId],
    references: [tools.id],
  }),
  approver: one(users, {
    fields: [bookings.approvedBy],
    references: [users.id],
  }),
}));

export const checklistTemplatesRelations = relations(checklistTemplates, ({ many }) => ({
  items: many(checklistTemplateItems),
}));

export const checklistTemplateItemsRelations = relations(checklistTemplateItems, ({ one }) => ({
  template: one(checklistTemplates, {
    fields: [checklistTemplateItems.templateId],
    references: [checklistTemplates.id],
  }),
}));

export const toolChecklistsRelations = relations(toolChecklists, ({ one }) => ({
    tool: one(tools, {
        fields: [toolChecklists.toolId],
        references: [tools.id],
    }),
    template: one(checklistTemplates, {
        fields: [toolChecklists.templateId],
        references: [checklistTemplates.id],
    }),
}));

export const checklistInspectionsRelations = relations(checklistInspections, ({ one, many }) => ({
    tool: one(tools, {
        fields: [checklistInspections.toolId],
        references: [tools.id],
    }),
    template: one(checklistTemplates, {
        fields: [checklistInspections.templateId],
        references: [checklistTemplates.id],
    }),
    inspector: one(users, {
        fields: [checklistInspections.inspectedByUserId],
        references: [users.id],
    }),
    items: many(checklistInspectionItems),
}));

export const checklistInspectionItemsRelations = relations(checklistInspectionItems, ({ one }) => ({
    inspection: one(checklistInspections, {
        fields: [checklistInspectionItems.inspectionId],
        references: [checklistInspections.id],
    }),
    templateItem: one(checklistTemplateItems, {
        fields: [checklistInspectionItems.templateItemId],
        references: [checklistTemplateItems.id],
    }),
}));


// Schemas
export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings, {
  // Use z.coerce.date() to handle string-to-Date conversion
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
}).extend({
  duration: z.number().min(2, "Minimum booking duration is 2 hours"),
});

export const updateBookingSchema = createInsertSchema(bookings, {
    // Use z.coerce.date() to handle string-to-Date conversion
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
}).partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type UpdateBooking = z.infer<typeof updateBookingSchema>;

// Extended types with relations
export type BookingWithRelations = Booking & {
  user: User;
  tool: Tool;
  approver?: User;
};

// Checklist types
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
export type ChecklistTemplateItem = typeof checklistTemplateItems.$inferSelect;

// Create Zod schemas for checklist insertion
export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplates);
export const insertChecklistTemplateItemSchema = createInsertSchema(checklistTemplateItems);

// Infer TypeScript types from the Zod schemas
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type InsertChecklistTemplateItem = z.infer<typeof insertChecklistTemplateItemSchema>;