import { pgTable, uuid, varchar, text, timestamp, inet, jsonb, integer, boolean } from 'drizzle-orm/pg-core';

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  placeId: varchar('place_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  lat: varchar('lat', { length: 20 }),
  lng: varchar('lng', { length: 20 }),
  phone: varchar('phone', { length: 50 }),
  website: text('website'),
  types: jsonb('types').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 64 }).notNull().unique(),
  businessId: uuid('business_id').references(() => businesses.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  initiatedAt: timestamp('initiated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').references(() => scans.id, { onDelete: 'cascade' }).notNull(),
  overallScore: integer('overall_score').notNull(),
  searchVisibilityScore: integer('search_visibility_score').notNull(),
  websiteExperienceScore: integer('website_experience_score').notNull(),
  localListingsScore: integer('local_listings_score').notNull(),
  rawData: jsonb('raw_data').notNull(),
  problems: jsonb('problems'),
  competitors: jsonb('competitors'),
  revenueEstimate: jsonb('revenue_estimate'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

export const emailCaptures = pgTable('email_captures', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').references(() => scans.id),
  email: varchar('email', { length: 255 }).notNull(),
  storeName: varchar('store_name', { length: 255 }),
  optedInMarketing: boolean('opted_in_marketing').default(false),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
});

export const scanJobs = pgTable('scan_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').references(() => scans.id).notNull(),
  jobType: varchar('job_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('queued'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  result: jsonb('result'),
});

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type EmailCapture = typeof emailCaptures.$inferSelect;
export type NewEmailCapture = typeof emailCaptures.$inferInsert;
export type ScanJob = typeof scanJobs.$inferSelect;
export type NewScanJob = typeof scanJobs.$inferInsert;
