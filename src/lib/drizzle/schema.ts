import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex
} from "drizzle-orm/sqlite-core";

export const replicache_space = sqliteTable("replicache_space", {
	id: text("id").notNull().primaryKey(),
	version: integer("version")
});

export const replicache_client_group = sqliteTable("replicache_client_group", {
	id: text("id").notNull().primaryKey(),
	userId: text("user_id").notNull(),
	spaceId: text("space_id").notNull()
});

export const replicache_client = sqliteTable("replicache_client", {
	id: text("id").notNull().primaryKey(),
	client_group_id: text("client_group_id").notNull(),
	last_mutation_id: integer("last_mutation_id").notNull(),
	version: integer("version").notNull()
});

export const rps_room = sqliteTable("rps_room", {
	id: text("id").notNull().primaryKey(),
	roomName: text("room_name").notNull().unique(),
	spaceId: text("space_id").notNull(),
	adminId: text("admin_id").notNull(),
	type: text("type").notNull(),
	round: integer("round").notNull(),
	lastRoundChange: integer("last_round_change")
});

export const rps_player = sqliteTable("rps_player", {
	id: text("id").notNull().primaryKey(),
	userId: text("user_id").notNull(),
	username: text("username").notNull(),
	spaceId: text("space_id").notNull(),
	round: integer("round"),
	lastChoice: integer("last_choice"),
	matchup: integer("matchup")
});

export const analytics = sqliteTable("analytics", {
	id: text("id").notNull().primaryKey(),
	location: text("location").notNull(),
	month: text("month").notNull(),
	qty: integer("qty")
});

export type ReplicacheSpace = typeof replicache_space.$inferSelect;
export type InsertReplicacheSpace = typeof replicache_client.$inferInsert;

export type RPSRoom = typeof rps_room.$inferSelect;
export type InsertRPSRoom = typeof rps_room.$inferInsert;

export type ReplicacheClient = typeof replicache_client.$inferSelect;
export type InsertReplicacheClient = typeof replicache_client.$inferInsert;

export type InsertAnalytics = typeof analytics.$inferInsert;
