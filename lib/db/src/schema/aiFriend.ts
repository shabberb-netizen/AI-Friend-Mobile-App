import {
  boolean,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type SyncSnapshot = {
  settings?: Record<string, unknown>;
  messages?: unknown[];
  gallery?: unknown[];
  roleplayMode?: string;
  friends?: unknown[];
  friendMessages?: unknown[];
};

export const aiFriendSyncTable = pgTable("ai_friend_sync", {
  userId: text("user_id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  snapshot: jsonb("snapshot").$type<SyncSnapshot>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiFriendConnectionsTable = pgTable(
  "ai_friend_connections",
  {
    userId: text("user_id").notNull(),
    provider: text("provider").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    grantedScopes: jsonb("granted_scopes").$type<string[]>().notNull().default([]),
    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userProvider: primaryKey({ columns: [table.userId, table.provider] }),
  }),
);