import { pgTable, text, serial, json, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  providers: json("providers").notNull(),
});

export const referralClicks = pgTable("referral_clicks", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  category: text("category").notNull(),
  action: text("action").notNull(),
  userAddress: text("user_address").notNull(),
  timestamp: text("timestamp").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

export const movingProjects = pgTable("moving_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  moveDate: text("move_date"),
  selectedMover: json("selected_mover"),
  projectStatus: text("project_status").notNull().default("searching"), // searching, mover_selected, quote_received, booked, in_progress, completed
  questionnaireData: json("questionnaire_data"),
  lastQuestionnaireUpdate: timestamp("last_questionnaire_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  taskName: text("task_name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  dueDate: text("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const movingCommunications = pgTable("moving_communications", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  communicationType: text("communication_type").notNull(), // call, email, visit, quote, contract
  subject: text("subject").notNull(),
  notes: text("notes"),
  contactPerson: text("contact_person"),
  nextFollowUp: text("next_follow_up"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const addressSearchSchema = z.object({
  address: z.string().min(1, "Address is required"),
});

export const serviceProviderSchema = z.object({
  category: z.string(),
  provider: z.string(),
  phone: z.string(),
  description: z.string().optional(),
  website: z.string().optional(),
  hours: z.string().optional(),
  referralUrl: z.string().optional(),
  affiliateCode: z.string().optional(),
});

export const referralClickSchema = z.object({
  provider: z.string(),
  category: z.string(),
  action: z.enum(['signup', 'quote', 'learn_more']),
  userAddress: z.string(),
  timestamp: z.string(),
});

export const movingProjectSchema = createInsertSchema(movingProjects).pick({
  userId: true,
  fromAddress: true,
  toAddress: true,
  moveDate: true,
  selectedMover: true,
  projectStatus: true,
  questionnaireData: true,
  lastQuestionnaireUpdate: true,
});

export const projectTaskSchema = createInsertSchema(projectTasks).pick({
  projectId: true,
  taskName: true,
  description: true,
  status: true,
  dueDate: true,
});

export const movingCommunicationSchema = createInsertSchema(movingCommunications).pick({
  projectId: true,
  communicationType: true,
  subject: true,
  notes: true,
  contactPerson: true,
  nextFollowUp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AddressSearch = z.infer<typeof addressSearchSchema>;
export type ServiceProvider = z.infer<typeof serviceProviderSchema>;
export type ServiceProvidersData = {
  [key: string]: ServiceProvider | ServiceProvider[];
};
export type MovingProject = typeof movingProjects.$inferSelect;
export type InsertMovingProject = z.infer<typeof movingProjectSchema>;
export type ProjectTask = typeof projectTasks.$inferSelect;
export type InsertProjectTask = z.infer<typeof projectTaskSchema>;
export type MovingCommunication = typeof movingCommunications.$inferSelect;
export type InsertMovingCommunication = z.infer<typeof movingCommunicationSchema>;
