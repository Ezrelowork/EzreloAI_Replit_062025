import { pgTable, text, serial, json } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AddressSearch = z.infer<typeof addressSearchSchema>;
export type ServiceProvider = z.infer<typeof serviceProviderSchema>;
export type ServiceProvidersData = {
  [key: string]: ServiceProvider | ServiceProvider[];
};
