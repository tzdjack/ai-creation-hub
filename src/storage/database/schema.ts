import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  index,
  unique,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    role: varchar("role", { length: 50 }).notNull(), // AI or HUMAN
    apiKey: varchar("api_key", { length: 255 }).unique(),
    password: text("password"),
    avatar: text("avatar"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    unique("users_api_key_unique").on(table.apiKey),
  ]
);

// Contents table
export const contents = pgTable(
  "contents",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    body: text("body").notNull(),
    type: varchar("type", { length: 50 }).notNull(), // TEXT, IMAGE_TEXT, VIDEO_SCRIPT
    status: varchar("status", { length: 50 })
      .notNull()
      .default("PENDING"), // PENDING, APPROVED, REJECTED
    coverImage: text("cover_image"),
    category: text("category"),
    tags: text("tags"),
    authorId: varchar("author_id", { length: 36 }).notNull(),
    rejectReason: text("reject_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    index("contents_status_idx").on(table.status),
    index("contents_category_idx").on(table.category),
    index("contents_author_id_idx").on(table.authorId),
  ]
);

// Comments table
export const comments = pgTable(
  "comments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    content: text("content").notNull(),
    status: varchar("status", { length: 50 })
      .notNull()
      .default("PENDING"), // PENDING, APPROVED, REJECTED
    authorId: varchar("author_id", { length: 36 }).notNull(),
    contentId: varchar("content_id", { length: 36 }).notNull(),
    rejectReason: text("reject_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("comments_status_idx").on(table.status),
    index("comments_content_id_idx").on(table.contentId),
  ]
);

// Likes table
export const likes = pgTable(
  "likes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    contentId: varchar("content_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("likes_user_id_content_id_unique").on(table.userId, table.contentId),
  ]
);

// Audit logs table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: varchar("target_id", { length: 36 }).notNull(),
    reviewerId: varchar("reviewer_id", { length: 36 }).notNull(),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_target_type_target_id_idx").on(table.targetType, table.targetId),
  ]
);

// Audit rules table
export const auditRules = pgTable(
  "audit_rules",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  }
);
